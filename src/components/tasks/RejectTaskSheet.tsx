import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ErrorBanner } from '../ui/ErrorBanner';
import { colors, fontSize, lineHeight, radius, scaleWithFont, shadows, sizes, spacing } from '../../theme/tokens';

/**
 * Ba lý do chọn nhanh. Bắt buộc gõ tay sinh ra những lý do rỗng kiểu "không rảnh";
 * chạm chip điền sẵn vào ô rồi vẫn sửa được, nên vừa nhanh vừa cụ thể hơn.
 */
export const QUICK_REASONS = [
  'Trùng deadline khác',
  'Đang quá tải',
  'Không đúng phần mình',
] as const;

const MAX_LENGTH = 200;

interface RejectTaskSheetProps {
  visible: boolean;
  submitting?: boolean;
  error?: string;
  /** Tên người giao việc, dùng trong câu giải thích. */
  assignerName?: string;
  /*
    Bốn chỗ chữ dưới đây để trống thì phiếu nói chuyện từ chối *nhận việc*.
    Leader trả bài về cũng cần đúng phiếu này, chỉ khác lời — nên đổi chữ thay
    vì nhân bản component, tránh hai bản trôi khỏi nhau.
  */
  heading?: string;
  body?: string;
  confirmLabel?: string;
  quickReasons?: readonly string[];
  onConfirm: (reason: string) => void;
  onDismiss: () => void;
}

export function RejectTaskSheet({
  visible,
  submitting = false,
  error,
  assignerName,
  heading = 'Từ chối công việc',
  body,
  confirmLabel = 'Gửi từ chối',
  quickReasons = QUICK_REASONS,
  onConfirm,
  onDismiss,
}: RejectTaskSheetProps) {
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState('');

  const handleConfirm = () => {
    const trimmed = reason.trim();
    // Khớp ràng buộc MinLength(3) của RejectTaskDto phía server.
    if (trimmed.length < 3) {
      setLocalError('Lý do từ chối phải có ít nhất 3 ký tự');
      return;
    }
    setLocalError('');
    onConfirm(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.heading}>{heading}</Text>
        <Text style={styles.body}>
          {body ??
            `${
              assignerName ? `${assignerName} sẽ thấy lý do của bạn` : 'Người giao việc sẽ thấy lý do'
            }, nên viết ngắn gọn và cụ thể giúp nhóm sắp xếp lại.`}
        </Text>

        {error ? <ErrorBanner message={error} /> : null}
        {localError ? <ErrorBanner message={localError} /> : null}

        <View style={styles.chips}>
          {quickReasons.map((quick, index) => (
            <Pressable
              key={quick}
              testID={`quick-reason-${index}`}
              accessibilityRole="button"
              onPress={() => {
                setReason(quick);
                setLocalError('');
              }}
              style={({ pressed }) => [styles.chip, pressed ? styles.chipPressed : null]}
            >
              <Text style={styles.chipText}>{quick}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Lý do từ chối</Text>
        <TextInput
          testID="reject-reason"
          accessibilityLabel="Lý do từ chối"
          value={reason}
          onChangeText={(value) => {
            setReason(value);
            if (localError) setLocalError('');
          }}
          placeholder="Ví dụ: tuần này mình thi giữa kỳ, không kịp làm."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
          maxLength={MAX_LENGTH}
          // Từ điển tiếng Anh của Android gạch đỏ toàn bộ tiếng Việt.
          spellCheck={false}
          autoCorrect={false}
        />

        <View style={styles.meta}>
          <Text style={styles.required}>Bắt buộc nhập</Text>
          <Text testID="reject-counter" style={styles.counter}>
            {reason.length}/{MAX_LENGTH}
          </Text>
        </View>

        <Pressable
          testID="reject-confirm"
          accessibilityRole="button"
          accessibilityState={{ disabled: submitting, busy: submitting }}
          disabled={submitting}
          onPress={handleConfirm}
          style={({ pressed }) => [
            styles.submit,
            pressed && !submitting ? styles.submitPressed : null,
            submitting ? styles.submitDisabled : null,
          ]}
        >
          <Text style={styles.submitText}>{submitting ? 'Đang gửi…' : confirmLabel}</Text>
        </Pressable>

        <Pressable testID="reject-cancel" onPress={onDismiss} style={styles.cancel}>
          <Text style={styles.cancelText}>Huỷ</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  heading: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  body: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    lineHeight: lineHeight.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  chip: {
    minHeight: scaleWithFont(36),
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipPressed: { backgroundColor: colors.primarySoft },
  chipText: { fontSize: fontSize.xs, color: colors.text, fontWeight: '600' },
  label: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 96,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    textAlignVertical: 'top',
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  required: { fontSize: fontSize.xs, color: colors.textMuted },
  counter: { fontSize: fontSize.xs, color: colors.textMuted },
  submit: {
    minHeight: sizes.control,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 16px rgba(198, 40, 40, 0.32)',
  },
  submitPressed: { opacity: 0.9 },
  submitDisabled: { opacity: 0.6, boxShadow: shadows.card },
  submitText: { color: colors.onPrimary, fontWeight: '700', fontSize: fontSize.md },
  cancel: { marginTop: spacing.md, alignItems: 'center' },
  cancelText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
});
