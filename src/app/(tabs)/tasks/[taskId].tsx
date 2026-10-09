import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dinhDangNgayGio } from '../../../i18n/dinh-dang';
import { theoNgonNgu } from '../../../i18n/dich';
import { useDichLoi, useNgonNgu, useTuDien } from '../../../i18n/NgonNguProvider';
import type { NgonNgu } from '../../../i18n/ngon-ngu';
import { tuDienCongViec } from '../../../i18n/tu-dien/cong-viec';
import { chuLoi, type NguonLoi } from '../../../lib/auth/nguon-loi';
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
import { LoiGuiDoDang } from '../../../lib/api/chat-files';
import { baseUrl } from '../../../lib/api/client';
import { listProjects } from '../../../lib/api/projects';
import {
  acceptTask,
  approveReview,
  getTask,
  rejectReview,
  rejectTask,
  submitForReview,
  updateTaskStatus,
  uploadSubmissions,
  type TepChon,
} from '../../../lib/api/tasks';
import { useAuth } from '../../../lib/auth/auth-context';
import { duongDanTepDinhKem } from '../../../lib/chat/tep-dinh-kem';
import { chonTaiLieu } from '../../../lib/files/pick-documents';
import { quyenTrenTask } from '../../../lib/tasks/task-permissions';
import type { Task, TaskSubmission } from '../../../lib/types';
import { useQuayLai } from '../../../lib/use-quay-lai';
import { useRefetchOnScreenFocus } from '../../../lib/use-refetch-on-focus';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, lineHeight, radius, spacing } from '../../../theme/tokens';

/** Lỗi của các thao tác trên màn này; tệp không mở được cần kèm tên tệp nên đứng riêng. */
type KhoaLoiChiTiet =
  | 'khongNhan'
  | 'khongTuChoi'
  | 'khongBatDau'
  | 'khongNop'
  | 'khongGuiDuyet'
  | 'khongDuyet'
  | 'khongTraBai'
  | 'khongChonTep';
type LoiHanhDong = NguonLoi<KhoaLoiChiTiet> | { tepKhongMo: string };

/**
 * Dòng "Phân công" theo đúng người đang xem.
 *
 * "Chờ bạn phản hồi" chỉ đúng với người được giao. Leader mở việc vừa giao cho
 * người khác mà đọc thấy "Chờ bạn" là tưởng đến lượt mình phải bấm gì đó.
 */
function nhanPhanCong(task: Task, meId: string | undefined, ngonNgu: NgonNgu): string {
  const t = theoNgonNgu(tuDienCongViec, ngonNgu).chiTiet;
  if (!task.assignmentStatus) return '—';
  if (task.assignmentStatus === 'PENDING' && task.assigneeId !== meId) {
    return t.choPhanHoi(task.assignee?.fullName ?? t.nguoiDuocGiao);
  }
  return t.phanCongTrangThai[task.assignmentStatus] ?? '—';
}

