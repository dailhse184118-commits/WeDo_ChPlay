import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '../../../components/ui/Button';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import { KhungCuonBieuMau } from '../../../components/ui/KhungCuonBieuMau';
import { TextField } from '../../../components/ui/TextField';
import { listProjects } from '../../../lib/api/projects';
import { createTask } from '../../../lib/api/tasks';
import { getWorkspace } from '../../../lib/api/workspaces';
import {
  FORM_TAO_TASK_RONG,
  dungInputTaoTask,
  type FormTaoTask,
} from '../../../lib/tasks/tao-task';
import { useAuth } from '../../../lib/auth/auth-context';
import { useQuayLai } from '../../../lib/use-quay-lai';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, lineHeight, radius, spacing } from '../../../theme/tokens';

/**
 * Hàng chọn một-trong-nhiều, dạng chip bấm được.
 *
 * Không dùng `Picker` của hệ điều hành: nó hiện khác nhau giữa Android và iOS,
 * và với danh sách ngắn như dự án hay thành viên nhóm thì chip cho thấy hết lựa
 * chọn ngay, đỡ một lần chạm.
 */
function HangChon<T extends { id: string }>({
  nhan,
  danhSach,
  dangChon,
  nhanCua,
  onChon,
  nhanKhiRong,
}: {
  nhan: string;
  danhSach: T[];
  dangChon: string | null;
  nhanCua: (item: T) => string;
  onChon: (id: string | null) => void;
  nhanKhiRong: string;
}) {
  if (danhSach.length === 0) {
    return (
      <View style={styles.nhom}>
        <Text style={styles.nhanNhom}>{nhan}</Text>
        <Text style={styles.trong}>{nhanKhiRong}</Text>
      </View>
    );
  }

  return (
    <View style={styles.nhom}>
      <Text style={styles.nhanNhom}>{nhan}</Text>
      <View style={styles.chips}>
        {danhSach.map((item) => {
          const chon = dangChon === item.id;
          return (
            <Pressable
              key={item.id}
              // Bấm lại chip đang chọn thì bỏ chọn — cả hai trường đều tuỳ chọn,
              // người dùng phải rút lại được mà không cần nút "xoá" riêng.
              onPress={() => onChon(chon ? null : item.id)}
              style={[styles.chip, chon && styles.chipChon]}
              accessibilityRole="button"
              accessibilityLabel={nhanCua(item)}
              accessibilityState={{ selected: chon }}
            >
              <Text style={[styles.chipChu, chon && styles.chipChuChon]}>
                {nhanCua(item)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Một người có thể nhận việc. `id` là id NGƯỜI DÙNG — đúng thứ máy chủ cần. */
interface NguoiNhan {
  id: string;
  ten: string;
}

/**
 * Gom danh sách người nhận việc theo id người dùng.
 *
 * Trước đây chip dùng id BẢN GHI thành viên còn form lưu id NGƯỜI DÙNG: hai thứ
 * không bao giờ bằng nhau, nên chip không sáng và bấm lại không bỏ chọn được.
 * Dùng thẳng id người dùng làm khoá thì so sánh và gửi đi là cùng một thứ.
 */
function gomNguoiNhan(
  thanhVien: Array<{ user: { id: string; fullName?: string | null; email?: string | null } }>,
): NguoiNhan[] {
  const theoNguoi = new Map<string, NguoiNhan>();
  for (const { user } of thanhVien) {
    if (!user?.id || theoNguoi.has(user.id)) continue;
    // Email có thể là null với người chưa kết bạn — máy chủ giấu đi.
    theoNguoi.set(user.id, { id: user.id, ten: user.fullName || user.email || 'Thành viên' });
  }
  return Array.from(theoNguoi.values());
}

export default function ManTaoCongViec() {
  const router = useRouter();
  /* Tạo xong hay bỏ ngang đều về danh sách việc — không dùng `router.back()`, xem `useQuayLai`. */
  const quayLai = useQuayLai(useCallback(() => router.navigate('/tasks'), [router]));
  const queryClient = useQueryClient();
  const { active, workspaces } = useWorkspace();
  const { user } = useAuth();
  const workspaceId = active?.id ?? null;

  const [form, setForm] = useState<FormTaoTask>(FORM_TAO_TASK_RONG);
  const [loi, setLoi] = useState<string | null>(null);

  const lamTrongForm = useCallback(() => {
    setForm(FORM_TAO_TASK_RONG);
    setLoi(null);
  }, []);

  /*
    Màn này là một tab ẩn, sống suốt phiên: bấm "+" lần sau là CÙNG một màn, giữ
    nguyên mọi thứ gõ lần trước — kể cả người được giao. Dọn lúc RỜI màn (không
    phải lúc quay lại) để lần mở sau không loé lên form cũ trong một khung hình.
  */
  useFocusEffect(useCallback(() => lamTrongForm, [lamTrongForm]));

  /* Dự án và người nhận của không gian cũ không có nghĩa gì ở không gian mới. */
  useEffect(() => {
    lamTrongForm();
  }, [workspaceId, lamTrongForm]);

  const capNhat = <K extends keyof FormTaoTask>(khoa: K, gia_tri: FormTaoTask[K]) =>
    setForm((truoc) => ({ ...truoc, [khoa]: gia_tri }));

  const duAn = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => listProjects(workspaceId ?? undefined),
    enabled: !!workspaceId,
  });

  const thanhVien = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => getWorkspace(workspaceId!),
    enabled: !!workspaceId,
  });

  const duAnDangChon = (duAn.data ?? []).find((d) => d.id === form.projectId) ?? null;

  /*
    Đã chọn dự án thì chỉ người trong dự án đó nhận được việc — máy chủ từ chối
    người ngoài dự án. Chưa chọn thì là cả không gian làm việc.
  */
  const nguoiNhan = useMemo(
    () => gomNguoiNhan(duAnDangChon ? (duAnDangChon.members ?? []) : (thanhVien.data?.members ?? [])),
    [duAnDangChon, thanhVien.data],
  );

  /*
    Máy chủ chỉ cho Leader dự án (hoặc chủ không gian) tạo việc trong dự án. Nói
    trước, đừng để người dùng gõ xong mới nhận câu từ chối.
  */
  const khongPhaiLeader = Boolean(
    duAnDangChon &&
      user &&
      workspaces.find((ws) => ws.id === workspaceId)?.ownerId !== user.id &&
      !duAnDangChon.members?.some((m) => m.role === 'LEADER' && m.user.id === user.id),
  );

  const taoMoi = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      lamTrongForm();
      /*
        Làm mới danh sách trước khi quay lại, để việc vừa tạo có mặt ngay. Không
        làm thì người dùng quay về màn cũ và không thấy gì, tưởng tạo hỏng.
      */
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      /* KHÔNG `router.back()`: trong nhóm tab nó nhảy về Trò chuyện — xem `useQuayLai`. */
      quayLai();
    },
    onError: (e) =>
      setLoi(e instanceof Error ? e.message : 'Không tạo được công việc.'),
  });

  const guiDi = () => {
    setLoi(null);
    const { input, loi: loiForm } = dungInputTaoTask(form, workspaceId);
    if (!input) {
      setLoi(loiForm);
      return;
    }
    taoMoi.mutate(input);
  };

  return (
    <View style={styles.man}>
      <GradientHeader
        title="Công việc mới"
        subtitle={active?.name}
        onBack={quayLai}
        dense
      />

      {/* iPhone tự cuộn ô đang gõ lên trên bàn phím; Android như cũ. */}
      <KhungCuonBieuMau
        style={styles.than}
        contentContainerStyle={styles.thanNoiDung}
        keyboardShouldPersistTaps="handled"
      >
        {loi ? <ErrorBanner message={loi} /> : null}

        <TextField
          label="Tên công việc"
          value={form.tieuDe}
          onChangeText={(v) => capNhat('tieuDe', v)}
          placeholder="Ví dụ: Dịch tài liệu chương 3"
          testID="o-tieu-de"
        />

        <TextField
          label="Mô tả"
          value={form.moTa}
          onChangeText={(v) => capNhat('moTa', v)}
          placeholder="Không bắt buộc"
          multiline
          testID="o-mo-ta"
        />

        <TextField
          label="Hạn chót"
          value={form.hanChot}
          onChangeText={(v) => capNhat('hanChot', v)}
          placeholder="ngày/tháng/năm — ví dụ 02/09/2026"
          keyboardType="numbers-and-punctuation"
          testID="o-han-chot"
        />

        <HangChon
          nhan="Dự án"
          danhSach={duAn.data ?? []}
          dangChon={form.projectId}
          nhanCua={(d) => d.name}
          // Người đã chọn ở dự án cũ có thể không thuộc dự án mới — bỏ chọn luôn.
          onChon={(id) => setForm((truoc) => ({ ...truoc, projectId: id, assigneeId: null }))}
          nhanKhiRong="Không gian làm việc này chưa có dự án nào."
        />

        {khongPhaiLeader ? (
          <Text testID="ghi-chu-khong-phai-leader" style={styles.ghiChu}>
            Chỉ Leader của dự án này mới tạo được công việc trong dự án. Bỏ chọn dự án để tạo
            việc riêng cho bạn.
          </Text>
        ) : null}

        <HangChon
          nhan="Giao cho"
          danhSach={nguoiNhan}
          dangChon={form.assigneeId}
          nhanCua={(nguoi) => nguoi.ten}
          onChon={(id) => capNhat('assigneeId', id)}
          nhanKhiRong={
            duAnDangChon ? 'Dự án này chưa có thành viên nào.' : 'Chưa tải được danh sách thành viên.'
          }
        />

        <Button
          label="Tạo công việc"
          onPress={guiDi}
          loading={taoMoi.isPending}
          testID="nut-tao"
        />
      </KhungCuonBieuMau>
    </View>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: colors.background },
  than: { flex: 1 },
  thanNoiDung: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  nhom: { gap: spacing.sm },
  nhanNhom: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  trong: { fontSize: fontSize.sm, color: colors.textMuted },
  ghiChu: { fontSize: fontSize.sm, color: colors.warningText, lineHeight: lineHeight.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipChon: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipChu: { fontSize: fontSize.sm, color: colors.text },
  chipChuChon: { color: colors.primaryDark, fontWeight: '600' },
});
