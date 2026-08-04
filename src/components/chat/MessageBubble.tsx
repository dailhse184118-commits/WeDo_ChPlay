import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { ChatMessage } from '../../lib/types';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

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
    // Rung nhẹ khi nhấn giữ. Đây là tương tác native thật, thứ phân biệt app gốc
    // với trang web bọc lại.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
          isPending ? styles.bubblePending : null,
          isFailed ? styles.bubbleFailed : null,
        ]}
      >
        {recalled ? (
          <Text style={styles.recalled}>Tin nhắn đã được thu hồi</Text>
        ) : (
          <Text style={[styles.content, isMine ? styles.contentMine : null]}>
            {message.content}
          </Text>
        )}

        {message.task ? (
          <View style={styles.taskTag}>
            <Text style={styles.taskTagText}>Đã tạo công việc: {message.task.title}</Text>
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
  wrapper: { marginVertical: spacing.xs, maxWidth: '82%' },
  wrapperMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  wrapperTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  author: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
    marginLeft: spacing.xs,
  },
  bubble: { borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleMine: { backgroundColor: colors.primary },
  bubbleTheirs: { backgroundColor: colors.surface },
  bubblePending: { opacity: 0.6 },
  bubbleFailed: { borderWidth: 1, borderColor: colors.danger },
  content: { fontSize: fontSize.md, color: colors.text },
  contentMine: { color: '#ffffff' },
  recalled: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic' },
  taskTag: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.12)',
  },
  taskTagText: { fontSize: fontSize.xs, color: colors.success, fontWeight: '600' },
  time: { fontSize: 10, color: colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  timeMine: { color: 'rgba(255,255,255,0.75)' },
  retry: { marginTop: spacing.xs },
  retryText: { fontSize: fontSize.xs, color: colors.danger, fontWeight: '600' },
});
