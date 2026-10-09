import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { IconTile } from '../ui/IconTile';
import { useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienCongViec } from '../../i18n/tu-dien/cong-viec';
import type { QuyenTrenTask } from '../../lib/tasks/task-permissions';
import type { TaskSubmission } from '../../lib/types';
import { colors, fontSize, lineHeight, radius, spacing } from '../../theme/tokens';

/** Thao tác đang chờ máy chủ trả lời, để đúng một nút quay vòng. */
export type ThaoTacTask = 'nop' | 'guiDuyet' | 'duyet' | null;

interface TaskSubmissionPanelProps {
  quyen: Pick<QuyenTrenTask, 'nopTaiLieu' | 'guiDuyet' | 'duyetBai'>;
  submissions?: TaskSubmission[];
  /** Lý do leader trả bài về làm lại, nếu có. */
  reviewRejectedReason?: string | null;
  dangChay?: ThaoTacTask;
  onPick: () => void;
  onSubmitForReview: () => void;
  onApprove: () => void;
  onReject: () => void;
  /** Mở một tệp đã nộp. Thiếu thì dòng tệp chỉ để đọc. */
  onMoTep?: (tep: TaskSubmission) => void;
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
  onMoTep,
}: TaskSubmissionPanelProps) {
  const t = useTuDien(tuDienCongViec).nop;
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
          <Text style={styles.rejectTitle}>{t.baiBiTraLai}</Text>
          <Text style={styles.rejectText}>{reviewRejectedReason}</Text>
        </View>
      ) : null}

      <Card style={styles.card}>
        <Text style={styles.heading}>{t.taiLieuDaNop}</Text>

        {submissions.length === 0 ? (
          <Text style={styles.empty}>
            {quyen.nopTaiLieu
              ? t.chuaCoTepCanNop
              : t.chuaCoTep}
          </Text>
        ) : (
          submissions.map((tep, index) => {
            const noiDung = (
              <>
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
              </>
            );
            const kieuDong = [styles.row, index === submissions.length - 1 ? null : styles.rowDivider];

            if (!onMoTep) {
              return (
                <View key={tep.id} style={kieuDong}>
                  {noiDung}
                </View>
              );
            }

            /*
              Leader được hỏi "Duyệt bài" hay "Trả lại" thì phải xem được bài.
              Trước đây dòng này chỉ là chữ: chạm vào không có gì, leader duyệt
              mù hoặc phải chạy sang web.
            */
            return (
              <Pressable
                key={tep.id}
                testID={`submission-file-${tep.id}`}
                accessibilityRole="link"
                accessibilityLabel={t.moTep(tep.originalName)}
                onPress={() => onMoTep(tep)}
                style={({ pressed }) => [...kieuDong, pressed ? styles.rowPressed : null]}
              >
                {noiDung}
                <Ionicons name="open-outline" size={18} color={colors.textMuted} />
              </Pressable>
            );
          })
        )}
      </Card>

      {quyen.nopTaiLieu ? (
        <View style={styles.actions}>
          <View style={styles.actionItem}>
            <Button
              testID="submission-pick"
              label={t.nopTaiLieu}
              variant="secondary"
              onPress={onPick}
              loading={dangChay === 'nop'}
            />
          </View>
          <View style={styles.actionSpacer} />
          <View style={styles.actionItem}>
            <Button
              testID="submission-send"
              label={t.guiDuyet}
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
              label={t.duyetBai}
              onPress={onApprove}
              loading={dangChay === 'duyet'}
            />
          </View>
          <View style={styles.actionSpacer} />
          <View style={styles.actionItem}>
            <Button
              testID="review-reject"
              label={t.traLai}
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
  rowPressed: { opacity: 0.6 },
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
