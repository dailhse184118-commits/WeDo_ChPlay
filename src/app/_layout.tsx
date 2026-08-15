import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '../lib/auth/auth-context';
import { bridgeAppStateToQueryFocus } from '../lib/app-focus';
import { configureNotificationHandler } from '../lib/notifications/handler';
import { taoKenhThongBaoAndroid } from '../lib/notifications/push-token';
import { queryClient } from '../lib/query';

// Phải chạy trước khi có thông báo nào tới, nên đặt ở tầng module chứ không trong
// một effect nào đó.
configureNotificationHandler();

/*
  Kênh phải tồn tại trước khi thông báo đẩy đầu tiên tới, nên cũng đặt ở tầng
  module. Máy chủ gửi kèm `channelId: 'default'`; tới một kênh chưa tạo thì
  Android vẫn hiện thông báo nhưng không kêu, không rung.
*/
void taoKenhThongBaoAndroid();

export default function RootLayout() {
  useEffect(() => bridgeAppStateToQueryFocus(), []);

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
