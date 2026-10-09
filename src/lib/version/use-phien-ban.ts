import Constants from 'expo-constants';
import { useQuery } from '@tanstack/react-query';

import { getAppVersionInfo } from '../api/app-version';
import { coNutCapNhat } from './mo-cua-hang';
import { mucCapNhat, type MucCapNhat } from './so-sanh';

/** Phiên bản của chính bản build này. Rỗng nghĩa là không đọc được. */
const PHIEN_BAN_HIEN_TAI = Constants.expoConfig?.version ?? '';

/**
 * Hỏi máy chủ xem app có cũ không.
 *
 * Màn chặn nằm ở layout gốc còn dải băng nằm trong màn Trò chuyện, nhưng chỉ có
 * MỘT lượt gọi mạng: cả hai chỗ dùng chung khoá `['app-version']` và react-query
 * gộp lại.
 *
 * `staleTime` 30 phút vì phiên bản mới không xuất hiện theo từng phút. Hỏi lại
 * mỗi lần đổi màn thì vừa tốn pin vừa dội tải máy chủ không vì lý do gì.
 *
 * Lượt gọi hỏng thì `data` vắng, và `mucCapNhat` nhận `undefined` rồi trả
 * `'khong-can'` — đúng nguyên tắc hỏng thì im lặng.
 *
 * iPhone mà máy chủ không gửi trang App Store thì cũng `'khong-can'`: không có
 * chỗ để cập nhật thì không được chặn, cũng không được nhắc.
 */
export function usePhienBan(): {
  muc: MucCapNhat;
  latest: string;
  notes: string;
  storeUrl: string | null;
} {
  const { data } = useQuery({
    queryKey: ['app-version'],
    queryFn: getAppVersionInfo,
    staleTime: 30 * 60 * 1000,
    // Không thử lại nhiều lần: đây là thông tin phụ, không đáng làm chậm app.
    retry: 1,
  });

  const storeUrl = data?.storeUrl ?? null;

  return {
    muc: coNutCapNhat(storeUrl)
      ? mucCapNhat({
          hienTai: PHIEN_BAN_HIEN_TAI,
          latest: data?.latest ?? undefined,
          minimum: data?.minimum ?? undefined,
        })
      : 'khong-can',
    latest: data?.latest ?? '',
    notes: data?.notes ?? '',
    storeUrl,
  };
}
