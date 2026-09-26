import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

import { datDongYAI } from '../api/account';
import { useAuth } from '../auth/auth-context';

/*
  Chữ của hộp thoại xin đồng ý dùng AI.

  Guideline 5.1.2(i) của Apple nêu đích danh AI bên thứ ba: phải nói rõ gửi GÌ,
  cho AI, và xin phép TRƯỚC lần gửi đầu tiên. Máy chủ đã thôi gửi email của thành
  viên cho AI, nên câu dưới được phép nói "không gửi email hay số điện thoại".
  Đổi dữ liệu gửi đi ở máy chủ thì phải sửa câu này theo.
*/
export const TIEU_DE_DONG_Y_AI = 'Dùng AI để gợi ý công việc?';

export const NOI_DUNG_DONG_Y_AI =
  'Để gợi ý công việc, WeDo sẽ gửi tin nhắn bạn chọn cùng khoảng 12 tin nhắn gần nhất và tên các thành viên trong dự án cho một nhà cung cấp AI bên thứ ba (Google Gemini, Azure OpenAI hoặc OpenAI). WeDo không gửi email hay số điện thoại của ai. Bạn có thể tắt tính năng này bất cứ lúc nào trong Tài khoản.';

/**
 * Chốt chặn trước mọi thao tác gửi dữ liệu cho AI.
 *
 * Đã đồng ý (máy chủ có `aiConsentAt`) thì chạy luôn. Chưa thì hỏi; đồng ý thì
 * lưu lên máy chủ, ghi vào hồ sơ đang giữ rồi mới chạy — nên lần sau không hỏi
 * lại, kể cả trên máy khác. Từ chối hay lưu hỏng thì KHÔNG gửi gì cho AI.
 *
 * Máy chủ chưa bắt buộc dấu này (bản web còn luồng tự động), nên app phải tự
 * chặn: mọi đường vào AI trên mobile phải đi qua `xinDongYRoiChay`.
 */
export function useDongYAI() {
  const { user, capNhatHoSo } = useAuth();

  /*
    Hồ sơ mới nhất, đọc lúc người dùng bấm "Đồng ý" chứ không phải lúc hộp thoại
    mở — trong lúc chờ, hồ sơ có thể đã đổi (ảnh đại diện chẳng hạn), ghép vào
    bản cũ là mất thay đổi đó.
  */
  const hoSoRef = useRef(user);
  useEffect(() => {
    hoSoRef.current = user;
  }, [user]);

  const daDongY = Boolean(user?.aiConsentAt);

  const xinDongYRoiChay = useCallback(
    (hanhDong: () => void) => {
      if (daDongY) {
        hanhDong();
        return;
      }

      const dongY = async () => {
        try {
          const { aiConsentAt } = await datDongYAI(true);
          const hoSo = hoSoRef.current;
          if (hoSo) capNhatHoSo({ ...hoSo, aiConsentAt });
        } catch (loi) {
          Alert.alert(
            'Chưa lưu được lựa chọn',
            loi instanceof Error ? loi.message : 'Có lỗi xảy ra. Vui lòng thử lại.',
          );
          return;
        }
        hanhDong();
      };

      Alert.alert(TIEU_DE_DONG_Y_AI, NOI_DUNG_DONG_Y_AI, [
        { text: 'Không, cảm ơn', style: 'cancel' },
        { text: 'Đồng ý', onPress: () => void dongY() },
      ]);
    },
    [daDongY, capNhatHoSo],
  );

  return { daDongY, xinDongYRoiChay };
}
