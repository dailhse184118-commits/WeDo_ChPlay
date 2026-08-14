import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { RejectTaskSheet } from '../../../components/tasks/RejectTaskSheet';
import {
  TaskSubmissionPanel,
  type ThaoTacTask,
} from '../../../components/tasks/TaskSubmissionPanel';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import { IconTile, type IconTileTone } from '../../../components/ui/IconTile';
import { listProjects } from '../../../lib/api/projects';
import {
  acceptTask,
  approveReview,
  getTask,
  rejectReview,
  rejectTask,
  submitForReview,
  uploadSubmissions,
  type TepChon,
} from '../../../lib/api/tasks';
import { useAuth } from '../../../lib/auth/auth-context';
import { chonTaiLieu } from '../../../lib/files/pick-documents';
import { quyenTrenTask } from '../../../lib/tasks/task-permissions';
import type { Task } from '../../../lib/types';
import { useRefetchOnScreenFocus } from '../../../lib/use-refetch-on-focus';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, lineHeight, radius, spacing } from '../../../theme/tokens';

/** Lý do trả bài hay gặp, thay cho ba lý do từ chối nhận việc. */
const LY_DO_TRA_BAI = ['Thiếu nội dung', 'Sai định dạng', 'Cần bổ sung số liệu'] as const;

const STATUS_LABEL: Record<Task['status'], string> = {
  TODO: 'Cần làm',
  IN_PROGRESS: 'Đang làm',
  REVIEW: 'Chờ duyệt',
  DONE: 'Xong',
};

