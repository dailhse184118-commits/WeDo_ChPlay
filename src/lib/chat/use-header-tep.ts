import { useEffect, useState } from 'react';

import { loadToken } from '../auth/token-storage';

/**
 * Header xác thực để tải ảnh đính kèm.
 *
 * Đường `/chat/attachments/:id` nằm sau `JwtAuthGuard`, nên `<Image>` trỏ thẳng
 * vào đó sẽ nhận 401 và hiện ra một ô trống. `expo-image` cho gắn header vào
 * `source`, và đây là chỗ lấy chúng.
 *
 * Trả `undefined` khi chưa có token: dựng `Bearer null` cho ra một yêu cầu chắc
 * chắn hỏng, còn tệ hơn là không gửi header nào.
 */
export function useHeaderTep(): Record<string, string> | undefined {
  const [headers, setHeaders] = useState<Record<string, string> | undefined>(undefined);

  useEffect(() => {
    let conSong = true;

    loadToken()
      .then((token) => {
        if (conSong && token) setHeaders({ Authorization: `Bearer ${token}` });
      })
      // Keystore hỏng thì coi như chưa đăng nhập; ảnh không hiện chứ app không sập.
      .catch(() => undefined);

    return () => {
      conSong = false;
    };
  }, []);

  return headers;
}
