import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fontSize, radius, scale, scaleWithFont, spacing } from '../../theme/tokens';

interface MessageComposerProps {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
}

export function MessageComposer({
  value,
  onChangeText,
  onSend,
  sending = false,
}: MessageComposerProps) {
  const canSend = value.trim().length > 0 && !sending;

  return (
    <View style={styles.bar}>
      <TextInput
        testID="composer-input"
        accessibilityLabel="Soạn tin nhắn"
        value={value}
        onChangeText={onChangeText}
        placeholder="Nhập tin nhắn…"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        multiline
        maxLength={2000}
        // Từ điển tiếng Anh của Android gạch đỏ toàn bộ tiếng Việt.
        spellCheck={false}
        autoCorrect={false}
      />

      <Pressable
        testID="composer-send"
        accessibilityRole="button"
        accessibilityLabel="Gửi"
        accessibilityState={{ disabled: !canSend }}
        onPress={() => {
          if (canSend) onSend();
        }}
        style={[styles.send, canSend ? null : styles.sendDisabled]}
      >
        {sending ? (
          <ActivityIndicator color={colors.onPrimary} size="small" />
        ) : (
          <Text style={styles.sendText}>Gửi</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  send: {
    marginLeft: spacing.sm,
    minWidth: scale(64),
    minHeight: scaleWithFont(44),
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: colors.onPrimary, fontWeight: '700', fontSize: fontSize.sm },
});
