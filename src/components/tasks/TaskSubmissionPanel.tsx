import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { IconTile } from '../ui/IconTile';
import type { QuyenTrenTask } from '../../lib/tasks/task-permissions';
import type { TaskSubmission } from '../../lib/types';
import { colors, fontSize, lineHeight, radius, spacing } from '../../theme/tokens';

/** Thao tác đang chờ máy chủ trả lời, để đúng một nút quay vòng. */
export type ThaoTacTask = 'nop' | 'guiDuyet' | 'duyet' | null;

interface TaskSubmissionPanelProps {
  quyen: QuyenTrenTask;
  submissions?: TaskSubmission[];
  /** Lý do leader trả bài về làm lại, nếu có. */
  reviewRejectedReason?: string | null;
  dangChay?: ThaoTacTask;
  onPick: () => void;
  onSubmitForReview: () => void;
  onApprove: () => void;
  onReject: () => void;
}

/** Đổi số byte sang chuỗi người đọc được. Dưới 1MB thì tính bằng KB. */
function doDai(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskSubmissionPanel({
  quyen,
  submissions = [],
  reviewRejectedReason,
  dangChay = null,
  onPick,
  onSubmitForReview,
  onApprove,
  onReject,
}: TaskSubmissionPanelProps) {
  const coViecDeLam = quyen.nopTaiLieu || quyen.duyetBai;

  /*
    Thành viên thường mở việc của người khác thì phần này không có gì để nói.
    Vẽ ra một cái thẻ rỗng chỉ làm màn hình dài thêm.
  */
  if (!coViecDeLam && submissions.length === 0 && !reviewRejectedReason) {
    return null;
  }

  return (
    <View>
      {reviewRejectedReason ? (
        <View style={styles.rejectBox}>
          <Text style={styles.rejectTitle}>Bài bị trả lại</Text>
          <Text style={styles.rejectText}>{reviewRejectedReason}</Text>
        </View>
      ) : null}

      <Card style={styles.card}>
        <Text style={styles.heading}>Tài liệu đã nộp</Text>

        {submissions.length === 0 ? (
          <Text style={styles.empty}>
            {quyen.nopTaiLieu
              ? 'Chưa có tệp nào. Nộp ít nhất một tệp rồi mới gửi duyệt được.'
              : 'Chưa có tệp nào.'}
          </Text>
        ) : (
          submissions.map((tep, index) => (
            <View
              key={tep.id}
              style={[styles.row, index === submissions.length - 1 ? null : styles.rowDivider]}
            >
              <IconTile name="document-text-outline" tone="info" size={32} />
              <View style={styles.rowText}>
                {/* Tên gốc, không phải `fileName` — máy chủ đã đổi tên để tránh trùng. */}
                <Text style={styles.fileName} numberOfLines={2}>
                  {tep.originalName}
                </Text>
                <Text style={styles.fileMeta}>
                  {doDai(tep.size)}
                  {tep.uploader?.fullName ? ` · ${tep.uploader.fullName}` : ''}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card>

      {quyen.nopTaiLieu ? (
        <View style={styles.actions}>
          <View style={styles.actionItem}>
            <Button
              testID="submission-pick"
              label="Nộp tài liệu"
              variant="secondary"
              onPress={onPick}
              loading={dangChay === 'nop'}
            />
          </View>
          <View style={styles.actionSpacer} />
          <View style={styles.actionItem}>
            <Button
              testID="submission-send"
              label="Gửi duyệt"
              onPress={onSubmitForReview}
              loading={dangChay === 'guiDuyet'}
              // Máy chủ từ chối khi chưa có tệp; khoá sẵn thay vì để bấm rồi báo lỗi.
              disabled={!quyen.guiDuyet}
            />
          </View>
        </View>
      ) : null}

      {quyen.duyetBai ? (
        <View style={styles.actions}>
          <View style={styles.actionItem}>
            <Button
              testID="review-approve"
              label="Duyệt bài"
              onPress={onApprove}
              loading={dangChay === 'duyet'}
            />
          </View>
          <View style={styles.actionSpacer} />
          <View style={styles.actionItem}>
            <Button
              testID="review-reject"
              label="Trả lại"
              variant="danger"
              onPress={onReject}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.md, paddingVertical: 0 },
  heading: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
    paddingTop: spacing.md,
  },
  empty: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: lineHeight.sm,
    paddingVertical: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 4 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowText: { flex: 1, marginLeft: spacing.sm + 4 },
  fileName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  fileMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  rejectBox: {
    marginTop: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  rejectTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.warningText },
  rejectText: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginTop: spacing.xs,
    lineHeight: lineHeight.sm,
  },
  actions: { flexDirection: 'row', marginTop: spacing.md },
  actionItem: { flex: 1 },
  actionSpacer: { width: spacing.md },
});
