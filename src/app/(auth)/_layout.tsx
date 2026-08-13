import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../lib/auth/auth-context';

export default function AuthLayout() {
  const { status } = useAuth();

  /*
    Đăng nhập xong phải tự rời khỏi nhóm màn đăng nhập.

    `app/index.tsx` cũng điều hướng theo trạng thái, nhưng nó chỉ chạy khi người
    dùng đang đứng ở route gốc. Mở app lần đầu là `/` chuyển ngay sang `/login`
    rồi màn index bị gỡ — nên khi đăng nhập thành công không còn ai lắng nghe để
    chuyển tiếp. Người dùng đứng yên trên màn đăng nhập, tưởng app đơ, phải tắt
    mở lại mới vào được (lúc đó phiên được khôi phục từ token đã lưu).

    Người kiểm thử báo đúng lỗi này ngày 11/08/2026.
  */
  if (status === 'signedIn') {
    return <Redirect href="/chat" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
