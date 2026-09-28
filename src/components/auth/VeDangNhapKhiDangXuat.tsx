import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'expo-router';

import { useAuth } from '../../lib/auth/auth-context';

/** Các màn thuộc nhóm (auth): đang đứng ở đây thì không cần đưa đi đâu nữa. */
const MAN_DANG_NHAP = ['/login', '/register', '/forgot-password'];

/**
 * Vừa đăng xuất ở BẤT KỲ màn nào thì gỡ hết các màn đang chồng và về Đăng nhập.
 *
 * `<Redirect>` trong layout của nhóm (tabs) chỉ chạy khi nhóm đó đang hiện trên
 * màn hình. Các màn nằm ngoài (tabs) như Xoá tài khoản, Người đã chặn hay Thông
 * tin cá nhân được đẩy chồng lên trên, nên đăng xuất từ đó thì (tabs) ở bên dưới
 * không được focus, và người dùng kẹt lại trên một màn không còn phiên. Gặp thật
 * 28/09/2026 trên iPhone: xoá tài khoản xong vẫn đứng ở màn xoá, kèm dòng "Không
 * tải được thông tin tài khoản". Người duyệt của Apple thử đúng thao tác này.
 *
 * Chỉ bắt lúc CHUYỂN từ đã đăng nhập sang đã đăng xuất. Mở app khi chưa đăng
 * nhập (loading → signedOut) đã có `src/app/index.tsx` lo, can thiệp vào là hai
 * lệnh điều hướng giẫm lên nhau.
 */
export function VeDangNhapKhiDangXuat(): null {
  const { status } = useAuth();
  const router = useRouter();
  const duongDan = usePathname();
  const trangThaiTruoc = useRef(status);
  const duongDanHienTai = useRef(duongDan);
  duongDanHienTai.current = duongDan;

  useEffect(() => {
    const truoc = trangThaiTruoc.current;
    trangThaiTruoc.current = status;
    if (truoc !== 'signedIn' || status !== 'signedOut') return;
    if (MAN_DANG_NHAP.some((man) => duongDanHienTai.current.startsWith(man))) return;

    if (router.canDismiss()) router.dismissAll();
    router.replace('/login');
  }, [status, router]);

  return null;
}
