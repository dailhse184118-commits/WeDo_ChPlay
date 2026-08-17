import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { RejectTaskSheet } from '../../../components/tasks/RejectTaskSheet';
import { TaskRow } from '../../../components/tasks/TaskRow';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import { acceptTask, listTasks, rejectTask } from '../../../lib/api/tasks';
import { useAuth } from '../../../lib/auth/auth-context';
import { groupByDeadline, myTasks } from '../../../lib/tasks/deadline-groups';
import { useRefetchOnScreenFocus } from '../../../lib/use-refetch-on-focus';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, lineHeight, radius, scale, spacing } from '../../../theme/tokens';

function CountBox({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.countBox}>
      <Text style={styles.countValue}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

export default function MyTasksScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { active } = useWorkspace();
  const queryClient = useQueryClient();

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const tasksQuery = useQuery({
    queryKey: ['tasks', active?.id],
    queryFn: () => listTasks(active?.id),
    enabled: Boolean(active?.id),
  });

  // Đổi tab không gỡ màn hình, nên phải nạp lại thủ công khi màn được đưa lên trước.
  useRefetchOnScreenFocus(tasksQuery.refetch);

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['tasks', active?.id] });
  }, [queryClient, active?.id]);

  const acceptMutation = useMutation({
    mutationFn: (taskId: string) => acceptTask(taskId),
    onSuccess: () => {
      setActionError('');
      invalidate();
    },
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Không nhận được việc này.'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ taskId, reason }: { taskId: string; reason: string }) =>
      rejectTask(taskId, reason),
    onSuccess: () => {
      setActionError('');
      setRejectingId(null);
      invalidate();
    },
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Không từ chối được việc này.'),
  });

  // `now` chốt một lần cho toàn bộ lần render, để mọi việc được phân nhóm theo
  // cùng một mốc thời gian.
  const { sections, counts } = useMemo(() => {
    const now = new Date();
    const mine = myTasks(tasksQuery.data ?? [], user?.id ?? '');
    const groups = groupByDeadline(mine, now);

    return {
      sections: groups.map((group) => ({ title: group.label, data: group.tasks, now })),
      counts: {
        pending: mine.filter((task) => task.assignmentStatus === 'PENDING').length,
        overdue: groups.find((group) => group.bucket === 'overdue')?.tasks.length ?? 0,
        total: mine.length,
      },
    };
  }, [tasksQuery.data, user?.id]);

  return (
    <View style={styles.screen}>
      <GradientHeader
        title="Việc của tôi"
        subtitle={active?.name}
        right={
          <Pressable
            onPress={() => router.push('/tasks/new')}
            style={styles.nutTao}
            accessibilityRole="button"
            accessibilityLabel="Tạo công việc mới"
            testID="nut-mo-tao-task"
          >
            <Ionicons name="add" size={scale(22)} color={colors.surface} />
          </Pressable>
        }
      >
        <View style={styles.counts}>
          <CountBox value={counts.total} label="Đang mở" />
          <CountBox value={counts.pending} label="Chờ nhận" />
          <CountBox value={counts.overdue} label="Quá hạn" />
        </View>
      </GradientHeader>

      <View style={styles.body}>
        {/*
          Chỉ báo lỗi to khi KHÔNG có gì để xem. Còn dữ liệu cũ trong cache thì
          lần gọi hỏng không chặn đường, dội băng đỏ lên là làm người dùng tưởng
          app hỏng trong khi danh sách vẫn đọc được.
        */}
        {tasksQuery.isError && !tasksQuery.data ? (
          <ErrorBanner
            message={
              tasksQuery.error instanceof Error
                ? tasksQuery.error.message
                : 'Không tải được danh sách công việc.'
            }
          />
        ) : null}

        {tasksQuery.isError && tasksQuery.data ? (
          <Text style={styles.ngoaiTuyen}>
            Đang xem dữ liệu đã lưu. Kết nối lại để cập nhật.
          </Text>
        ) : null}
        {actionError ? <ErrorBanner message={actionError} /> : null}

        {tasksQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(task) => task.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionHeader}>{section.title}</Text>
            )}
            renderItem={({ item, section }) => (
              <TaskRow
                task={item}
                now={section.now}
                accepting={acceptMutation.isPending || rejectMutation.isPending}
                onPress={() => router.push(`/tasks/${item.id}`)}
                onAccept={() => acceptMutation.mutate(item.id)}
                onReject={() => {
                  setActionError('');
                  setRejectingId(item.id);
                }}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={tasksQuery.isRefetching}
                onRefresh={() => tasksQuery.refetch()}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              tasksQuery.isError ? null : (
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="checkbox-outline" size={28} color={colors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>Chưa có việc nào cho bạn</Text>
                  {/*
                    Nêu cả hai đường tạo việc. Nút dấu cộng thì nhìn thấy được,
                    còn cử chỉ nhấn giữ trong chat là tính năng cốt lõi nhưng
                    không có chỗ nào lộ ra — người dùng mới sẽ không tự tìm thấy
                    nếu trạng thái rỗng không nói.
                  */}
                  <Text style={styles.emptyBody}>
                    Bấm dấu cộng ở trên để thêm việc mới. Hoặc khi nhóm chốt việc trong chat, nhấn
                    giữ tin nhắn đó để WeDo tạo công việc. Việc giao cho bạn sẽ xuất hiện ở đây.
                  </Text>
                </View>
              )
            }
          />
        )}
      </View>

      <RejectTaskSheet
        visible={rejectingId !== null}
        submitting={rejectMutation.isPending}
        error={actionError || undefined}
        onConfirm={(reason) => {
          if (rejectingId) rejectMutation.mutate({ taskId: rejectingId, reason });
        }}
        onDismiss={() => setRejectingId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  // Nền mờ trên dải gradient của header, cùng lối với các nút khác đặt ở đó.
  nutTao: {
    width: scale(36),
    height: scale(36),
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  ngoaiTuyen: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    paddingTop: spacing.sm,
  },
  counts: { flexDirection: 'row' },
  countBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  countValue: { color: colors.onPrimary, fontSize: fontSize.lg, fontWeight: '700' },
  countLabel: { color: colors.onPrimary, fontSize: fontSize.xxs, marginTop: spacing.xxs },
  body: { flex: 1, marginTop: -spacing.md, paddingHorizontal: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingTop: spacing.md, paddingBottom: spacing.xl },
  sectionHeader: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  empty: { paddingTop: spacing.xl, alignItems: 'center' },
  emptyIcon: {
    width: scale(64),
    height: scale(64),
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: lineHeight.sm,
  },
});
