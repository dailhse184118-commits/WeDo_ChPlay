import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import { CreateWorkspaceForm } from '../../../components/workspace/CreateWorkspaceForm';
import { WorkspaceSwitcher } from '../../../components/workspace/WorkspaceSwitcher';
import { getCalendar, type MucLich } from '../../../lib/api/calendar';
import {
  gioTrongNgay,
  nhanLoai,
  nhomTheoNgay,
} from '../../../lib/calendar/nhom-theo-ngay';
import { useRefetchOnScreenFocus } from '../../../lib/use-refetch-on-focus';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, radius, spacing } from '../../../theme/tokens';

/**
 * Nhìn về phía trước bao nhiêu ngày.
 *
 * Lấy cả một quãng quá khứ ngắn để hạn chót vừa trôi qua vẫn còn hiện — việc trễ
 * hạn hôm qua là thứ người dùng cần thấy nhất, giấu đi thì họ tưởng đã xong.
 */
const NGAY_TRUOC = 3;
const NGAY_SAU = 30;

const MAU_THEO_LOAI: Record<MucLich['kind'], string> = {
  MEETING: colors.primary,
  TASK_DEADLINE: colors.danger,
  EVENT: colors.success,
};

/*
  Cuộc họp mở được màn chi tiết; hạn chót công việc và sự kiện thì không — nên
  chỉ mục họp mới là nút bấm. Bọc mọi mục vào `Pressable` cho gọn code là dạy
  người dùng rằng chạm vào mục nào cũng có chuyện xảy ra, rồi hai phần ba số
  lần chạm không có gì.
*/
function Muc({ item, onPress }: { item: MucLich; onPress?: () => void }) {
  const than = (
    <View style={styles.muc}>
      <View style={[styles.vach, { backgroundColor: MAU_THEO_LOAI[item.kind] }]} />
      <View style={styles.mucThan}>
        <View style={styles.mucDau}>
          <Text style={[styles.huyHieu, { color: MAU_THEO_LOAI[item.kind] }]}>
            {nhanLoai(item.kind)}
          </Text>
          <Text style={styles.gio}>{gioTrongNgay(item.startTime)}</Text>
        </View>
        <Text style={styles.tieuDe} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={styles.moTa} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (!onPress) return than;

  return (
    <Pressable
      testID={`calendar-meeting-${item.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Mở cuộc họp ${item.title}`}
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.mucNhan : null)}
    >
      {than}
    </Pressable>
  );
}

export default function ManLich() {
  const router = useRouter();
  const { active, workspaces, switchTo } = useWorkspace();

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [taoMoiOpen, setTaoMoiOpen] = useState(false);

  const khoang = useMemo(() => {
    const bayGio = new Date();
    const tu = new Date(bayGio);
    tu.setDate(tu.getDate() - NGAY_TRUOC);
    const den = new Date(bayGio);
    den.setDate(den.getDate() + NGAY_SAU);
    return { tu, den, bayGio };
  }, []);

  const lich = useQuery({
    queryKey: ['calendar', active?.id],
    queryFn: () => getCalendar(active!.id, khoang.tu, khoang.den),
    enabled: Boolean(active?.id),
  });

  useRefetchOnScreenFocus(lich.refetch);

  const sections = useMemo(
    () =>
      nhomTheoNgay(lich.data ?? [], khoang.bayGio).map((nhom) => ({
        title: nhom.nhan,
        data: nhom.muc,
      })),
    [lich.data, khoang.bayGio],
  );

  return (
    <View style={styles.man}>
      <GradientHeader
        title="Lịch"
        subtitle={active?.name}
        onPressSubtitle={() => setSwitcherOpen(true)}
      />

      {/*
        Lối vào danh sách cuộc họp. Không làm thành tab thứ sáu: thanh tab đã
        năm mục, thêm nữa là nhãn bị xén ở cỡ chữ lớn. Cuộc họp vốn là thứ xem
        theo thời gian nên nằm cạnh Lịch là đúng chỗ.
      */}
      <Pressable
        testID="calendar-open-meetings"
        accessibilityRole="button"
        onPress={() => router.push('/meetings')}
        style={({ pressed }) => [styles.loiVaoHop, pressed ? styles.mucNhan : null]}
      >
        <Ionicons name="videocam-outline" size={18} color={colors.primary} />
        <Text style={styles.loiVaoHopChu}>Cuộc họp</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <View style={styles.than}>
        {/*
          Chỉ báo lỗi to khi KHÔNG có gì để xem. Còn dữ liệu cũ trong cache thì
          lần gọi hỏng không phải chuyện chặn đường — dội một băng đỏ lên trên
          danh sách vẫn đọc được là làm người dùng tưởng app hỏng.
        */}
        {lich.isError && !lich.data ? (
          <ErrorBanner
            message={
              lich.error instanceof Error ? lich.error.message : 'Không tải được lịch.'
            }
          />
        ) : null}

        {lich.isError && lich.data ? (
          <Text style={styles.ngoaiTuyen}>
            Đang xem dữ liệu đã lưu. Kết nối lại để cập nhật.
          </Text>
        ) : null}

        {lich.isLoading ? (
          <View style={styles.giua}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => `${item.kind}-${item.id}`}
            contentContainerStyle={styles.danhSach}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({ section }) => (
              <Text style={styles.tieuDeNgay}>{section.title}</Text>
            )}
            renderItem={({ item }) => (
              <Muc
                item={item}
                onPress={
                  item.kind === 'MEETING'
                    ? () => router.push(`/meetings/${item.id}`)
                    : undefined
                }
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={lich.isRefetching}
                onRefresh={() => lich.refetch()}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              lich.isError ? null : (
                <View style={styles.trong}>
                  <View style={styles.trongIcon}>
                    <Ionicons name="calendar-outline" size={28} color={colors.primary} />
                  </View>
                  <Text style={styles.trongTieuDe}>Chưa có gì trong lịch</Text>
                  <Text style={styles.trongThan}>
                    Cuộc họp, sự kiện và hạn chót công việc của nhóm sẽ hiện ở đây, gộp chung theo
                    từng ngày.
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
        activeId={active?.id}
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
  mucNhan: { opacity: 0.6 },
  loiVaoHop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.md,
  },
  loiVaoHopChu: { flex: 1, fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  man: { flex: 1, backgroundColor: colors.page },
  than: { flex: 1, paddingHorizontal: spacing.lg },
  giua: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  danhSach: { paddingVertical: spacing.md, gap: spacing.sm },
  ngoaiTuyen: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    paddingTop: spacing.sm,
  },
  tieuDeNgay: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  muc: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  // Vạch màu bên trái: phân biệt loại bằng mắt trước khi kịp đọc chữ.
  vach: { width: 4 },
  mucThan: { flex: 1, padding: spacing.md, gap: 2 },
  mucDau: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  huyHieu: { fontSize: fontSize.xs, fontWeight: '600' },
  gio: { fontSize: fontSize.xs, color: colors.textMuted },
  tieuDe: { fontSize: fontSize.md, fontWeight: '500', color: colors.text },
  moTa: { fontSize: fontSize.sm, color: colors.textMuted },
  trong: { alignItems: 'center', paddingTop: spacing.xl * 2, gap: spacing.sm },
  trongIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trongTieuDe: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  trongThan: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: fontSize.sm * 1.6,
  },
});
