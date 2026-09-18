import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueries, useQuery } from '@tanstack/react-query';

import { ConversationRow } from '../../../components/chat/ConversationRow';
import { ProjectRow } from '../../../components/chat/ProjectRow';
import { SegmentedTabs } from '../../../components/chat/SegmentedTabs';
import { UpdateBanner } from '../../../components/update/UpdateBanner';
import { CreateWorkspaceForm } from '../../../components/workspace/CreateWorkspaceForm';
import { WorkspaceSwitcher } from '../../../components/workspace/WorkspaceSwitcher';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import { getProjectUnreadCount } from '../../../lib/api/chat';
import { listConversations } from '../../../lib/api/direct-chat';
import { listProjects } from '../../../lib/api/projects';
import { useAuth } from '../../../lib/auth/auth-context';
import { useSocket } from '../../../lib/socket/socket-context';
import { usePhienBan } from '../../../lib/version/use-phien-ban';
import { useRefetchOnScreenFocus } from '../../../lib/use-refetch-on-focus';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, lineHeight, radius, scale, scaleWithFont, spacing } from '../../../theme/tokens';

/** Giới hạn để tránh N+1 request bắn cùng lúc trên mạng di động. */
const MAX_UNREAD_QUERIES = 6;

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { active, workspaces, switchTo } = useWorkspace();
  const workspaceId = active?.id;

  const [query, setQuery] = useState('');
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [taoMoiOpen, setTaoMoiOpen] = useState(false);
  const [muc, setMuc] = useState<'du-an' | 'tin-nhan'>('du-an');

  const { onlineUserIds } = useSocket();

  /*
    ĐỪNG hủy cấu trúc ra thành `muc` — màn này đã có một biến tên `muc` cho
    thanh chuyển Dự án / Tin nhắn. Cả hai đều là chuỗi nên trùng tên ở đây cho
    ra một lỗi im lặng mà TypeScript không bắt được.
  */
  const capNhat = usePhienBan();

  const conversationsQuery = useQuery({
    queryKey: ['direct-conversations'],
    queryFn: listConversations,
    /*
      Chỉ gọi khi người dùng thật sự mở mục đó. "Dự án" là mặc định, và phần lớn
      lượt mở app không chạm tới tin nhắn riêng — bắn sẵn lượt gọi chỉ tốn pin
      và dữ liệu di động.
    */
    enabled: muc === 'tin-nhan',
  });

  const projectsQuery = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => listProjects(workspaceId),
    enabled: Boolean(workspaceId),
  });

  // Dự án mới tạo trên web không có sự kiện socket nào, nên phải hỏi lại khi
  // người dùng quay về màn này.
  useRefetchOnScreenFocus(projectsQuery.refetch);

  const projects = projectsQuery.data ?? [];
  const tracked = projects.slice(0, MAX_UNREAD_QUERIES);

  const unreadQueries = useQueries({
    queries: tracked.map((project) => ({
      queryKey: ['chat-unread', project.id],
      queryFn: () => getProjectUnreadCount(project.id),
      staleTime: 15_000,
    })),
  });

  const unreadById = new Map<string, number>();
  tracked.forEach((project, index) => {
    unreadById.set(project.id, unreadQueries[index]?.data?.count ?? 0);
  });

  // Lọc ngay trên danh sách đã tải. Không có endpoint tìm dự án, mà nhóm sinh viên
  // hiếm khi có quá vài chục dự án nên lọc cục bộ là đủ và tức thì.
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter((project) => project.name.toLowerCase().includes(needle));
  }, [projects, query]);

  const openProject = useCallback(
    (projectId: string) => router.push(`/chat/${projectId}`),
    [router],
  );

  const firstName = user?.fullName?.split(' ').slice(-1)[0] ?? '';

  return (
    <View style={styles.screen}>
      <GradientHeader
        title={firstName ? `Chào ${firstName}` : 'Trò chuyện'}
        subtitle={active?.name}
        onPressSubtitle={() => setSwitcherOpen(true)}
        right={
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.fullName ?? '?').charAt(0).toUpperCase()}
            </Text>
          </View>
        }
      >
        <SegmentedTabs
          options={[
            { key: 'du-an', label: 'Dự án' },
            { key: 'tin-nhan', label: 'Tin nhắn' },
          ]}
          value={muc}
          onChange={(key) => setMuc(key as 'du-an' | 'tin-nhan')}
        />

        {/* Ô này lọc dự án, không lọc hội thoại — mục Tin nhắn không cần tới. */}
        {muc === 'du-an' ? (
        <View style={styles.search}>
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.9)" />
          <TextInput
            testID="project-search"
            accessibilityLabel="Tìm dự án"
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm dự án"
            placeholderTextColor="rgba(255,255,255,0.75)"
            style={styles.searchInput}
            // Tự sửa chính tả trong ô tìm kiếm chỉ làm hỏng từ khoá người dùng gõ.
            spellCheck={false}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        ) : null}
      </GradientHeader>

      <View style={styles.body}>
        {capNhat.muc === 'nen-cap-nhat' ? (
          <UpdateBanner phienBanMoi={capNhat.latest} notes={capNhat.notes} />
        ) : null}

        {muc === 'du-an' && projectsQuery.isError ? (
          <ErrorBanner
            message={
              projectsQuery.error instanceof Error
                ? projectsQuery.error.message
                : 'Không tải được danh sách dự án.'
            }
          />
        ) : null}

        {muc === 'tin-nhan' && conversationsQuery.isError ? (
          <ErrorBanner
            message={
              conversationsQuery.error instanceof Error
                ? conversationsQuery.error.message
                : 'Không tải được danh sách tin nhắn.'
            }
          />
        ) : null}

        {muc === 'tin-nhan' ? (
          conversationsQuery.isLoading && !conversationsQuery.data ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={conversationsQuery.data ?? []}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const nguoiKia = item.participants.find(
                  (participant) => participant.userId !== user?.id,
                );

                return (
                  <ConversationRow
                    conversation={item}
                    currentUserId={user?.id ?? ''}
                    online={nguoiKia ? onlineUserIds.has(nguoiKia.userId) : false}
                    onPress={() =>
                      router.push(
                        `/chat/dm/${item.id}?ten=${encodeURIComponent(
                          nguoiKia?.user.fullName ?? '',
                        )}`,
                      )
                    }
                  />
                );
              }}
              refreshControl={
                <RefreshControl
                  refreshing={conversationsQuery.isRefetching}
                  onRefresh={() => conversationsQuery.refetch()}
                  colors={[colors.primary]}
                />
              }
              ListEmptyComponent={
                conversationsQuery.isError ? null : (
                  <View style={styles.empty}>
                    <View style={styles.emptyIcon}>
                      <Ionicons name="chatbubbles-outline" size={28} color={colors.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện nào</Text>
                    <Text style={styles.emptyBody}>
                      Mở một dự án rồi chạm vào tên thành viên để nhắn riêng cho họ.
                    </Text>
                  </View>
                )
              }
            />
          )
        ) : projectsQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(project) => project.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <ProjectRow
                project={item}
                index={index}
                unreadCount={unreadById.get(item.id) ?? 0}
                onPress={() => openProject(item.id)}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={projectsQuery.isRefetching}
                onRefresh={() => projectsQuery.refetch()}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              projectsQuery.isError ? null : (
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <Ionicons
                      name={query ? 'search-outline' : 'chatbubbles-outline'}
                      size={28}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {query ? 'Không tìm thấy dự án nào' : 'Chưa có dự án nào'}
                  </Text>
                  <Text style={styles.emptyBody}>
                    {query
                      ? 'Thử từ khoá khác, hoặc xoá ô tìm kiếm để xem tất cả.'
                      : 'Không gian làm việc này chưa có dự án. Tạo dự án trên web WeDo, rồi quay lại đây để trò chuyện cùng nhóm.'}
                  </Text>
                </View>
              )
            }
          />
        )}
      </View>

      <WorkspaceSwitcher
        visible={switcherOpen}
        workspaces={workspaces}
        activeId={workspaceId}
        onSelect={(id) => void switchTo(id)}
        onCreate={() => setTaoMoiOpen(true)}
        onDismiss={() => setSwitcherOpen(false)}
      />

      <Modal
        visible={taoMoiOpen}
        animationType="slide"
        onRequestClose={() => setTaoMoiOpen(false)}
      >
        <CreateWorkspaceForm onDone={() => setTaoMoiOpen(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  avatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.onPrimary, fontWeight: '700', fontSize: fontSize.md },
  search: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    // Ô có chữ bên trong: `minHeight` để chữ phóng to thì ô cao theo.
    minHeight: scaleWithFont(44),
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.sm + 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.onPrimary,
    fontSize: fontSize.sm,
    paddingVertical: 0,
  },
  // Nội dung kéo lên chồng mép gradient.
  body: { flex: 1, marginTop: -spacing.md, paddingHorizontal: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingTop: spacing.md, paddingBottom: spacing.xl },
  empty: { paddingTop: spacing.xl, alignItems: 'center' },
  emptyIcon: {
    width: scale(64),
    height: scale(64),
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: lineHeight.sm,
  },
});
