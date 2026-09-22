import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { GradientHeader } from '../../components/ui/GradientHeader';
import { TextField } from '../../components/ui/TextField';
import { listProjects } from '../../lib/api/projects';
import { taoCuocHop } from '../../lib/api/meetings';
import { ghepNgayGio, tuThemDauGachGio } from '../../lib/meetings/thoi-diem';
import { DINH_DANG_NGAY, tuThemDauGach } from '../../lib/ngay-sinh';
import { useWorkspace } from '../../lib/workspace/workspace-context';
import { colors, fontSize, lineHeight, radius, sizes, spacing } from '../../theme/tokens';

export default function ManTaoCuocHop() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { active } = useWorkspace();

  const [duAnId, setDuAnId] = useState<string | null>(null);
  const [tieuDe, setTieuDe] = useState('');
  const [noiDung, setNoiDung] = useState('');
  const [ngay, setNgay] = useState('');
  const [gio, setGio] = useState('');

  const [loiTieuDe, setLoiTieuDe] = useState<string | null>(null);
  const [loiThoiDiem, setLoiThoiDiem] = useState<string | null>(null);
  const [loiChung, setLoiChung] = useState<string | null>(null);

  const duAnQuery = useQuery({
    queryKey: ['projects', active?.id],
    queryFn: () => listProjects(active!.id),
    enabled: Boolean(active?.id),
  });

  const danhSachDuAn = useMemo(() => duAnQuery.data ?? [], [duAnQuery.data]);

  const tao = useMutation({
    mutationFn: taoCuocHop,
    onSuccess: (hop) => {
      void queryClient.invalidateQueries({ queryKey: ['meetings'] });
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      router.replace(`/meetings/${hop.id}`);
    },
    onError: (loi: unknown) => {
      /*
        Câu từ chối của máy chủ đã là tiếng Việt và nói rõ lý do — ví dụ "Chỉ
        Leader dự án mới có thể tạo cuộc họp." Hiện thẳng nó ra, đừng thay bằng
        một câu chung chung: người dùng cần biết mình thiếu quyền chứ không phải
        nghĩ là app hỏng.
      */
      setLoiChung(loi instanceof Error ? loi.message : 'Không tạo được cuộc họp.');
    },
  });

  function bamTao() {
    setLoiChung(null);

    const ten = tieuDe.trim();
    if (!ten) {
      setLoiTieuDe('Tiêu đề không được để trống.');
      return;
    }
    setLoiTieuDe(null);

    if (!duAnId) {
      setLoiChung('Hãy chọn dự án cho cuộc họp.');
      return;
    }

    const thoiDiem = ghepNgayGio(ngay, gio);
    if (thoiDiem.loi) {
      setLoiThoiDiem(thoiDiem.loi);
      return;
    }
    setLoiThoiDiem(null);

    tao.mutate({
      title: ten,
      agenda: noiDung.trim() || undefined,
      startTime: thoiDiem.giaTri!,
      workspaceId: active!.id,
      projectId: duAnId,
    });
  }

  return (
    <View style={styles.man}>
      <GradientHeader
        title="Tạo cuộc họp"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/meetings'))}
        dense
      />

      <ScrollView
        contentContainerStyle={styles.cuon}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loiChung ? <ErrorBanner message={loiChung} /> : null}

        <Card style={styles.khoi}>
          <Text style={styles.nhan}>Dự án</Text>

          {duAnQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : danhSachDuAn.length === 0 ? (
            <Text style={styles.ghiChu}>
              Không gian này chưa có dự án nào. Cuộc họp phải thuộc về một dự án.
            </Text>
          ) : (
            danhSachDuAn.map((duAn) => {
              const dangChon = duAn.id === duAnId;
              return (
                <Pressable
                  key={duAn.id}
                  testID={`project-${duAn.id}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: dangChon }}
                  onPress={() => setDuAnId(duAn.id)}
                  style={[styles.duAn, dangChon ? styles.duAnChon : null]}
                >
                  <Ionicons
                    name={dangChon ? 'radio-button-on' : 'radio-button-off'}
                    size={sizes.icon}
                    color={dangChon ? colors.primary : colors.textMuted}
                  />
                  <Text style={styles.duAnTen} numberOfLines={1}>
                    {duAn.name}
                  </Text>
                </Pressable>
              );
            })
          )}
        </Card>

        <Card style={styles.khoi}>
          <TextField
            testID="meeting-title"
            label="Tiêu đề"
            value={tieuDe}
            onChangeText={(v) => {
              setTieuDe(v);
              setLoiTieuDe(null);
            }}
            placeholder="Họp chốt nội dung chương 2"
            autoCapitalize="sentences"
            error={loiTieuDe ?? undefined}
          />

          <TextField
            testID="meeting-agenda"
            label="Nội dung dự kiến"
            value={noiDung}
            onChangeText={setNoiDung}
            placeholder="Không bắt buộc"
            autoCapitalize="sentences"
            multiline
          />

          <TextField
            testID="meeting-date"
            label={`Ngày họp (${DINH_DANG_NGAY})`}
            value={ngay}
            onChangeText={(v) => {
              setNgay(tuThemDauGach(v));
              setLoiThoiDiem(null);
            }}
            placeholder="25/09/2026"
            keyboardType="number-pad"
          />

          <TextField
            testID="meeting-time"
            label="Giờ họp (hh:mm)"
            value={gio}
            onChangeText={(v) => {
              setGio(tuThemDauGachGio(v));
              setLoiThoiDiem(null);
            }}
            placeholder="20:00"
            keyboardType="number-pad"
            error={loiThoiDiem ?? undefined}
          />
        </Card>

        <Button
          testID="meeting-create"
          label="Tạo cuộc họp"
          onPress={bamTao}
          loading={tao.isPending}
          disabled={danhSachDuAn.length === 0}
        />

        <Text style={styles.ghiChuCuoi}>
          Chỉ Leader của dự án mới tạo được cuộc họp. Mọi thành viên dự án sẽ được
          thêm vào và nhận thông báo.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: colors.page },
  cuon: { padding: spacing.md, paddingBottom: spacing.xl },
  khoi: { marginBottom: spacing.md },
  nhan: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  duAn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  duAnChon: { backgroundColor: colors.surface },
  duAnTen: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  ghiChu: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: lineHeight.sm },
  ghiChuCuoi: {
    marginTop: spacing.md,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: lineHeight.xs,
  },
});
