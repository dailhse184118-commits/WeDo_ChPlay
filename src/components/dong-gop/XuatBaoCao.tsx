import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useQuery } from '@tanstack/react-query';

import { ErrorBanner } from '../ui/ErrorBanner';
import { xinLinkBaoCao, type DinhDangBaoCao } from '../../lib/api/bao-cao';
import { listProjects } from '../../lib/api/projects';
import { cauLoiBaoCao } from '../../lib/bao-cao';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

const DINH_DANG: Array<{ giaTri: DinhDangBaoCao; nhan: string }> = [
  { giaTri: 'pdf', nhan: 'PDF' },
  { giaTri: 'xlsx', nhan: 'Excel' },
];

/**
 * Khối "Xuất báo cáo đóng góp" ở Tài khoản → Bảng đóng góp.
 *
 * App không tự lưu tệp: thêm thư viện lưu/chia sẻ tệp là đổi dấu vân tay, không
 * phát qua OTA được. Nên app xin máy chủ một link tải có chữ ký (sống 5 phút)
 * rồi mở bằng trình duyệt — trình duyệt hiện PDF hoặc tải Excel, người dùng
 * chia sẻ hay lưu bằng menu của trình duyệt. Khoảng thời gian dùng mặc định.
 */
export function XuatBaoCao({ workspaceId }: { workspaceId: string }) {
  const duAn = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => listProjects(workspaceId),
  });
  const [chon, setChon] = useState<string | null>(null);
  const [dinhDang, setDinhDang] = useState<DinhDangBaoCao>('pdf');
  const [dangXuat, setDangXuat] = useState(false);
  const [loi, setLoi] = useState('');

  const ds = duAn.data ?? [];
  // Chưa chọn, hay dự án đã chọn không còn trong danh sách: lấy dự án đầu.
  const projectId = chon && ds.some((p) => p.id === chon) ? chon : (ds[0]?.id ?? null);

  const xuat = async () => {
    if (!projectId || dangXuat) return;
    setDangXuat(true);
    setLoi('');
    try {
      const { url } = await xinLinkBaoCao(projectId, dinhDang);
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      setLoi(cauLoiBaoCao(e));
    } finally {
      setDangXuat(false);
    }
  };

  return (
    <View style={styles.khoi}>
      <Text style={styles.tieuDe}>Xuất báo cáo đóng góp</Text>
      <Text style={styles.moTa}>
        Leader nhận báo cáo cả nhóm, thành viên nhận báo cáo của riêng mình. Số liệu tính từ ngày tạo dự án tới hôm nay.
      </Text>

      {duAn.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : duAn.isError && !duAn.data ? (
        <ErrorBanner message="Không tải được danh sách dự án." />
      ) : ds.length === 0 ? (
        <Text style={styles.moTa}>Không gian này chưa có dự án nào.</Text>
      ) : (
        <>
          <Text style={styles.nhan}>Dự án</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hang}>
            {ds.map((p) => {
              const dangChon = p.id === projectId;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: dangChon }}
                  onPress={() => setChon(p.id)}
                  style={[styles.chip, dangChon && styles.chipChon]}
                >
                  <Text style={[styles.chipChu, dangChon && styles.chipChuChon]} numberOfLines={1}>
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.nhan}>Định dạng</Text>
          <View style={styles.hang}>
            {DINH_DANG.map(({ giaTri, nhan }) => {
              const dangChon = giaTri === dinhDang;
              return (
                <Pressable
                  key={giaTri}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: dangChon }}
                  onPress={() => setDinhDang(giaTri)}
                  style={[styles.chip, dangChon && styles.chipChon]}
                >
                  <Text style={[styles.chipChu, dangChon && styles.chipChuChon]}>{nhan}</Text>
                </Pressable>
              );
            })}
          </View>

          {loi ? <ErrorBanner message={loi} /> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: dangXuat, busy: dangXuat }}
            disabled={dangXuat}
            onPress={() => void xuat()}
            style={[styles.nut, dangXuat && styles.nutTat]}
          >
            {dangXuat ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.nutChu}>Xuất báo cáo</Text>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  khoi: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tieuDe: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  moTa: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: fontSize.xs * 1.6 },
  nhan: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted },
  hang: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    maxWidth: 220,
  },
  chipChon: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipChu: { fontSize: fontSize.sm, color: colors.text },
  chipChuChon: { color: colors.primary, fontWeight: '600' },
  nut: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  nutTat: { opacity: 0.6 },
  nutChu: { color: colors.onPrimary, fontSize: fontSize.sm, fontWeight: '600' },
});
