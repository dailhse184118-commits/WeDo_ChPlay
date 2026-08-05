import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { tapFeedback } from '../../lib/haptics';
import type { ChatMessage } from '../../lib/types';
import { colors, fontSize, gradients, radius, shadows, spacing } from '../../theme/tokens';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  isPending?: boolean;
  isFailed?: boolean;
  onLongPress: () => void;
  onRetry?: () => void;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function MessageBubble({
  message,
  isMine,
  isPending = false,
  isFailed = false,
  onLongPress,
  onRetry,
}: MessageBubbleProps) {
  const recalled = Boolean(message.deletedAt);

  const handleLongPress = () => {
    if (recalled) return;
    // Rung nhẹ khi nhấn giữ. tapFeedback không bao giờ ném lỗi nên thiếu mô-tơ rung
    // hay thiếu module native cũng không chặn được luồng tạo công việc.
    void tapFeedback();
    onLongPress();
  };

  return (
    <View style={[styles.wrapper, isMine ? styles.wrapperMine : styles.wrapperTheirs]}>
      {!isMine && message.author ? (
        <Text style={styles.author}>{message.author.fullName}</Text>
      ) : null}

      <Pressable
        testID={`message-${message.id}`}
        accessibilityRole="button"
        accessibilityHint={recalled ? undefined : 'Nhấn giữ để tạo công việc từ tin nhắn này'}
        onLongPress={handleLongPress}
        delayLongPress={350}
        style={[
          styles.bubble,
          isMine
            ? { ...styles.bubbleMine, experimental_backgroundImage: gradients.header }
            : styles.bubbleTheirs,
          isPending ? styles.bubblePending : null,
          isFailed ? styles.bubbleFailed : null,
        ]}
      >
        {recalled ? (
          <Text style={[styles.recalled, isMine ? styles.recalledMine : null]}>
            Tin nhắn đã được thu hồi
          </Text>
        ) : (
          <Text style={[styles.content, isMine ? styles.contentMine : null]}>
            {message.content}
          </Text>
        )}

        {message.task ? (
          <View style={styles.taskStrip}>
            <View style={styles.taskTick}>
              <Ionicons name="checkmark" size={14} color={colors.primary} />
            </View>
            <View style={styles.taskBody}>
              <Text style={styles.taskLabel}>Đã tạo công việc</Text>
              <Text style={styles.taskTitle} numberOfLines={2}>
                {message.task.title}
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={[styles.time, isMine ? styles.timeMine : null]}>
          {isPending ? 'Đang gửi…' : formatTime(message.createdAt)}
        </Text>
      </Pressable>

      {isFailed && onRetry ? (
        <Pressable testID={`retry-${message.id}`} onPress={onRetry} style={styles.retry}>
          <Text style={styles.retryText}>Gửi lại</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: spacing.xs, maxWidth: '84%' },
  wrapperMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  wrapperTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  author: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginLeft: spacing.sm + 4,
  },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  // Một góc bo nhỏ để bong bóng "trỏ" về phía người gửi.
  bubbleMine: { borderBottomRightRadius: radius.sm, backgroundColor: colors.primary },
  bubbleTheirs: {
    borderBottomLeftRadius: radius.sm,
    backgroundColor: colors.background,
    boxShadow: shadows.bubble,
  },
  bubblePending: { opacity: 0.6 },
  bubbleFailed: { borderWidth: 1, borderColor: colors.danger },
  content: { fontSize: fontSize.md, color: colors.text, lineHeight: 22 },
  contentMine: { color: '#ffffff' },
  recalled: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic' },
  recalledMine: { color: 'rgba(255,255,255,0.85)' },
  // Nhãn công việc là một dải nền sáng nằm TRONG bong bóng, đọc được trên cả hai nền.
  taskStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm + 4,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  taskTick: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  taskBody: { flex: 1 },
  taskLabel: { fontSize: 11, color: colors.primary, fontWeight: '700' },
  taskTitle: { fontSize: fontSize.xs, color: colors.text, marginTop: 2, lineHeight: 17 },
  time: { fontSize: 11, color: colors.textMuted, marginTop: spacing.xs, alignSelf: 'flex-end' },
  timeMine: { color: 'rgba(255,255,255,0.8)' },
  retry: { marginTop: spacing.xs },
  retryText: { fontSize: fontSize.xs, color: colors.danger, fontWeight: '600' },
});
