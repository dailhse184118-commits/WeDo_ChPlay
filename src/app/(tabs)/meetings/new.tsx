import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import { TextField } from '../../../components/ui/TextField';
import { useDichLoi, useNgonNgu, useTuDien } from '../../../i18n/NgonNguProvider';
import { tuDienCuocHop } from '../../../i18n/tu-dien/cuoc-hop';
import { chuLoi, type NguonLoi } from '../../../lib/auth/nguon-loi';
import { listProjects } from '../../../lib/api/projects';
import { taoCuocHop } from '../../../lib/api/meetings';
import {
  cauLoiThoiDiem,
  ghepNgayGio,
  tuThemDauGachGio,
  type KhoaLoiThoiDiem,
} from '../../../lib/meetings/thoi-diem';
import { DINH_DANG_NGAY, tuThemDauGach } from '../../../lib/ngay-sinh';
import { useQuayLai } from '../../../lib/use-quay-lai';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, lineHeight, radius, sizes, spacing } from '../../../theme/tokens';

export default function ManTaoCuocHop() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { active } = useWorkspace();
  const t = useTuDien(tuDienCuocHop);
  const dichLoi = useDichLoi();
  const { ngonNgu } = useNgonNgu();

  const quayLai = useQuayLai(useCallback(() => router.navigate('/meetings'), [router]));

  const [duAnId, setDuAnId] = useState<string | null>(null);
  const [tieuDe, setTieuDe] = useState('');
  const [noiDung, setNoiDung] = useState('');
  const [ngay, setNgay] = useState('');
  const [gio, setGio] = useState('');

  /* Lỗi giữ ở dạng NGUỒN, dịch lúc vẽ: đổi ngôn ngữ giữa chừng thì băng đỏ đổi theo. */
  const [loiTieuDe, setLoiTieuDe] = useState(false);
  const [loiThoiDiem, setLoiThoiDiem] = useState<KhoaLoiThoiDiem | null>(null);
  const [loiChung, setLoiChung] = useState<NguonLoi<'chonDuAn' | 'khongTaoDuoc'> | null>(null);

  const lamTrongForm = useCallback(() => {
    setDuAnId(null);
    setTieuDe('');
    setNoiDung('');
    setNgay('');
    setGio('');
    setLoiTieuDe(false);
    setLoiThoiDiem(null);
    setLoiChung(null);
  }, []);

  /*
    Màn này là một tab ẩn, sống suốt phiên: lần bấm "Tạo cuộc họp" sau là CÙNG
    một màn, giữ nguyên mọi thứ của cuộc họp vừa tạo — bấm Tạo lần nữa là ra
    cuộc họp trùng. Dọn lúc RỜI màn để lần mở sau không loé lên form cũ.
  */
  useFocusEffect(useCallback(() => lamTrongForm, [lamTrongForm]));

  /* Dự án của không gian cũ không thuộc không gian mới — máy chủ sẽ từ chối. */
  useEffect(() => {
    lamTrongForm();
  }, [active?.id, lamTrongForm]);

  const duAnQuery = useQuery({
    queryKey: ['projects', active?.id],
    queryFn: () => listProjects(active!.id),
    enabled: Boolean(active?.id),
  });

  const danhSachDuAn = useMemo(() => duAnQuery.data ?? [], [duAnQuery.data]);

  const tao = useMutation({
    mutationFn: taoCuocHop,
    onSuccess: (hop) => {
      lamTrongForm();
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
      setLoiChung({ loi, duPhong: 'khongTaoDuoc' });
    },
  });

  function bamTao() {
    setLoiChung(null);

    const ten = tieuDe.trim();
    if (!ten) {
      setLoiTieuDe(true);
      return;
    }
    setLoiTieuDe(false);

    if (!duAnId) {
      setLoiChung({ khoa: 'chonDuAn' });
      return;
    }

    const thoiDiem = ghepNgayGio(ngay, gio);
    if (thoiDiem.khoaLoi) {
      setLoiThoiDiem(thoiDiem.khoaLoi);
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
        title={t.danhSach.taoCuocHop}
        onBack={quayLai}
        dense
      />

      <ScrollView
        contentContainerStyle={styles.cuon}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loiChung ? <ErrorBanner message={chuLoi(t.tao, loiChung, dichLoi)} /> : null}

        <Card style={styles.khoi}>
          <Text style={styles.nhan}>{t.tao.duAn}</Text>

          {duAnQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : danhSachDuAn.length === 0 ? (
            <Text style={styles.ghiChu}>{t.tao.khongCoDuAn}</Text>
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
            label={t.tao.tieuDe}
            value={tieuDe}
            onChangeText={(v) => {
              setTieuDe(v);
              setLoiTieuDe(false);
            }}
            placeholder={t.tao.tieuDeMau}
            autoCapitalize="sentences"
            error={loiTieuDe ? t.tao.tieuDeTrong : undefined}
          />

          <TextField
            testID="meeting-agenda"
            label={t.tao.noiDung}
            value={noiDung}
            onChangeText={setNoiDung}
            placeholder={t.tao.khongBatBuoc}
            autoCapitalize="sentences"
            multiline
          />

          <TextField
            testID="meeting-date"
            label={t.tao.ngayHop(DINH_DANG_NGAY)}
            value={ngay}
            onChangeText={(v) => {
              setNgay(tuThemDauGach(v));
              setLoiThoiDiem(null);
            }}
            placeholder={t.tao.ngayMau}
            keyboardType="number-pad"
          />

          <TextField
            testID="meeting-time"
            label={t.tao.gioHop}
            value={gio}
            onChangeText={(v) => {
              setGio(tuThemDauGachGio(v));
              setLoiThoiDiem(null);
            }}
            placeholder={t.tao.gioMau}
            keyboardType="number-pad"
            error={loiThoiDiem ? cauLoiThoiDiem(loiThoiDiem, ngonNgu) : undefined}
          />
        </Card>

        <Button
          testID="meeting-create"
          label={t.danhSach.taoCuocHop}
          onPress={bamTao}
          loading={tao.isPending}
          disabled={danhSachDuAn.length === 0}
        />

        <Text style={styles.ghiChuCuoi}>{t.tao.ghiChuCuoi}</Text>
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
