import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Card } from '../../components/ui/Card';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { GradientHeader } from '../../components/ui/GradientHeader';
import { IconTile, type IconTileTone } from '../../components/ui/IconTile';
import { getPreferences, updatePreferences } from '../../lib/api/notifications';
import type { NotificationPreferences } from '../../lib/types';
import { colors, fontSize, lineHeight, spacing } from '../../theme/tokens';

interface Row {
  key: keyof NotificationPreferences;
  label: string;
  hint: string;
  icon: React.ComponentProps<typeof IconTile>['name'];
  tone: IconTileTone;
}

/**
 * Hiện đủ cả bốn loại, kể cả `notifyMeeting`.
 *
 * Cuộc họp không có màn hình riêng trên mobile, nhưng người dùng vẫn nhận thông báo
 * họp trên điện thoại. Ẩn công tắc đi sẽ khiến họ không tắt được thứ đang làm phiền
 * mình — đó mới là vấn đề thật, chứ không phải chuyện thiếu màn hình.
 */
const ROWS: Row[] = [
  {
    key: 'notifyTaskAssignment',
    label: 'Giao việc',
    hint: 'Khi có người giao việc cho bạn, hoặc phản hồi việc bạn giao',
    icon: 'person-add-outline',
    tone: 'info',
  },
  {
    key: 'notifyTaskReview',
    label: 'Duyệt việc',
    hint: 'Khi việc được nộp hoặc được duyệt',
    icon: 'checkmark-done-outline',
    tone: 'done',
  },
  {
    key: 'notifyDeadlineReminder',
    label: 'Nhắc hạn chót',
    hint: 'Nhắc trước 24 giờ và đúng giờ hạn',
    icon: 'alarm-outline',
    tone: 'deadline',
  },
  {
    key: 'notifyMeeting',
    label: 'Cuộc họp',
    hint: 'Khi có cuộc họp mới được lên lịch. Xem chi tiết họp trên web WeDo',
    icon: 'videocam-outline',
    tone: 'info',
  },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
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
        title="Cài đặt thông báo"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
        dense
      />

      {prefsQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {prefsQuery.isError ? <ErrorBanner message="Không tải được cài đặt." /> : null}
          {mutation.isError ? <ErrorBanner message="Không lưu được thay đổi." /> : null}

          {prefs ? (
            <Card style={styles.card}>
              {ROWS.map((row, index) => (
                <View
                  key={row.key}
                  style={[styles.row, index === ROWS.length - 1 ? null : styles.divider]}
                >
                  <IconTile name={row.icon} tone={row.tone} />
                  <View style={styles.body}>
                    <Text style={styles.label}>{row.label}</Text>
                    <Text style={styles.hint}>{row.hint}</Text>
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

          <Text style={styles.note}>
            Nhắc hạn chót hoạt động ngay trên máy nên có thể trễ vài phút khi điện thoại ở chế độ
            tiết kiệm pin.
          </Text>
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