function formatDateTime(iso: string | null | undefined, ngonNgu: NgonNgu): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  // Tiếng Anh theo giờ Việt Nam như mọi ngày giờ khác; tiếng Việt giữ cách tính cũ.
  if (ngonNgu === 'en') return dinhDangNgayGio(date, 'en');
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return theoNgonNgu(tuDienCongViec, ngonNgu).chiTiet.ngayGio(
    `${dd}/${mm}/${date.getFullYear()}`,
    `${hh}:${mi}`,
  );
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
  const t = useTuDien(tuDienCongViec);
  const dichLoi = useDichLoi();
  const { ngonNgu } = useNgonNgu();
  const { taskId, tu, chatId } = useLocalSearchParams<{
    taskId: string;
    tu?: string;
    chatId?: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  /*
    Màn này là một route của bộ điều hướng TAB, không phải một màn chồng lên
    ngăn xếp. `router.back()` ở đây nhảy về tab ĐẦU TIÊN — Trò chuyện — nên người
    xem xong một công việc bấm Quay lại là văng sang màn chat. Quay về đúng chỗ
    đã mở màn này, bằng cả mũi tên lẫn phím Back: xem `useQuayLai`.

    Ba nơi mở màn này: danh sách Công việc (mặc định), tab Thông báo
    (`tu=thong-bao`), và khung chat dự án sau khi trợ lý tạo việc
    (`tu=chat`, `chatId`).
  */
  const goBack = useQuayLai(
    useCallback(() => {
      if (tu === 'thong-bao') router.navigate('/notifications');
      else if (tu === 'chat' && chatId) {
        router.navigate({ pathname: '/chat/[projectId]', params: { projectId: chatId } });
      } else router.navigate('/tasks');
    }, [router, tu, chatId]),
  );

  const [rejecting, setRejecting] = useState(false);
  const [rejectingReview, setRejectingReview] = useState(false);
  // Giữ NGUỒN lỗi, dịch lúc vẽ: đổi ngôn ngữ thì băng đỏ đổi theo.
  const [actionError, setActionError] = useState<LoiHanhDong | null>(null);
  const actionErrorText = !actionError
    ? ''
    : 'tepKhongMo' in actionError
      ? t.khongMoDuocTep(actionError.tepKhongMo)
      : chuLoi(t.loi, actionError, dichLoi);

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
      return { nopTaiLieu: false, guiDuyet: false, duyetBai: false, batDauLam: false };
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
      setActionError(null);
      invalidate();
    },
    onError: (err) => setActionError({ loi: err, duPhong: 'khongNhan' }),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectTask(taskId as string, reason),
    onSuccess: () => {
      setActionError(null);
      setRejecting(false);
      invalidate();
    },
    onError: (err) => setActionError({ loi: err, duPhong: 'khongTuChoi' }),
  });

  const startMutation = useMutation({
    mutationFn: () => updateTaskStatus(taskId as string, 'IN_PROGRESS'),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (err) => setActionError({ loi: err, duPhong: 'khongBatDau' }),
  });

  const uploadMutation = useMutation({
    mutationFn: (files: TepChon[]) => uploadSubmissions(taskId as string, files),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (err) => {
      /*
        Hỏng giữa lô: những tệp đầu ĐÃ là bài nộp thật. Đọc lại công việc để
        chúng hiện ra — không thì người làm tưởng chưa nộp gì và nộp lại thành
        hai bản.
      */
      if (err instanceof LoiGuiDoDang) invalidate();
      setActionError({ loi: err, duPhong: 'khongNop' });
    },
  });

  const sendReviewMutation = useMutation({
    mutationFn: () => submitForReview(taskId as string),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (err) => setActionError({ loi: err, duPhong: 'khongGuiDuyet' }),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveReview(taskId as string),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (err) => setActionError({ loi: err, duPhong: 'khongDuyet' }),
  });

  const rejectReviewMutation = useMutation({
    mutationFn: (reason: string) => rejectReview(taskId as string, reason),
    onSuccess: () => {
      setActionError(null);
      setRejectingReview(false);
      invalidate();
    },
    onError: (err) => setActionError({ loi: err, duPhong: 'khongTraBai' }),
  });

  /*
    Mở hộp chọn tệp TRƯỚC rồi mới gọi mutation. Gộp cả hai vào `mutationFn` thì
    vòng quay trên nút chạy suốt lúc người dùng còn đang lục tìm tệp trong máy.
  */
  const chonVaNop = useCallback(async () => {
    setActionError(null);
    try {
      const files = await chonTaiLieu();
      // Mảng rỗng nghĩa là người dùng bấm huỷ — không phải lỗi, không báo gì.
      if (files.length === 0) return;
      uploadMutation.mutate(files);
    } catch (err) {
      setActionError({ loi: err, duPhong: 'khongChonTep' });
    }
  }, [uploadMutation]);

  /*
    Tệp nộp bài nằm ở `/uploads/task-submissions/<tên>` trên máy chủ WeDo, công
    khai như đường tĩnh cũ (tên tệp là chuỗi ngẫu nhiên). Mở bằng trình duyệt
    trong app: PDF, ảnh, tài liệu Office đều xem được mà không phải tải về.
  */
  const moTep = useCallback(async (tep: TaskSubmission) => {
    setActionError(null);
    try {
      await WebBrowser.openBrowserAsync(duongDanTepDinhKem(tep, baseUrl()));
    } catch {
      setActionError({ tepKhongMo: tep.originalName });
    }
  }, []);

  /*
    Duyệt là chuyển việc sang Xong, ghi ngày hoàn thành và báo cả dự án — trên
    điện thoại không có nút hoàn tác. Hỏi lại một lần để cú chạm nhầm không
    làm được việc đó.
  */
  const hoiTruocKhiDuyet = useCallback(() => {
    Alert.alert(t.chiTiet.hoiDuyetTieuDe, t.chiTiet.hoiDuyetNoiDung, [
      { text: t.chiTiet.huy, style: 'cancel' },
      { text: t.chiTiet.duyet, onPress: () => approveMutation.mutate() },
    ]);
  }, [approveMutation, t]);

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
        <GradientHeader title={t.chiTiet.tieuDe} onBack={goBack} dense />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <GradientHeader title={t.chiTiet.tieuDe} subtitle={task?.project?.name} onBack={goBack} dense />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {taskQuery.isError ? (
          <ErrorBanner
            message={dichLoi(taskQuery.error, t.loi.khongTaiCongViec)}
          />
        ) : null}
        {actionErrorText ? <ErrorBanner message={actionErrorText} /> : null}

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
                label={t.chiTiet.trangThai}
                value={t.trangThai[task.status]}
              />
              <Row
                icon="hand-left-outline"
                tone={task.assignmentStatus === 'REJECTED' ? 'rejected' : 'info'}
                label={t.chiTiet.phanCong}
                value={nhanPhanCong(task, user?.id, ngonNgu)}
              />
              <Row
                icon="time-outline"
                tone="deadline"
                label={t.chiTiet.hanChot}
                value={formatDateTime(task.dueDate, ngonNgu)}
              />
              <Row
                icon="person-outline"
                tone="info"
                label={t.chiTiet.nguoiPhuTrach}
                value={task.assignee?.fullName ?? t.chiTiet.chuaGiao}
              />
              <Row
                icon="folder-outline"
                tone="info"
                label={t.chiTiet.duAn}
                value={task.project?.name ?? '—'}
                last
              />
            </Card>

            {task.rejectionReason ? (
              <View style={styles.rejectBox}>
                <Text style={styles.rejectTitle}>{t.chiTiet.lyDoTuChoi}</Text>
                <Text style={styles.rejectText}>{task.rejectionReason}</Text>
              </View>
            ) : null}

            {/*
              Chỉ người được giao mới nhận hay từ chối được — máy chủ trả 403 cho
              mọi người khác. Leader tạo việc bằng AI rồi bấm "Xem công việc" là
              rơi đúng vào đây: trước đây thấy hai nút của người kia, bấm là lỗi.
            */}
            {task.assignmentStatus === 'PENDING' && task.assigneeId === user?.id ? (
              <View style={styles.actions}>
                <View style={styles.actionItem}>
                  <Button
                    testID="detail-accept"
                    label={t.chiTiet.nhanViec}
                    onPress={() => acceptMutation.mutate()}
                    loading={acceptMutation.isPending}
                  />
                </View>
                <View style={styles.actionSpacer} />
                <View style={styles.actionItem}>
                  <Button
                    testID="detail-reject"
                    label={t.chiTiet.tuChoi}
                    variant="danger"
                    onPress={() => {
                      setActionError(null);
                      setRejecting(true);
                    }}
                  />
                </View>
              </View>
            ) : task.assignmentStatus === 'PENDING' ? (
              <Text testID="detail-cho-phan-hoi" style={styles.choPhanHoi}>
                {t.chiTiet.dangChoPhanHoi(task.assignee?.fullName ?? t.chiTiet.nguoiDuocGiao)}
              </Text>
            ) : null}

            {quyen.batDauLam ? (
              <View style={styles.actions}>
                <View style={styles.actionItem}>
                  <Button
                    testID="detail-start"
                    label={t.chiTiet.batDauLam}
                    onPress={() => {
                      setActionError(null);
                      startMutation.mutate();
                    }}
                    loading={startMutation.isPending}
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
              onApprove={hoiTruocKhiDuyet}
              onMoTep={(tep) => void moTep(tep)}
              onReject={() => {
                setActionError(null);
                setRejectingReview(true);
              }}
            />
          </>
        ) : null}
      </ScrollView>

      <RejectTaskSheet
        visible={rejecting}
        submitting={rejectMutation.isPending}
        error={actionErrorText || undefined}
        onConfirm={(reason) => rejectMutation.mutate(reason)}
        onDismiss={() => setRejecting(false)}
      />

      <RejectTaskSheet
        visible={rejectingReview}
        submitting={rejectReviewMutation.isPending}
        error={actionErrorText || undefined}
        heading={t.chiTiet.traBai.tieuDe}
        body={t.chiTiet.traBai.noiDung}
        confirmLabel={t.chiTiet.traBai.nutGui}
        quickReasons={t.chiTiet.traBai.lyDoNhanh}
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
  choPhanHoi: {
    marginTop: spacing.lg,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: lineHeight.sm,
  },
  actionItem: { flex: 1 },
  actionSpacer: { width: spacing.md },
});
