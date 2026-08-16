import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '../../../components/ui/Button';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import { TextField } from '../../../components/ui/TextField';
import { listProjects } from '../../../lib/api/projects';
import { createTask } from '../../../lib/api/tasks';
import { getWorkspace } from '../../../lib/api/workspaces';
import {
  FORM_TAO_TASK_RONG,
  dungInputTaoTask,
  type FormTaoTask,
} from '../../../lib/tasks/tao-task';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, radius, spacing } from '../../../theme/tokens';

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

export default function ManTaoCongViec() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { active } = useWorkspace();
  const workspaceId = active?.id ?? null;

  const [form, setForm] = useState<FormTaoTask>(FORM_TAO_TASK_RONG);
  const [loi, setLoi] = useState<string | null>(null);

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

  const taoMoi = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      /*
        Làm mới danh sách trước khi quay lại, để việc vừa tạo có mặt ngay. Không
        làm thì người dùng quay về màn cũ và không thấy gì, tưởng tạo hỏng.
      */
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      router.back();
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
        onBack={() => router.back()}
        dense
      />

      <ScrollView
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
          onChon={(id) => capNhat('projectId', id)}
          nhanKhiRong="Không gian làm việc này chưa có dự án nào."
        />

        <HangChon
          nhan="Giao cho"
          danhSach={thanhVien.data?.members ?? []}
          dangChon={form.assigneeId}
          nhanCua={(m) => m.user.fullName || m.user.email}
          onChon={(id) => {
            /*
              `members` có id riêng của bản ghi thành viên, còn máy chủ cần id
              NGƯỜI DÙNG. Lấy nhầm thì máy chủ báo không tìm thấy người nhận.
            */
            const chon = thanhVien.data?.members.find((m) => m.id === id);
            capNhat('assigneeId', chon ? chon.user.id : null);
          }}
          nhanKhiRong="Chưa tải được danh sách thành viên."
        />

        <Button
          label="Tạo công việc"
          onPress={guiDi}
          loading={taoMoi.isPending}
          testID="nut-tao"
        />
      </ScrollView>
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
