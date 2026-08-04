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

import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { TextField } from '../ui/TextField';
import type { ChatTaskSuggestion, UserSummary } from '../../lib/types';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

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
  error?: string;
  onConfirm: (values: TaskSuggestionValues) => void;
  onDismiss: () => void;
  onReport?: () => void;
  submitting?: boolean;
}

const CONFIDENCE_LABEL: Record<ChatTaskSuggestion['confidence'], string> = {
  low: 'Độ tin cậy thấp',
  medium: 'Độ tin cậy trung bình',
  high: 'Độ tin cậy cao',
};

export function TaskSuggestionSheet({
  visible,
  loading = false,
  suggestion,
  members,
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

  // Nạp lại mỗi khi có đề xuất mới. AI chỉ gợi ý, người dùng vẫn sửa được mọi trường.
  useEffect(() => {
    if (!suggestion) return;
    setTitle(suggestion.title ?? '');
    setDescription(suggestion.description ?? '');
    setAssigneeId(suggestion.assigneeId);
    setDueDate(suggestion.dueDate ?? '');
    setDueTime(suggestion.dueTime ?? '');
    setLocalError('');
  }, [suggestion]);

  const handleConfirm = () => {
    if (!title.trim()) {
      setLocalError('Vui lòng nhập tên công việc');
      return;
    }
    setLocalError('');
    onConfirm({
      title: title.trim(),
      description: description.trim() || undefined,
      assigneeId,
      dueDate: dueDate.trim() || undefined,
      dueTime: dueTime.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.heading}>Tạo công việc từ tin nhắn</Text>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang phân tích tin nhắn…</Text>
          </View>
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled">
            {error ? <ErrorBanner message={error} /> : null}
            {localError ? <ErrorBanner message={localError} /> : null}

            {suggestion && !suggestion.hasTask ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>Tin nhắn này có vẻ không chứa công việc</Text>
                <Text style={styles.noticeBody}>
                  Bạn vẫn có thể tự nhập nội dung bên dưới để tạo công việc.
                </Text>
              </View>
            ) : null}

            {suggestion?.hasTask ? (
              <Text style={styles.confidence}>{CONFIDENCE_LABEL[suggestion.confidence]}</Text>
            ) : null}

            <TextField
              testID="suggestion-title"
              label="Tên công việc"
              value={title}
              onChangeText={setTitle}
              placeholder="Ví dụ: Nộp báo cáo tuần"
              autoCapitalize="sentences"
            />

            <TextField
              testID="suggestion-description"
              label="Mô tả"
              value={description}
              onChangeText={setDescription}
              placeholder="Không bắt buộc"
              autoCapitalize="sentences"
            />

            <Text style={styles.label}>Người phụ trách</Text>
            <View style={styles.memberList}>
              <Pressable
                testID="assignee-none"
                onPress={() => setAssigneeId(undefined)}
                style={[styles.memberChip, !assigneeId ? styles.memberChipActive : null]}
              >
                <Text style={[styles.memberText, !assigneeId ? styles.memberTextActive : null]}>
                  Chưa giao
                </Text>
              </Pressable>

              {members.map((member) => {
                const selected = assigneeId === member.id;
                return (
                  <Pressable
                    key={member.id}
                    testID={`assignee-${member.id}`}
                    onPress={() => setAssigneeId(member.id)}
                    style={[styles.memberChip, selected ? styles.memberChipActive : null]}
                  >
                    <Text style={[styles.memberText, selected ? styles.memberTextActive : null]}>
                      {member.fullName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.dueRow}>
              <View style={styles.dueCol}>
                <TextField
                  testID="suggestion-due-date"
                  label="Hạn chót (ngày)"
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="2026-08-10"
                />
              </View>
              <View style={styles.dueSpacer} />
              <View style={styles.dueCol}>
                <TextField
                  testID="suggestion-due-time"
                  label="Giờ"
                  value={dueTime}
                  onChangeText={setDueTime}
                  placeholder="09:00"
                />
              </View>
            </View>

            <Button
              testID="suggestion-confirm"
              label="Tạo công việc"
              onPress={handleConfirm}
              loading={submitting}
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
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
  heading: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  loading: { paddingVertical: spacing.xl, alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.textMuted, fontSize: fontSize.sm },
  notice: {
    backgroundColor: '#fff8e1',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeText: { color: colors.warning, fontWeight: '600', fontSize: fontSize.sm },
  noticeBody: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs },
  confidence: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.sm },
  label: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  memberList: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  memberChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  memberChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  memberText: { fontSize: fontSize.sm, color: colors.text },
  memberTextActive: { color: colors.primary, fontWeight: '600' },
  dueRow: { flexDirection: 'row' },
  dueCol: { flex: 1 },
  dueSpacer: { width: spacing.md },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footerLink: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  footerLinkMuted: { color: colors.textMuted, fontSize: fontSize.xs },
});