const ASSIGNMENT_LABEL: Record<string, string> = {
  PENDING: 'Chờ bạn phản hồi',
  ACCEPTED: 'Đã nhận',
  REJECTED: 'Đã từ chối',
};

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()} lúc ${hh}:${mi}`;
}

function Row({
  icon,
  tone,
  label,
  value,
  last,
}: {
  icon: React.ComponentProps<typeof IconTile>['name'];
  tone: IconTileTone;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last ? null : styles.rowDivider]}>
      <IconTile name={icon} tone={tone} size={32} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

export default function TaskDetailScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  /*
    Vào màn này từ thông báo thì ngăn xếp có thể rỗng, lúc đó `back()` không đi
    đâu cả. Rơi về danh sách việc cho chắc.
  */
  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/tasks');
  }, [router]);

  const [rejecting, setRejecting] = useState(false);
  const [rejectingReview, setRejectingReview] = useState(false);
  const [actionError, setActionError] = useState('');

  const { user } = useAuth();
  const { workspaces } = useWorkspace();

  const taskQuery = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTask(taskId as string),
    enabled: Boolean(taskId),
  });

  /*
    Màn này nằm trong thanh tab nên KHÔNG bị gỡ khi rời đi. Thiếu móc này thì nó
    giữ nguyên dữ liệu của lần mở đầu tiên — mở lại cùng công việc sau khi người
    khác đã sửa vẫn thấy bản cũ.
  */
  useRefetchOnScreenFocus(taskQuery.refetch);

  const task = taskQuery.data;

  /*
    Chỉ để biết mình có phải leader của dự án này không — `GET /tasks/:id` không
    kèm danh sách thành viên. Dùng đúng khoá mà tab Trò chuyện đã dùng nên
    thường là đọc lại từ bộ nhớ đệm, không tốn thêm một vòng mạng.
  */
  const projectsQuery = useQuery({
    queryKey: ['projects', task?.workspaceId],
    queryFn: () => listProjects(task?.workspaceId),
    enabled: Boolean(task?.workspaceId && task?.projectId),
  });

  const quyen = useMemo(() => {
    if (!task || !user) {
      return { nopTaiLieu: false, guiDuyet: false, duyetBai: false };
    }
    return quyenTrenTask({
      task,
      meId: user.id,
      project: projectsQuery.data?.find((duAn) => duAn.id === task.projectId) ?? null,
      workspace: workspaces.find((ws) => ws.id === task.workspaceId) ?? null,
    });
  }, [task, user, projectsQuery.data, workspaces]);

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    void queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }, [queryClient, taskId]);

  const acceptMutation = useMutation({
    mutationFn: () => acceptTask(taskId as string),
    onSuccess: () => {
      setActionError('');
      invalidate();
    },
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Không nhận được việc này.'),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectTask(taskId as string, reason),
    onSuccess: () => {
      setActionError('');
      setRejecting(false);
      invalidate();
    },
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Không từ chối được việc này.'),
  });

  const uploadMutation = useMutation({
    mutationFn: (files: TepChon[]) => uploadSubmissions(taskId as string, files),
    onSuccess: () => {
      setActionError('');
      invalidate();
    },
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Không nộp được tài liệu.'),
  });

  const sendReviewMutation = useMutation({
    mutationFn: () => submitForReview(taskId as string),
    onSuccess: () => {
      setActionError('');
      invalidate();
    },
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Không gửi duyệt được.'),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveReview(taskId as string),
    onSuccess: () => {
      setActionError('');
      invalidate();
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Không duyệt được bài.'),
  });

  const rejectReviewMutation = useMutation({
    mutationFn: (reason: string) => rejectReview(taskId as string, reason),
    onSuccess: () => {
      setActionError('');
      setRejectingReview(false);
      invalidate();
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Không trả bài được.'),
  });

  /*
    Mở hộp chọn tệp TRƯỚC rồi mới gọi mutation. Gộp cả hai vào `mutationFn` thì
    vòng quay trên nút chạy suốt lúc người dùng còn đang lục tìm tệp trong máy.
  */
  const chonVaNop = useCallback(async () => {
    setActionError('');
    try {
      const files = await chonTaiLieu();
      // Mảng rỗng nghĩa là người dùng bấm huỷ — không phải lỗi, không báo gì.
      if (files.length === 0) return;
      uploadMutation.mutate(files);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không chọn được tệp.');
    }
  }, [uploadMutation]);

  const dangChay: ThaoTacTask = uploadMutation.isPending
    ? 'nop'
    : sendReviewMutation.isPending
      ? 'guiDuyet'
      : approveMutation.isPending
        ? 'duyet'
        : null;

  /*
    Chờ khi CHƯA CÓ dữ liệu, không chỉ khi `isLoading`.

    Truy vấn bị vô hiệu bởi `enabled: Boolean(taskId)` lúc tham số route chưa về —
    react-query khi đó báo `isLoading = false`, nên nhánh vòng xoay bị bỏ qua và
    màn hình rơi xuống nhánh chính với `task` rỗng, vẽ ra trang trắng. Người dùng
    chạm thông báo là thấy trắng, thoát ra vào lại mới có.

    Người kiểm thử báo đúng hiện tượng này ngày 13/08/2026.
  */
  if (!task && !taskQuery.isError) {
    return (
      <View style={styles.screen}>
        <GradientHeader title="Chi tiết công việc" onBack={goBack} dense />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <GradientHeader title="Chi tiết công việc" subtitle={task?.project?.name} onBack={goBack} dense />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {taskQuery.isError ? (
          <ErrorBanner
            message={
              taskQuery.error instanceof Error
                ? taskQuery.error.message
                : 'Không tải được công việc.'
            }
          />
        ) : null}
        {actionError ? <ErrorBanner message={actionError} /> : null}

        {task ? (
          <>
            <Card style={styles.headCard}>
              <Text style={styles.title}>{task.title}</Text>
              {task.description ? (
                <Text style={styles.description}>{task.description}</Text>
              ) : null}
            </Card>

            <Card style={styles.infoCard}>
              <Row
                icon="ellipse-outline"
                tone={task.status === 'DONE' ? 'done' : 'info'}
                label="Trạng thái"
                value={STATUS_LABEL[task.status]}
              />
              <Row
                icon="hand-left-outline"
                tone={task.assignmentStatus === 'REJECTED' ? 'rejected' : 'info'}
                label="Phân công"
                value={
                  task.assignmentStatus ? (ASSIGNMENT_LABEL[task.assignmentStatus] ?? '—') : '—'
                }
              />
              <Row
                icon="time-outline"
                tone="deadline"
                label="Hạn chót"
                value={formatDateTime(task.dueDate)}
              />
              <Row
                icon="person-outline"
                tone="info"
                label="Người phụ trách"
                value={task.assignee?.fullName ?? 'Chưa giao'}
              />
              <Row
                icon="folder-outline"
                tone="info"
                label="Dự án"
                value={task.project?.name ?? '—'}
                last
              />
            </Card>

            {task.rejectionReason ? (
              <View style={styles.rejectBox}>
                <Text style={styles.rejectTitle}>Lý do từ chối</Text>
                <Text style={styles.rejectText}>{task.rejectionReason}</Text>
              </View>
            ) : null}

            {task.assignmentStatus === 'PENDING' ? (
              <View style={styles.actions}>
                <View style={styles.actionItem}>
                  <Button
                    testID="detail-accept"
                    label="Nhận việc"
                    onPress={() => acceptMutation.mutate()}
                    loading={acceptMutation.isPending}
                  />
                </View>
                <View style={styles.actionSpacer} />
                <View style={styles.actionItem}>
                  <Button
                    testID="detail-reject"
                    label="Từ chối"
                    variant="danger"
                    onPress={() => {
                      setActionError('');
                      setRejecting(true);
                    }}
                  />
                </View>
              </View>
            ) : null}

            <TaskSubmissionPanel
              quyen={quyen}
              submissions={task.submissions}
              reviewRejectedReason={task.reviewRejectedReason}
              dangChay={dangChay}
              onPick={() => void chonVaNop()}
              onSubmitForReview={() => sendReviewMutation.mutate()}
              onApprove={() => approveMutation.mutate()}
              onReject={() => {
                setActionError('');
                setRejectingReview(true);
              }}
            />
          </>
        ) : null}
      </ScrollView>

      <RejectTaskSheet
        visible={rejecting}
        submitting={rejectMutation.isPending}
        error={actionError || undefined}
        onConfirm={(reason) => rejectMutation.mutate(reason)}
        onDismiss={() => setRejecting(false)}
      />

      <RejectTaskSheet
        visible={rejectingReview}
        submitting={rejectReviewMutation.isPending}
        error={actionError || undefined}
        heading="Trả bài lại"
        body="Người phụ trách sẽ đọc lý do này và làm lại, nên nói rõ phần nào cần sửa."
        confirmLabel="Gửi yêu cầu sửa"
        quickReasons={LY_DO_TRA_BAI}
        onConfirm={(reason) => rejectReviewMutation.mutate(reason)}
        onDismiss={() => setRejectingReview(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  headCard: { marginBottom: spacing.md },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, lineHeight: lineHeight.lg },
  description: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: lineHeight.sm,
  },
  infoCard: { paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 4 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginLeft: spacing.sm + 4,
    flex: 1,
  },
  rowValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  rejectBox: {
    marginTop: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  rejectTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.danger },
  rejectText: { fontSize: fontSize.sm, color: colors.text, marginTop: spacing.xs, lineHeight: lineHeight.sm },
  actions: { flexDirection: 'row', marginTop: spacing.lg },
  actionItem: { flex: 1 },
  actionSpacer: { width: spacing.md },
});
