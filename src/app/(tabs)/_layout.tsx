import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../lib/auth/auth-context';
import { SocketProvider } from '../../lib/socket/socket-context';
import { WorkspaceProvider, useWorkspace } from '../../lib/workspace/workspace-context';
import { CreateWorkspaceForm } from '../../components/workspace/CreateWorkspaceForm';
import { colors } from '../../theme/tokens';

function TabsWithWorkspace() {
  const { status } = useWorkspace();

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
      }}
    >
      <Tabs.Screen
        name="chat/index"
        options={{
          title: 'Trò chuyện',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks/index"
        options={{
          title: 'Việc của tôi',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="account/index"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
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
    backgroundColor: colors.background,
  },
});
