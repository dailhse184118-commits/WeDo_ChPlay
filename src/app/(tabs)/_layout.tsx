import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';

import { CreateWorkspaceForm } from '../../components/workspace/CreateWorkspaceForm';
import { getUnreadCount } from '../../lib/api/notifications';
import { useAuth } from '../../lib/auth/auth-context';
import { taskIdFromResponse } from '../../lib/notifications/handler';
import { SocketProvider } from '../../lib/socket/socket-context';
import { WorkspaceProvider, useWorkspace } from '../../lib/workspace/workspace-context';
import { colors, sizes } from '../../theme/tokens';

/** Chiều cao phần bấm được của thanh tab, chưa tính vùng cử chỉ hệ thống. */
const TAB_BAR_HEIGHT = 60;

/**
 * Chạm vào nhắc hạn thì mở thẳng công việc đó.
 *
 * Đặt ở đây chứ không ở layout gốc vì layout này chỉ dựng khi đã đăng nhập — điều
 * hướng tới `/tasks/:id` lúc còn ở màn đăng nhập sẽ đưa người dùng vào màn hình họ
 * không có quyền xem.
 *
 * Xử lý cả hai đường: app đang chạy sẵn, và app bị đánh thức từ trạng thái tắt hẳn.
 */
function useOpenTaskFromNotification() {
  const router = useRouter();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    function open(response: Notifications.NotificationResponse | null) {
      const key = response?.notification?.request?.identifier ?? null;
      if (!key || handled.current === key) return;

      const taskId = taskIdFromResponse(response);
      if (!taskId) return;

      handled.current = key;
      router.push(`/tasks/${taskId}`);
    }

    try {
      void Notifications.getLastNotificationResponseAsync().then(open);
      const subscription = Notifications.addNotificationResponseReceivedListener(open);
      return () => subscription.remove();
    } catch {
      // Thiếu module native: bỏ qua, phần còn lại của app vẫn chạy.
      return undefined;
    }
  }, [router]);
}

function TabsWithWorkspace() {
  const { status } = useWorkspace();
  const insets = useSafeAreaInsets();

  useOpenTaskFromNotification();

  // Badge số thông báo chưa đọc. Poll mỗi phút; rẻ vì endpoint chỉ trả một con số.
  const unreadQuery = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
    staleTime: 30_000,
    enabled: status === 'ready',
  });

  const unread = unreadQuery.data?.count ?? 0;

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Tài khoản mới chưa có workspace phải tự tạo một cái trước khi dùng app.
  if (status === 'empty') {
    return <CreateWorkspaceForm />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          // Bốn ô đều nhau, cao 60 cộng vùng cử chỉ hệ thống. Android 16 ép
          // edge-to-edge nên phải tự cộng inset, không thì nhãn nằm dưới thanh vuốt.
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarItemStyle: { flex: 1 },
      }}
    >
      <Tabs.Screen
        name="chat/index"
        options={{
          title: 'Trò chuyện',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              color={color}
              size={sizes.icon}
            />
          ),
        }}
      />

      {/*
        Mọi file dưới (tabs)/ đều tự thành một tab. Route động này chỉ được mở
        từ danh sách dự án, nên phải ẩn khỏi thanh tab bằng href: null.
      */}
      <Tabs.Screen name="chat/[projectId]" options={{ href: null }} />

      <Tabs.Screen
        name="tasks/index"
        options={{
          title: 'Việc của tôi',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'checkbox' : 'checkbox-outline'}
              color={color}
              size={sizes.icon}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{
          title: 'Thông báo',
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.danger,
            fontSize: 10,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              color={color}
              size={sizes.icon}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account/index"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              color={color}
              size={sizes.icon}
            />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabsLayout() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (status === 'signedOut') {
    return <Redirect href="/login" />;
  }

  return (
    <SocketProvider>
      <WorkspaceProvider>
        <TabsWithWorkspace />
      </WorkspaceProvider>
    </SocketProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.page,
  },
});
