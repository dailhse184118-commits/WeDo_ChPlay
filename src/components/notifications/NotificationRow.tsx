import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTuDien, useNgonNgu } from '../../i18n/NgonNguProvider';
import { dinhDangThoiGian } from '../../i18n/dinh-dang';
import type { NgonNgu } from '../../i18n/ngon-ngu';
import { tuDienThongBao } from '../../i18n/tu-dien/thong-bao';
import { Card } from '../ui/Card';
import { IconTile, type IconTileTone } from '../ui/IconTile';
import type { NotificationItem, NotificationType } from '../../lib/types';
import { colors, fontSize, lineHeight, radius, scale, spacing } from '../../theme/tokens';

/** Mỗi loại thông báo có một ô icon tô màu theo ý nghĩa. */
const LOOK: Record<
  NotificationType,
  { icon: React.ComponentProps<typeof IconTile>['name']; tone: IconTileTone }
> = {
  TASK_ASSIGNED: { icon: 'person-add-outline', tone: 'info' },
  TASK_ACCEPTED: { icon: 'checkmark-circle-outline', tone: 'done' },
  TASK_REJECTED: { icon: 'close-circle-outline', tone: 'rejected' },
  TASK_SUBMITTED: { icon: 'cloud-upload-outline', tone: 'info' },
  TASK_REVIEW_APPROVED: { icon: 'checkmark-done-outline', tone: 'done' },
  TASK_REVIEW_REJECTED: { icon: 'return-down-back-outline', tone: 'rejected' },
  TASK_DEADLINE_REMINDER: { icon: 'alarm-outline', tone: 'deadline' },
  MEETING_SCHEDULED: { icon: 'videocam-outline', tone: 'info' },
  SUBSCRIPTION_RENEWAL_DUE: { icon: 'card-outline', tone: 'deadline' },
  PAYMENT_CONFIRMED: { icon: 'receipt-outline', tone: 'done' },
  PROJECT_MEMBER_JOINED: { icon: 'people-outline', tone: 'info' },
};

const FALLBACK = { icon: 'notifications-outline' as const, tone: 'info' as IconTileTone };

function formatWhen(iso: string, t: typeof tuDienThongBao.vi, ngonNgu: NgonNgu): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return t.vuaXong;
  if (diffMinutes < 60) return t.phutTruoc(diffMinutes);
  if (diffMinutes < 24 * 60) return t.gioTruoc(Math.floor(diffMinutes / 60));
  if (diffMinutes < 48 * 60) return t.homQua;

  if (ngonNgu === 'en') {
    // Giờ Việt Nam, giống mọi ngày giờ khác trong app.
    return dinhDangThoiGian(date, 'en', { month: 'short', day: 'numeric' });
  }

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

export function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: () => void;
}) {
  const t = useTuDien(tuDienThongBao);
  const { ngonNgu } = useNgonNgu();
  const unread = !item.readAt;
  const look = LOOK[item.type] ?? FALLBACK;

  return (
    <Card
      testID={`notification-${item.id}`}
      onPress={onPress}
      style={[styles.card, unread ? styles.cardUnread : null]}
    >
      <View style={styles.row}>
        <IconTile testID={`notification-icon-${item.id}`} name={look.icon} tone={look.tone} />

        <View style={styles.body}>
          <Text style={[styles.title, unread ? styles.titleUnread : null]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.message} numberOfLines={3}>
            {item.message}
          </Text>
          <Text style={styles.when}>{formatWhen(item.createdAt, t, ngonNgu)}</Text>
        </View>

        {unread ? <View testID={`unread-dot-${item.id}`} style={styles.dot} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm + 4 },
  cardUnread: { backgroundColor: colors.primarySoft },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  body: { flex: 1, marginHorizontal: spacing.sm + 4 },
  title: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  titleUnread: { fontWeight: '700' },
  message: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xxs, lineHeight: lineHeight.sm },
  when: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  dot: {
    width: scale(10),
    height: scale(10),
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
  },
});
