import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { TextField } from '../ui/TextField';
import type { ChatTaskSuggestion, UserSummary } from '../../lib/types';
import { colors, fontSize, lineHeight, radius, scale, scaleWithFont, shadows, spacing } from '../../theme/tokens';

export interface TaskSuggestionValues {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
  dueTime?: string;
}

interface TaskSuggestionSheetProps {
  visible: boolean;
  loading?: boolean;
  suggestion?: ChatTaskSuggestion;
  members: UserSummary[];
  /** Nội dung tin nhắn gốc, để người dùng đối chiếu trước khi giao việc cho ai đó. */
  sourceMessage?: string;
  /** Id của mình, để chip hiện "Bạn" thay vì họ tên. */
  currentUserId?: string;
  error?: string;
  onConfirm: (values: TaskSuggestionValues) => void;
  onDismiss: () => void;
  onReport?: () => void;
  submitting?: boolean;
}

const CONFIDENCE_LABEL: Record<ChatTaskSuggestion['confidence'], string> = {
  low: 'Tin cậy thấp',
  medium: 'Tin cậy trung bình',
  high: 'Tin cậy cao',
};

/** Sinh viên hầu như luôn để hạn cuối ngày, nên đây là mặc định hợp lý nhất. */
const DEFAULT_DUE_TIME = '23:59';

