import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { NotificationRow } from '../../../components/notifications/NotificationRow';
import { Card } from '../../../components/ui/Card';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../../lib/api/notifications';
import { listTasks } from '../../../lib/api/tasks';
import { useAuth } from '../../../lib/auth/auth-context';
import { syncScheduledReminders } from '../../../lib/notifications/local';
import {
  checkNotificationPermission,
  ensureNotificationPermission,
  type NotificationPermissionState,
} from '../../../lib/notifications/permission';
import { planReminders } from '../../../lib/notifications/scheduler';
import { useRefetchOnScreenFocus } from '../../../lib/use-refetch-on-focus';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, radius, spacing } from '../../../theme/tokens';

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { active } = useWorkspace();

  const [permission, setPermission] = useState<NotificationPermissionState | null>(null);
  const [dismissedPrompt, setDismissedPrompt] = useState(false);
  const scheduling = useRef(false);

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: listNotifications,
  });

  useRefetchOnScreenFocus(notificationsQuery.refetch);

  // Đọc trạng thái quyền khi mở tab. KHÔNG gọi thẳng hộp thoại hệ thống ở đây:
  // Android chỉ cho hỏi một lần, từ chối là mất luôn. Phải giải thích trước.
  useEffect(() => {
    void checkNotificationPermission().then(setPermission);
  }, []);

  /**
   * Tải công việc rồi đặt lịch nhắc cục bộ. Chỉ chạy khi đã có quyền, và chỉ một
   * lần cho mỗi lần vào màn hình — kéo làm mới sẽ đặt lại.
   */
  const scheduleReminders = useCallback(async () => {
    if (scheduling.current || !active?.id || !user?.id) return;
    scheduling.current = true;

    try {
      const tasks = await listTasks(active.id);
      const plans = planReminders(tasks, user.id, new Date());
      await syncScheduledReminders(plans);
    } catch {
      // Không đặt được lịch nhắc thì thôi; danh sách thông báo vẫn dùng được.
    } finally {
      scheduling.current = false;
    }
  }, [active?.id, user?.id]);

  useEffect(() => {
    if (permission === 'granted') void scheduleReminders();
  }, [permission, scheduleReminders]);

  const handleEnable = useCallback(async () => {
    const granted = await ensureNotificationPermission();
    setPermission(granted ? 'granted' : 'blocked');
  }, []);

  const refreshBadge = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    void queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
  }, [queryClient]);

  const handlePress = useCallback(
    async (id: string, taskId?: string | null) => {
      try {
        await markNotificationRead(id);
        refreshBadge();
      } catch {
        // Đánh dấu đã đọc hỏng thì vẫn cho điều hướng.
      }
      if (taskId) router.push(`/tasks/${taskId}`);
    },
    [refreshBadge, router],
  );

  const handleMarkAll = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      refreshBadge();
    } catch {
      // Im lặng; người dùng bấm lại được.
    }
  }, [refreshBadge]);

  const items = notificationsQuery.data ?? [];
  const unreadCount = items.filter((item) => !item.readAt).length;
  const showPrompt = permission === 'undetermined' && !dismissedPrompt;

  return (
    <View style={styles.screen}>
      <GradientHeader
        title="Thông báo"
        subtitle={unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã đọc hết'}
        right={
          unreadCount > 0 ? (
            <Pressable testID="mark-all-read" onPress={handleMarkAll} style={styles.markAll}>
              <Ionicons name="checkmark-done-outline" size={16} color="#ffffff" />
              <Text style={styles.markAllText}>Đọc hết</Text>
            </Pressable>
          ) : undefined
        }
      />

      <View style={styles.body}>
        {notificationsQuery.isError ? (
          <ErrorBanner
            message={
              notificationsQuery.error instanceof Error
                ? notificationsQuery.error.message
                : 'Không tải được thông báo.'
            }
          />
        ) : null}

        {notificationsQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <NotificationRow item={item} onPress={() => void handlePress(item.id, item.taskId)} />
            )}
            refreshControl={
              <RefreshControl
                refreshing={notificationsQuery.isRefetching}
                onRefresh={() => {
                  void notificationsQuery.refetch();
                  if (permission === 'granted') void scheduleReminders();
                }}
                colors={[colors.primary]}
              />
            }
            ListHeaderComponent={
              showPrompt ? (
                /*
                  Lời mời giải thích lý do TRƯỚC hộp thoại hệ thống. Android chỉ cho
                  hỏi một lần; hỏi trần trụi ngay khi mở tab thì người dùng chưa hiểu
                  để làm gì, từ chối là mất vĩnh viễn phần nhắc hạn.
                */
                <Card testID="permission-prompt" style={styles.prompt}>
                  <View style={styles.promptHead}>
                    <Ionicons name="alarm-outline" size={22} color={colors.primary} />
                    <Text style={styles.promptTitle}>Nhắc bạn trước khi việc đến hạn</Text>
                  </View>
                  <Text style={styles.promptBody}>
                    Cho phép WeDo gửi thông báo để nhắc trước hạn chót 24 giờ và đúng lúc đến hạn.
                    Bạn tắt lại bất cứ lúc nào trong phần Cài đặt thông báo.
                  </Text>
                  <View style={styles.promptActions}>
                    <Pressable
                      testID="permission-later"
                      onPress={() => setDismissedPrompt(true)}
                      style={styles.promptGhost}
                    >
                      <Text style={styles.promptGhostText}>Để sau</Text>
                    </Pressable>
                    <Pressable
                      testID="permission-enable"
                      onPress={() => void handleEnable()}
                      style={styles.promptPrimary}
                    >
                      <Text style={styles.promptPrimaryText}>Bật thông báo</Text>
                    </Pressable>
                  </View>
                </Card>
              ) : null
            }
            ListEmptyComponent={
              notificationsQuery.isError ? null : (
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="notifications-outline" size={28} color={colors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
                  <Text style={styles.emptyBody}>
                    Bạn sẽ nhận thông báo khi có người giao việc, khi việc được nhận hoặc bị từ
                    chối, và khi việc sắp đến hạn.
                  </Text>
                </View>
              )
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  markAllText: { color: '#ffffff', fontSize: fontSize.xs, fontWeight: '600', marginLeft: 4 },
  body: { flex: 1, marginTop: -spacing.md, paddingHorizontal: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingTop: spacing.md, paddingBottom: spacing.xl },

  prompt: { backgroundColor: colors.primarySoft, marginBottom: spacing.md },
  promptHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  promptTitle: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  promptBody: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 21 },
  promptActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  promptGhost: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  promptGhostText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },
  promptPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginLeft: spacing.sm,
  },
  promptPrimaryText: { fontSize: fontSize.sm, color: '#ffffff', fontWeight: '700' },

  empty: { paddingTop: spacing.xl, alignItems: 'center' },
  emptyIcon: {
    width: 64,
    height: 64,
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
    lineHeight: 21,
  },
});
