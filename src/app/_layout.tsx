import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

/**
 * Lưới an toàn cho lỗi ném ra giữa lúc render.
 *
 * Expo Router tự dùng component tên `ErrorBoundary` xuất từ file layout.
 *
 * Cần thiết vì ngày 17/08/2026 màn Bảng đóng góp gọi `useWorkspace()` trong khi
 * nằm ngoài `WorkspaceProvider`. Hook ném lỗi, không có gì đỡ, và CẢ APP chết —
 * người dùng bị văng thẳng về màn hình chính, không một lời giải thích.
 *
 * Một màn hỏng thì chỉ màn đó được phép hỏng. Người dùng vẫn phải quay lại được
 * chỗ khác, và phải thấy chuyện gì đã xảy ra thay vì app biến mất.
 */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={styles.loi}>
      <Text style={styles.loiTieuDe}>Màn hình này gặp trục trặc</Text>
      <Text style={styles.loiThan}>
        Phần còn lại của WeDo vẫn dùng được. Thử mở lại, nếu vẫn lỗi thì báo giúp đội ngũ WeDo.
      </Text>
      {/* Giữ nguyên câu lỗi gốc: đó là thứ duy nhất lần ra nguyên nhân khi người
          kiểm thử chụp màn hình gửi về. */}
      <Text style={styles.loiChiTiet}>{error.message}</Text>
      <Pressable onPress={() => void retry()} style={styles.loiNut}>
        <Text style={styles.loiNutChu}>Thử lại</Text>
      </Pressable>
    </View>
  );
}

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

const styles = StyleSheet.create({
  loi: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  loiTieuDe: { fontSize: 18, fontWeight: '600', color: '#101828' },
  loiThan: { fontSize: 14, color: '#475467', textAlign: 'center', lineHeight: 21 },
  loiChiTiet: { fontSize: 12, color: '#98A2B3', textAlign: 'center' },
  loiNut: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#0055c7',
  },
  loiNutChu: { color: '#ffffff', fontWeight: '600' },
});