export function TaskSuggestionSheet({
  visible,
  loading = false,
  suggestion,
  members,
  sourceMessage,
  currentUserId,
  error,
  onConfirm,
  onDismiss,
  onReport,
  submitting = false,
}: TaskSuggestionSheetProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!suggestion) return;
    setTitle(suggestion.title ?? '');
    setDescription(suggestion.description ?? '');
    setAssigneeId(suggestion.assigneeId);
    setDueDate(suggestion.dueDate ?? '');
    // AI thường trả ngày mà không trả giờ. Để trống thì hoá ra 00:00, tức hết hạn
    // ngay đầu ngày — trái hẳn ý người viết tin nhắn.
    // Máy chủ trả CHUỖI RỖNG chứ không phải undefined khi không đoán được giờ,
    // nên phải kiểm tra rỗng chứ `??` không đỡ được.
    setDueTime(suggestion.dueTime?.trim() ? suggestion.dueTime : DEFAULT_DUE_TIME);
    setLocalError('');
  }, [suggestion]);

  const handleConfirm = () => {
    if (!title.trim()) {
      setLocalError('Vui lòng nhập tên công việc');
      return;
    }
    setLocalError('');

    /*
      Lưới an toàn cuối: có ngày mà người dùng xoá trống ô giờ thì vẫn phải là cuối
      ngày. Gửi ngày không kèm giờ sẽ thành 00:00, tức việc quá hạn ngay lúc tạo.
    */
    const date = dueDate.trim();
    const time = dueTime.trim();

    onConfirm({
      title: title.trim(),
      description: description.trim() || undefined,
      assigneeId,
      dueDate: date || undefined,
      dueTime: date ? time || DEFAULT_DUE_TIME : undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        {loading ? (
          <View style={styles.loading}>
            <View style={styles.spinnerRing}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={styles.loadingTitle}>Đang phân tích tin nhắn…</Text>
            <Text style={styles.loadingBody}>
              Thường mất vài giây. Bạn có thể đóng lại và làm việc khác.
            </Text>
          </View>
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.headingRow}>
              <View style={styles.headingBlock}>
                <Text style={styles.heading}>Đề xuất công việc</Text>
                <Text style={styles.headingSub}>Bạn kiểm tra lại trước khi tạo nhé</Text>
              </View>
              {suggestion?.hasTask ? (
                <View style={styles.confidence}>
                  <Text style={styles.confidenceText}>
                    {CONFIDENCE_LABEL[suggestion.confidence]}
                  </Text>
                </View>
              ) : null}
            </View>

            {error ? <ErrorBanner message={error} /> : null}
            {localError ? <ErrorBanner message={localError} /> : null}

            {sourceMessage ? (
              <View style={styles.quote}>
                <Text style={styles.quoteText} numberOfLines={4}>
                  “{sourceMessage}”
                </Text>
              </View>
            ) : null}

            {/*
              Khi có lỗi thì KHÔNG hiện lời nhắc này. Lúc gọi AI hỏng, màn chat gán
              một đề xuất rỗng để người dùng vẫn tự nhập tay được — nhưng đề xuất
              rỗng đó lại kích hoạt câu "không chứa công việc", chồng lên banner
              lỗi thật thành hai thông báo mâu thuẫn nhau.
            */}
            {suggestion && !suggestion.hasTask && !error ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>Tin nhắn này có vẻ không chứa công việc</Text>
                <Text style={styles.noticeBody}>
                  Bạn vẫn có thể tự nhập nội dung bên dưới để tạo công việc.
                </Text>
              </View>
            ) : null}

            <TextField
              testID="suggestion-title"
              label="Tên công việc"
              value={title}
              onChangeText={setTitle}
              placeholder="Ví dụ: Khảo sát người dùng"
              autoCapitalize="sentences"
            />

            <TextField
              testID="suggestion-description"
              label="Mô tả"
              value={description}
              onChangeText={setDescription}
              placeholder="Không bắt buộc"
              autoCapitalize="sentences"
              multiline
            />

            <Text style={styles.label}>Người phụ trách</Text>
            <View style={styles.memberList}>
              <Pressable
                testID="assignee-none"
                onPress={() => setAssigneeId(undefined)}
                style={[styles.chip, !assigneeId ? styles.chipActive : null]}
              >
                <Text style={[styles.chipText, !assigneeId ? styles.chipTextActive : null]}>
                  Chưa giao
                </Text>
              </Pressable>

              {members.map((member) => {
                const selected = assigneeId === member.id;
                const label = member.id === currentUserId ? 'Bạn' : member.fullName;
                return (
                  <Pressable
                    key={member.id}
                    testID={`assignee-${member.id}`}
                    onPress={() => setAssigneeId(member.id)}
                    style={[styles.chip, selected ? styles.chipActive : null]}
                  >
                    {selected ? (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={colors.primary}
                        style={styles.chipTick}
                      />
                    ) : null}
                    <Text style={[styles.chipText, selected ? styles.chipTextActive : null]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.dueRow}>
              <View style={styles.dueDate}>
                <TextField
                  testID="suggestion-due-date"
                  label="Ngày hết hạn"
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="2026-08-20"
                />
              </View>
              <View style={styles.dueSpacer} />
              <View style={styles.dueTime}>
                <TextField
                  testID="suggestion-due-time"
                  label="Giờ"
                  value={dueTime}
                  onChangeText={setDueTime}
                  placeholder={DEFAULT_DUE_TIME}
                />
              </View>
            </View>

            <Button
              testID="suggestion-confirm"
              label="Tạo công việc"
              onPress={handleConfirm}
              loading={submitting}
              disabled={!title.trim()}
            />

            <View style={styles.footer}>
              <Pressable testID="suggestion-cancel" onPress={onDismiss}>
                <Text style={styles.footerLink}>Huỷ</Text>
              </Pressable>

              {onReport ? (
                <Pressable testID="suggestion-report" onPress={onReport}>
                  <Text style={styles.footerLinkMuted}>Đề xuất này không đúng</Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Xanh đen thay vì xám trung tính, để sheet trắng nổi ấm hơn.
  backdrop: { flex: 1, backgroundColor: 'rgba(4, 26, 58, 0.5)' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    boxShadow: '0 -8px 32px rgba(4, 26, 58, 0.18)',
  },
  handle: {
    width: scale(44),
    height: scale(4),
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  loading: { paddingVertical: spacing.xl, alignItems: 'center' },
  spinnerRing: {
    width: scale(72),
    height: scale(72),
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.button,
    marginBottom: spacing.md,
  },
  loadingTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  loadingBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: lineHeight.sm,
  },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  headingBlock: { flex: 1 },
  heading: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  headingSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xxs },
  confidence: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
    marginLeft: spacing.sm,
  },
  confidenceText: { fontSize: fontSize.xxs, fontWeight: '700', color: colors.success },
  quote: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
  },
  quoteText: { fontSize: fontSize.sm, color: colors.text, fontStyle: 'italic', lineHeight: lineHeight.sm },
  // Viền trái thay vì viền vây quanh: nhẹ hơn, đọc nhanh hơn.
  notice: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.sm,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
  },
  noticeText: { color: colors.warningText, fontWeight: '700', fontSize: fontSize.sm },
  noticeBody: { color: colors.warningText, fontSize: fontSize.xs, marginTop: spacing.xs },
  label: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  memberList: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: scaleWithFont(36),
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primarySoft },
  chipTick: { marginRight: spacing.xs },
  chipText: { fontSize: fontSize.xs, color: colors.text, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
  dueRow: { flexDirection: 'row' },
  dueDate: { flex: 3 },
  dueSpacer: { width: spacing.md },
  dueTime: { flex: 2 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footerLink: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  footerLinkMuted: { color: colors.textMuted, fontSize: fontSize.xs },
});
