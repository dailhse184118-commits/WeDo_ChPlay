import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '../lib/auth/auth-context';
import { configureNotificationHandler } from '../lib/notifications/handler';
import { queryClient } from '../lib/query';

// Phải chạy trước khi có thông báo nào tới, nên đặt ở tầng module chứ không trong
// một effect nào đó.
configureNotificationHandler();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
