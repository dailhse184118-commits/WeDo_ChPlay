import { useEffect, useState } from 'react';

/**
 * Giá trị chạy sau, chỉ đuổi kịp khi người dùng ngừng thay đổi trong `cho` mili giây.
 *
 * Dùng cho ô tìm kiếm: gõ "Nguyễn Văn A" mà hỏi máy chủ mỗi ký tự là mười mấy
 * lượt gọi, phần lớn về sau lượt cuối nên kết quả còn nhảy loạn trên màn hình.
 *
 * Giá trị đầu tiên trả ngay, không bắt chờ — lúc đó chưa có gì để gộp.
 */
export function useDebouncedValue<T>(gia: T, cho: number): T {
  const [chamHon, setChamHon] = useState(gia);

  useEffect(() => {
    const hen = setTimeout(() => setChamHon(gia), cho);

    // Huỷ hẹn cũ mỗi lần giá trị đổi. Thiếu dòng này thì mọi ký tự đều nhả ra
    // sau đúng `cho` mili giây và hook thành vô dụng.
    return () => clearTimeout(hen);
  }, [gia, cho]);

  return chamHon;
}
