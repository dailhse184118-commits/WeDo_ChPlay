import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../ui/Card';
import { IconTile, type IconTileTone } from '../ui/IconTile';
import type { NotificationItem, NotificationType } from '../../lib/types';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

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
};

const FALLBACK = { icon: 'notifications-outline' as const, tone: 'info' as IconTileTone };

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffMinutes < 24 * 60) return `${Math.floor(diffMinutes / 60)} giờ trước`;
  if (diffMinutes < 48 * 60) return 'Hôm qua';

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
          <Text style={[styles.title, unread ? styles.titleUnread : null]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.when}>{formatWhen(item.createdAt)}</Text>
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
  message: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2, lineHeight: 19 },
  when: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
  },
});
