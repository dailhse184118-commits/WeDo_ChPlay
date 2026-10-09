import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import { ConversationRow } from '../../../components/chat/ConversationRow';
import { NewConversationSheet } from '../../../components/chat/NewConversationSheet';
import { NhapMaMoiSheet } from '../../../components/chat/NhapMaMoiSheet';
import { ProjectRow } from '../../../components/chat/ProjectRow';
import { SegmentedTabs } from '../../../components/chat/SegmentedTabs';
import { UpdateBanner } from '../../../components/update/UpdateBanner';
import { Avatar } from '../../../components/ui/Avatar';
import { CreateWorkspaceForm } from '../../../components/workspace/CreateWorkspaceForm';
import { WorkspaceSwitcher } from '../../../components/workspace/WorkspaceSwitcher';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import { useDichLoi, useTuDien } from '../../../i18n/NgonNguProvider';
import { tuDienChat } from '../../../i18n/tu-dien/chat';
import { getProjectUnreadCount } from '../../../lib/api/chat';
import { listConversations, startConversation } from '../../../lib/api/direct-chat';
import { listFriends } from '../../../lib/api/friends';
import type { KetQuaThamGia } from '../../../lib/api/loi-moi';
import { listProjects } from '../../../lib/api/projects';
import { getWorkspace } from '../../../lib/api/workspaces';
import { useAuth } from '../../../lib/auth/auth-context';
import { saveActiveWorkspaceId } from '../../../lib/auth/token-storage';
import { duAnCanDemChuaDoc } from '../../../lib/chat/chua-doc-du-an';
import { locHoiThoaiNguoiDaChan } from '../../../lib/moderation/loc-chan';
import { useNguoiDaChan } from '../../../lib/moderation/use-kiem-duyet';
import { useSocket } from '../../../lib/socket/socket-context';
import { usePhienBan } from '../../../lib/version/use-phien-ban';
import { useRefetchOnScreenFocus } from '../../../lib/use-refetch-on-focus';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, lineHeight, radius, scale, scaleWithFont, spacing } from '../../../theme/tokens';

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTuDien(tuDienChat);
  const dichLoi = useDichLoi();
  const { active, workspaces, switchTo, refresh } = useWorkspace();
  const workspaceId = active?.id;

  const [query, setQuery] = useState('');
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [taoMoiOpen, setTaoMoiOpen] = useState(false);
  const [nhapMaOpen, setNhapMaOpen] = useState(false);
  const [muc, setMuc] = useState<'du-an' | 'tin-nhan'>('du-an');

  const { onlineUserIds } = useSocket();

  /*
    ĐỪNG hủy cấu trúc ra thành `muc` — màn này đã có một biến tên `muc` cho
    thanh chuyển Dự án / Tin nhắn. Cả hai đều là chuỗi nên trùng tên ở đây cho
    ra một lỗi im lặng mà TypeScript không bắt được.
  */
  const capNhat = usePhienBan();

  const queryClient = useQueryClient();
  const [chonNguoiOpen, setChonNguoiOpen] = useState(false);

  /*
    Danh sách thành viên để chọn người nhắn. Chỉ gọi khi sheet mở — phần lớn
    lượt mở app không ai bấm tới nút này.
  */
  const workspaceQuery = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => getWorkspace(workspaceId as string),
    enabled: chonNguoiOpen && Boolean(workspaceId),
  });

  /*
    Máy chủ tra theo `pairKey` trước khi tạo, nên chọn lại đúng người đã có hội
    thoại sẽ trả về hội thoại cũ chứ không sinh cái trùng.
  */
  const taoHoiThoai = useMutation({
    /*
      Nhận cả họ tên chứ không chỉ id, dù máy chủ chỉ cần id. Tiêu đề màn nhắn
      tin lấy tên từ tham số đường dẫn, mà kết quả trả về không kèm tên người
      kia ở dạng tiện dùng — react-query đưa lại nguyên biến đầu vào cho
      `onSuccess`, nên gói tên vào đây là cách gọn nhất.
    */
    mutationFn: ({ userId }: { userId: string; hoTen: string }) => startConversation(userId),
    onSuccess: (hoiThoai, bien) => {
      setChonNguoiOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['direct-conversations'] });
      router.push(`/chat/dm/${hoiThoai.id}?ten=${encodeURIComponent(bien.hoTen)}`);
    },
    /*
      Trước đây hỏng là im lặng: bấm tên mà không có gì xảy ra. Giờ còn thêm một
      lý do có thật — hai người đã chặn nhau — và máy chủ trả sẵn câu để nói.
    */
    onError: (loi) => Alert.alert(t.khongMoDuocCuocTroChuyen, dichLoi(loi, t.thuLaiSau)),
  });

  /*
    Chỉ để đếm lời mời đang chờ mình duyệt, vẽ lên chấm đỏ ở nút Bạn bè. Không
    có chấm này thì lời mời nằm im trong màn Bạn bè và chẳng ai vào xem.
  */
  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: listFriends,
    staleTime: 30_000,
  });

  // Duyệt lời mời trên web không có sự kiện socket nào, nên hỏi lại khi quay về.
  useRefetchOnScreenFocus(friendsQuery.refetch);

  const soLoiMoi = friendsQuery.data?.incoming.length ?? 0;

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

  /*
    Hội thoại với người mình đã chặn thì giấu đi. Nó vẫn còn trên máy chủ — bỏ
    chặn là hiện lại, kèm lịch sử cũ.
  */
  const daChan = useNguoiDaChan();
  const hoiThoaiHien = useMemo(
    () => locHoiThoaiNguoiDaChan(conversationsQuery.data ?? [], daChan, user?.id),
    [conversationsQuery.data, daChan, user?.id],
  );

  const projectsQuery = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => listProjects(workspaceId),
    enabled: Boolean(workspaceId),
  });

  // Dự án mới tạo trên web không có sự kiện socket nào, nên phải hỏi lại khi
  // người dùng quay về màn này.
  useRefetchOnScreenFocus(projectsQuery.refetch);

  const projects = projectsQuery.data ?? [];

  // Lọc ngay trên danh sách đã tải. Không có endpoint tìm dự án, mà nhóm sinh viên
  // hiếm khi có quá vài chục dự án nên lọc cục bộ là đủ và tức thì.
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter((project) => project.name.toLowerCase().includes(needle));
  }, [projects, query]);

  /*
    Dòng nào đang hiện trên màn. Số chưa đọc được hỏi cho vài dòng đầu CỘNG với
    những dòng này — trước đây chỉ 6 dự án đầu có huy hiệu, dự án thứ 7 trở đi có
    tin mới cũng không bao giờ hiện. Xem `duAnCanDemChuaDoc`.

    FlatList không cho đổi `onViewableItemsChanged` sau lần dựng đầu, nên giữ
    hàm trong một ref cố định.
  */
  const [dangHien, setDangHien] = useState<ReadonlySet<string>>(() => new Set());
  const khiDoiDongHien = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const moi = new Set(
      viewableItems
        .map((dong) => (dong.item as { id?: string } | null)?.id)
        .filter((id): id is string => Boolean(id)),
    );
    setDangHien((cu) =>
      cu.size === moi.size && [...moi].every((id) => cu.has(id)) ? cu : moi,
    );
  }).current;
  const cauHinhDongHien = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const tracked = useMemo(() => duAnCanDemChuaDoc(visible, dangHien), [visible, dangHien]);

  const unreadQueries = useQueries({
    queries: tracked.map((projectId) => ({
      queryKey: ['chat-unread', projectId],
      queryFn: () => getProjectUnreadCount(projectId),
      staleTime: 15_000,
    })),
  });

  /*
    Huy hiệu chưa đọc phải được đọc lại mỗi lần quay về màn này. Màn nằm trong
    thanh tab nên không bao giờ gắn lại — trước đây huy hiệu chỉ đổi khi app vào
    nền rồi mở lại, nên đọc xong quay ra vẫn thấy số cũ (người thử nghiệm báo
    23/09/2026). `cancelRefetch: false`: lượt đếm đang bay thì dùng luôn, không
    bắn thêm lượt thứ hai cho mỗi dự án.
  */
  const lamMoiChuaDoc = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['chat-unread'] }, { cancelRefetch: false }),
    [queryClient],
  );
  useRefetchOnScreenFocus(lamMoiChuaDoc);

  const unreadById = new Map<string, number>();
  tracked.forEach((projectId, index) => {
    unreadById.set(projectId, unreadQueries[index]?.data?.count ?? 0);
  });

  const openProject = useCallback(
    (projectId: string) => router.push(`/chat/${projectId}`),
    [router],
  );

  /*
    Vừa vào nhóm bằng mã: chọn đúng không gian chứa dự án rồi mở chat của nó.
    Lưu id trước rồi nạp lại danh sách — `switchTo` không dùng được vì không
    gian của người lạ mời chưa có trong danh sách đang giữ.
  */
  const daThamGia = useCallback(
    async (ketQua: KetQuaThamGia) => {
      setNhapMaOpen(false);
      await saveActiveWorkspaceId(ketQua.workspaceId);
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push(`/chat/${ketQua.projectId}`);
    },
    [queryClient, refresh, router],
  );

  const firstName = user?.fullName?.split(' ').slice(-1)[0] ?? '';

  return (
    <View style={styles.screen}>
      <GradientHeader
        title={firstName ? t.chao(firstName) : t.tieuDe}
        subtitle={active?.name}
        onPressSubtitle={() => setSwitcherOpen(true)}
        right={
          <View style={styles.headerPhai}>
            <Pressable
              testID="nut-ban-be"
              accessibilityRole="button"
              accessibilityLabel={t.banBe(soLoiMoi)}
              onPress={() => router.push('/chat/friends')}
              hitSlop={8}
              style={styles.nutBanBe}
            >
              <Ionicons name="people-outline" size={20} color={colors.onPrimary} />
              {/* Chấm đỏ, không phải con số: ở cỡ chữ lớn con số bị xén mất. */}
              {soLoiMoi > 0 ? <View testID="cham-loi-moi" style={styles.cham} /> : null}
            </Pressable>

            <Avatar hoTen={user?.fullName ?? ''} anhUrl={user?.avatarUrl} co={scale(40)} />
          </View>
        }
      >
        <SegmentedTabs
          options={[
            { key: 'du-an', label: t.tabDuAn },
            { key: 'tin-nhan', label: t.tinNhan },
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
            accessibilityLabel={t.timDuAn}
            value={query}
            onChangeText={setQuery}
            placeholder={t.timDuAn}
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
          <UpdateBanner
            phienBanMoi={capNhat.latest}
            notes={capNhat.notes}
            storeUrl={capNhat.storeUrl}
          />
        ) : null}

        {muc === 'du-an' && projectsQuery.isError ? (
          <ErrorBanner
            message={dichLoi(projectsQuery.error, t.khongTaiDuocDuAn)}
          />
        ) : null}

        {muc === 'tin-nhan' && conversationsQuery.isError ? (
          <ErrorBanner
            message={dichLoi(conversationsQuery.error, t.khongTaiDuocTinNhan)}
          />
        ) : null}

        {muc === 'tin-nhan' ? (
          conversationsQuery.isLoading && !conversationsQuery.data ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              /*
                `key` riêng cho mỗi danh sách: hai FlatList nằm cùng chỗ trong cây nên
                không có key thì React dùng lại một phiên bản khi đổi tab, và FlatList
                ném "Changing onViewableItemsChanged nullability on the fly is not
                supported" (danh sách dự án có hàm, danh sách tin nhắn thì không).
              */
              key="ds-tin-nhan"
              data={hoiThoaiHien}
              ListHeaderComponent={
                <Pressable
                  testID="nut-nhan-tin-moi"
                  accessibilityRole="button"
                  onPress={() => setChonNguoiOpen(true)}
                  style={styles.nutNhanTinMoi}
                >
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                  <Text style={styles.nutNhanTinMoiChu}>{t.nhanTinMoi}</Text>
                </Pressable>
              }
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
                    <Text style={styles.emptyTitle}>{t.trongTinNhanTieuDe}</Text>
                    <Text style={styles.emptyBody}>{t.trongTinNhanThan}</Text>
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
            key="ds-du-an"
            testID="ds-du-an"
            data={visible}
            ListHeaderComponent={
              <Pressable
                testID="nut-nhap-ma-moi"
                accessibilityRole="button"
                onPress={() => setNhapMaOpen(true)}
                style={styles.nutNhanTinMoi}
              >
                <Ionicons name="enter-outline" size={18} color={colors.primary} />
                <Text style={styles.nutNhanTinMoiChu}>{t.nhapMaMoi}</Text>
              </Pressable>
            }
            keyExtractor={(project) => project.id}
            onViewableItemsChanged={khiDoiDongHien}
            viewabilityConfig={cauHinhDongHien}
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
                onRefresh={() => {
                  void lamMoiChuaDoc();
                  void projectsQuery.refetch();
                }}
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
                    {query ? t.khongTimThayDuAn : t.chuaCoDuAn}
                  </Text>
                  <Text style={styles.emptyBody}>
                    {query ? t.thuTuKhoaKhac : t.khongGianChuaCoDuAn}
                  </Text>
                </View>
              )
            }
          />
        )}
      </View>

      <NhapMaMoiSheet
        visible={nhapMaOpen}
        onDismiss={() => setNhapMaOpen(false)}
        onDaThamGia={(ketQua) => void daThamGia(ketQua)}
      />

      <NewConversationSheet
        visible={chonNguoiOpen}
        workspace={workspaceQuery.data}
        currentUserId={user?.id ?? ''}
        dangTao={taoHoiThoai.isPending}
        onChon={(userId, hoTen) => taoHoiThoai.mutate({ userId, hoTen })}
        onDismiss={() => setChonNguoiOpen(false)}
      />

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
  headerPhai: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nutBanBe: {
    width: scale(40),
    height: scale(40),
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cham: {
    position: 'absolute',
    top: scale(8),
    right: scale(8),
    width: scale(9),
    height: scale(9),
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
  },
  nutNhanTinMoi: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 4,
    marginBottom: spacing.sm + 4,
  },
  nutNhanTinMoiChu: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },
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
