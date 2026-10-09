import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienTaiKhoan } from '../../i18n/tu-dien/tai-khoan';
import { Card } from '../../components/ui/Card';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { GradientHeader } from '../../components/ui/GradientHeader';
import { IconTile, type IconTileTone } from '../../components/ui/IconTile';
import { getPreferences, updatePreferences } from '../../lib/api/notifications';
import type { NotificationPreferences } from '../../lib/types';
import { colors, fontSize, lineHeight, spacing } from '../../theme/tokens';

type ChuThongBao = (typeof tuDienTaiKhoan)['vi']['thongBao'];

interface Row {
  key: keyof NotificationPreferences;
  label: keyof ChuThongBao;
  hint: keyof ChuThongBao;
  icon: React.ComponentProps<typeof IconTile>['name'];
  tone: IconTileTone;
}

/**
 * Hiện đủ cả bốn loại, kể cả `notifyMeeting`.
 *
 * Cuộc họp giờ đã có tab riêng trên mobile, chạm vào thông báo là mở thẳng cuộc
 * họp đó — nên câu gợi ý không còn đẩy người dùng sang web. Ẩn công tắc đi sẽ
 * khiến họ không tắt được thứ đang làm phiền mình.
 */
const ROWS: Row[] = [
  {
    key: 'notifyTaskAssignment',
    label: 'giaoViec',
    hint: 'giaoViecGoiY',
    icon: 'person-add-outline',
    tone: 'info',
  },
  {
    key: 'notifyTaskReview',
    label: 'duyetViec',
    hint: 'duyetViecGoiY',
    icon: 'checkmark-done-outline',
    tone: 'done',
  },
  {
    key: 'notifyDeadlineReminder',
    label: 'nhacHan',
    hint: 'nhacHanGoiY',
    icon: 'alarm-outline',
    tone: 'deadline',
  },
  {
    key: 'notifyMeeting',
    label: 'cuocHop',
    hint: 'cuocHopGoiY',
    icon: 'videocam-outline',
    tone: 'info',
  },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const t = useTuDien(tuDienTaiKhoan).thongBao;
  const queryClient = useQueryClient();

  const prefsQuery = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getPreferences,
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<NotificationPreferences>) => updatePreferences(patch),
    onSuccess: (next) => queryClient.setQueryData(['notification-preferences'], next),
  });

  const prefs = prefsQuery.data;

  return (
    <View style={styles.screen}>
      <GradientHeader
        title={t.tieuDe}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
        dense
      />

      {prefsQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {prefsQuery.isError ? <ErrorBanner message={t.khongTaiDuoc} /> : null}
          {mutation.isError ? <ErrorBanner message={t.khongLuuDuoc} /> : null}

          {prefs ? (
            <Card style={styles.card}>
              {ROWS.map((row, index) => (
                <View
                  key={row.key}
                  style={[styles.row, index === ROWS.length - 1 ? null : styles.divider]}
                >
                  <IconTile name={row.icon} tone={row.tone} />
                  <View style={styles.body}>
                    <Text style={styles.label}>{t[row.label]}</Text>
                    <Text style={styles.hint}>{t[row.hint]}</Text>
                  </View>
                  <Switch
                    testID={`switch-${row.key}`}
                    value={prefs[row.key]}
                    disabled={mutation.isPending}
                    onValueChange={(value) => mutation.mutate({ [row.key]: value })}
                    trackColor={{ true: colors.primary }}
                  />
                </View>
              ))}
            </Card>
          ) : null}

          <Text style={styles.note}>{t.ghiChu}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  card: { paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  body: { flex: 1, marginHorizontal: spacing.sm + 4 },
  label: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  hint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xxs, lineHeight: lineHeight.xs },
  note: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.lg,
    lineHeight: lineHeight.xs,
    textAlign: 'center',
  },
});
