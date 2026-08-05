import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueries, useQuery } from '@tanstack/react-query';

import { ProjectRow } from '../../../components/chat/ProjectRow';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import { getProjectUnreadCount } from '../../../lib/api/chat';
import { listProjects } from '../../../lib/api/projects';
import { useAuth } from '../../../lib/auth/auth-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, radius, spacing } from '../../../theme/tokens';

/** Giới hạn để tránh N+1 request bắn cùng lúc trên mạng di động. */
const MAX_UNREAD_QUERIES = 6;

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { active } = useWorkspace();
  const workspaceId = active?.id;

  const [query, setQuery] = useState('');

  const projectsQuery = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => listProjects(workspaceId),
    enabled: Boolean(workspaceId),
  });

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
        right={
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.fullName ?? '?').charAt(0).toUpperCase()}
            </Text>
          </View>
        }
      >
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
          />
        </View>
      </GradientHeader>

      <View style={styles.body}>
        {projectsQuery.isError ? (
          <ErrorBanner
            message={
              projectsQuery.error instanceof Error
                ? projectsQuery.error.message
                : 'Không tải được danh sách dự án.'
            }
          />
        ) : null}

        {projectsQuery.isLoading ? (
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#ffffff', fontWeight: '700', fontSize: fontSize.md },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.sm + 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    color: '#ffffff',
    fontSize: fontSize.sm,
    paddingVertical: 0,
  },
  // Nội dung kéo lên chồng mép gradient.
  body: { flex: 1, marginTop: -spacing.md, paddingHorizontal: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingTop: spacing.md, paddingBottom: spacing.xl },
  empty: { paddingTop: spacing.xl, alignItems: 'center' },
  emptyIcon: {
    width: 64,
    height: 64,
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
    lineHeight: 21,
  },
});
