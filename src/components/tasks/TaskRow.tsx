import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../ui/Card';
import { IconTile, type IconTileTone } from '../ui/IconTile';
import { bucketOf, type DeadlineBucket } from '../../lib/tasks/deadline-groups';
import type { Task } from '../../lib/types';
import { colors, fontSize, lineHeight, radius, scaleWithFont, spacing } from '../../theme/tokens';

interface TaskRowProps {
  task: Task;
  now: Date;
  onPress: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  accepting?: boolean;
}

const STATUS_LABEL: Record<Task['status'], string> = {
  TODO: 'Cần làm',
  IN_PROGRESS: 'Đang làm',
  REVIEW: 'Chờ duyệt',
  DONE: 'Xong',
};

/** Ô icon đổi màu theo nhóm hạn — chỗ màu sắc vào nhiều nhất mà không phá bảng màu. */
const TONE_BY_BUCKET: Record<DeadlineBucket, IconTileTone> = {
  pending: 'info',
  overdue: 'rejected',
  today: 'deadline',
  thisWeek: 'info',
  later: 'info',
  noDueDate: 'info',
};

const ICON_BY_BUCKET: Record<DeadlineBucket, React.ComponentProps<typeof IconTile>['name']> = {
  pending: 'hand-left-outline',
  overdue: 'alert-circle-outline',
  today: 'time-outline',
  thisWeek: 'calendar-outline',
  later: 'calendar-outline',
  noDueDate: 'ellipse-outline',
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatHourMinute(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Diễn đạt hạn chót theo cách người dùng nghĩ, không phải theo cách máy lưu.
 * "Quá hạn 2 ngày" dễ hiểu hơn "02/08 10:00" rất nhiều.
 */
function describeDue(task: Task, now: Date): string | null {
  if (!task.dueDate) return null;

  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return null;

  if (task.status === 'DONE' && task.completedAt) {
    const done = new Date(task.completedAt);
    if (!Number.isNaN(done.getTime())) return `Xong lúc ${formatHourMinute(done)}`;
  }

  const dayDiff = Math.round((startOfDay(due) - startOfDay(now)) / DAY_MS);

  if (dayDiff === 0) return `Hạn hôm nay, ${formatHourMinute(due)}`;
  if (dayDiff === 1) return `Hạn ngày mai, ${formatHourMinute(due)}`;
  if (dayDiff < 0) {
    const days = Math.abs(dayDiff);
    return days === 1 ? 'Quá hạn 1 ngày' : `Quá hạn ${days} ngày`;
  }

  const dd = String(due.getDate()).padStart(2, '0');
  const mm = String(due.getMonth() + 1).padStart(2, '0');
  return `Hạn ${dd}/${mm}, ${formatHourMinute(due)}`;
}

export function TaskRow({ task, now, onPress, onAccept, onReject, accepting }: TaskRowProps) {
  const bucket = bucketOf(task, now);
  const pending = task.assignmentStatus === 'PENDING';
  const rejected = task.assignmentStatus === 'REJECTED';
  const overdue = bucket === 'overdue';
  const done = task.status === 'DONE';

  const dueText = describeDue(task, now);
  const subtitle = [task.project?.name, dueText].filter(Boolean).join(' · ');

  return (
    <Card
      testID={`task-row-${task.id}`}
      onPress={onPress}
      style={[styles.card, overdue ? styles.cardOverdue : null]}
    >
      <View style={styles.top}>
        <IconTile
          testID={`task-icon-${task.id}`}
          name={ICON_BY_BUCKET[bucket]}
          tone={TONE_BY_BUCKET[bucket]}
        />

        <View style={styles.body}>
          <Text style={[styles.title, done ? styles.titleDone : null]} numberOfLines={3}>
            {task.title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, overdue ? styles.subtitleOverdue : null]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/*
          Việc đã từ chối phải nói rõ là đã từ chối. Máy chủ đưa nó về trạng thái
          TODO, nên nếu chỉ hiện trạng thái thì nó trông y hệt một việc còn phải
          làm — người dùng vừa từ chối xong lại tưởng mình vẫn nợ nó.
        */}
        <View style={[styles.chip, rejected ? styles.chipRejected : null]}>
          <Text style={[styles.chipText, rejected ? styles.chipTextRejected : null]}>
            {rejected ? 'Đã từ chối' : STATUS_LABEL[task.status]}
          </Text>
        </View>
      </View>

      {pending && onAccept && onReject ? (
        <View style={styles.actions}>
          <Pressable
            testID={`task-accept-${task.id}`}
            accessibilityRole="button"
            disabled={accepting}
            onPress={onAccept}
            style={({ pressed }) => [
              styles.accept,
              pressed && !accepting ? styles.pressed : null,
              accepting ? styles.disabled : null,
            ]}
          >
            <Text style={styles.acceptText}>Nhận việc</Text>
          </Pressable>

          <Pressable
            testID={`task-reject-${task.id}`}
            accessibilityRole="button"
            disabled={accepting}
            onPress={onReject}
            style={({ pressed }) => [
              styles.reject,
              pressed && !accepting ? styles.pressed : null,
              accepting ? styles.disabled : null,
            ]}
          >
            <Text style={styles.rejectText}>Từ chối</Text>
          </Pressable>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm + 4 },
  // Viền trái 4 màu đỏ, nhẹ và đọc nhanh hơn viền vây quanh.
  cardOverdue: { borderLeftWidth: 4, borderLeftColor: colors.danger },
  top: { flexDirection: 'row', alignItems: 'flex-start' },
  body: { flex: 1, marginHorizontal: spacing.sm + 4 },
  title: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, lineHeight: lineHeight.md },
  titleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  subtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  subtitleOverdue: { color: colors.danger, fontWeight: '600' },
  chip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  chipText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted },
  chipRejected: { backgroundColor: colors.dangerSoft },
  chipTextRejected: { color: colors.danger },
  actions: { flexDirection: 'row', marginTop: spacing.md },
  accept: {
    flex: 1,
    minHeight: scaleWithFont(40),
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: { color: colors.onPrimary, fontWeight: '700', fontSize: fontSize.xs },
  reject: {
    flex: 1,
    minHeight: scaleWithFont(40),
    marginLeft: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: { color: colors.danger, fontWeight: '600', fontSize: fontSize.xs },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
