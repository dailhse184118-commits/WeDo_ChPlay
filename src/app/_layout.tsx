import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '../lib/auth/auth-context';
import { bridgeAppStateToQueryFocus } from '../lib/app-focus';
import { configureNotificationHandler } from '../lib/notifications/handler';
import { taoKenhThongBaoAndroid } from '../lib/notifications/push-token';
import { HAN_CACHE_BEN_BI_MS, cacheBenBi, queryClient } from '../lib/query';

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
      {/*
        Khôi phục cache từ đĩa trước khi dựng cây màn hình, để mở app lúc không
        có mạng vẫn thấy dữ liệu lần trước thay vì màn hình trắng.
      */}
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: cacheBenBi, maxAge: HAN_CACHE_BEN_BI_MS }}
      >
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
