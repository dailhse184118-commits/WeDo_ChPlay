import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CongDieuKhoan } from '../components/auth/CongDieuKhoan';
import { UpdateGate } from '../components/update/UpdateGate';
import { baoLoi, khoiDongSentry } from '../lib/observability/sentry';
import { AuthProvider } from '../lib/auth/auth-context';
import { bridgeAppStateToQueryFocus } from '../lib/app-focus';
import { configureNotificationHandler } from '../lib/notifications/handler';
import { taoKenhThongBaoAndroid } from '../lib/notifications/push-token';
import { HAN_CACHE_BEN_BI_MS, cacheBenBi, queryClient } from '../lib/query';
import { usePhienBan } from '../lib/version/use-phien-ban';

/*
  Đặt trên hết: chỉ những lỗi xảy ra SAU lời gọi này mới được ghi nhận, nên nó
  phải chạy trước mọi thứ còn lại trong tệp.

  Chưa khai `EXPO_PUBLIC_SENTRY_DSN` thì không làm gì cả.
*/
khoiDongSentry();

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
  /*
    Sentry KHÔNG tự thấy lỗi đã có người bắt. Không có dòng này thì màn hình
    dưới đây che lỗi đi một cách lịch sự, và đội ngũ không bao giờ biết.

    Đặt trong effect chứ không giữa lúc render: render phải thuần, và React có
    thể gọi lại nó nhiều lần cho cùng một lỗi.
  */
  useEffect(() => {
    baoLoi(error, 'error-boundary');
  }, [error]);

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

/**
 * Chặn cả app khi phiên bản quá cũ so với máy chủ.
 *
 * Phải nằm TRONG `PersistQueryClientProvider` vì nó dùng react-query, và phải
 * nằm TRÊN `<Stack>` để chặn được cả màn đăng nhập — app cũ thì chính lượt đăng
 * nhập cũng có thể hỏng.
 */
function CongPhienBan({ children }: { children: React.ReactNode }) {
  const { muc, notes } = usePhienBan();

  if (muc === 'bat-buoc') {
    return <UpdateGate notes={notes} />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => bridgeAppStateToQueryFocus(), []);

  return (
    <SafeAreaProvider>
      {/*
        Bọc cả app để bàn phím được đọc từ `WindowInsetsAnimation` của Android —
        nguồn sự thật của hệ điều hành — thay vì sự kiện `keyboardDidShow` mà
        bàn phím của mỗi hãng báo mỗi kiểu khi chạy edge-to-edge. Đó là nguyên
        nhân ô soạn tin bị che trên một số máy, người kiểm thử báo 18/09/2026.
      */}
      <KeyboardProvider>
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
            <CongPhienBan>
              {/*
                Người đã đăng nhập mà chưa đồng ý Điều khoản sử dụng thì không
                vào được màn nào — kể cả màn mở từ thông báo. Nằm DƯỚI cổng phiên
                bản: app quá cũ thì cập nhật trước đã.
              */}
              <CongDieuKhoan>
                <Stack screenOptions={{ headerShown: false }} />
              </CongDieuKhoan>
            </CongPhienBan>
          </AuthProvider>
        </PersistQueryClientProvider>
      </KeyboardProvider>
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
