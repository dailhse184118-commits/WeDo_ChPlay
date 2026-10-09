import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

import { useDichLoi, useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienChat } from '../../i18n/tu-dien/chat';
import { datDongYAI } from '../api/account';
import { useAuth } from '../auth/auth-context';

/*
  Chữ của hộp thoại xin đồng ý dùng AI nằm ở i18n/tu-dien/chat.ts (khoá `dongYAI`).

  Guideline 5.1.2(i) của Apple nêu đích danh AI bên thứ ba: phải nói rõ gửi GÌ,
  cho AI, và xin phép TRƯỚC lần gửi đầu tiên. Chính sách quyền riêng tư (mục 8.3)
  hứa đúng bước này cho cả Android, và chính sách Dữ liệu người dùng của Google
  Play bắt app làm đúng điều chính sách đã công bố. Máy chủ đã thôi gửi email của thành
  viên cho AI, nên câu được phép nói "không gửi email hay số điện thoại".
  Đổi dữ liệu gửi đi ở máy chủ thì phải sửa câu này theo, ở CẢ HAI ngôn ngữ.
*/

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
  const t = useTuDien(tuDienChat).dongYAI;
  const dichLoi = useDichLoi();

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
          Alert.alert(t.chuaLuuDuoc, dichLoi(loi, t.coLoi));
          return;
        }
        hanhDong();
      };

      Alert.alert(t.tieuDe, t.noiDung, [
        { text: t.khongCamOn, style: 'cancel' },
        { text: t.dongY, onPress: () => void dongY() },
      ]);
    },
    [daDongY, capNhatHoSo, t, dichLoi],
  );

  return { daDongY, xinDongYRoiChay };
}
