import {
  DuongDanBiCamError,
  coWeb,
  duongDanWeb,
  laDuongDanThanhToan,
} from '../web-link';

// Jest không nạp `.env`, phải tự đặt.
beforeEach(() => {
  process.env.EXPO_PUBLIC_WEB_URL = 'https://fe-wedo.vercel.app';
});

describe('laDuongDanThanhToan', () => {
  it.each([
    'checkout',
    'upgrade',
    'billing',
    'pricing',
    'workspace/upgrade',
    'nang-cap',
    'thanh-toan',
  ])('chặn "%s"', (duongDan) => {
    expect(laDuongDanThanhToan(duongDan)).toBe(true);
  });

  it.each(['workspace', 'contributions', 'tasks', 'calendar'])(
    'cho qua "%s"',
    (duongDan) => {
      expect(laDuongDanThanhToan(duongDan)).toBe(false);
    },
  );

  it('không chặn nhầm từ chỉ CHỨA chữ cấm', () => {
    /*
      So chuỗi con sẽ chặn oan "display" vì chứa "pay", và "template" vì chứa
      "plan". Tách theo từng mảnh mới đúng.
    */
    expect(laDuongDanThanhToan('display')).toBe(false);
    expect(laDuongDanThanhToan('template')).toBe(false);
    expect(laDuongDanThanhToan('planning')).toBe(false);
  });
});

describe('duongDanWeb', () => {
  it('dựng địa chỉ theo lối điều hướng bằng hash của web', () => {
    expect(duongDanWeb('workspace')).toBe('https://fe-wedo.vercel.app/#/workspace');
  });

  it('bỏ dấu gạch thừa ở đầu', () => {
    expect(duongDanWeb('/workspace')).toBe(duongDanWeb('workspace'));
  });

  it('NÉM LỖI với đường dẫn thanh toán', () => {
    /*
      Chốt chặn quan trọng nhất của module này. Google Play cấm dẫn người dùng
      ra ngoài để mua hàng hoá số; vi phạm thì nặng là gỡ app khỏi Store.

      Chặn ngay tại đây thay vì tin rằng người viết sau sẽ đọc chú thích.
    */
    expect(() => duongDanWeb('upgrade')).toThrow(DuongDanBiCamError);
    expect(() => duongDanWeb('checkout')).toThrow(DuongDanBiCamError);
  });

  it('chặn đường dẫn thanh toán TRƯỚC cả khi kiểm cấu hình', () => {
    // Thứ tự quan trọng: chưa cấu hình web mà vẫn phải chặn, để lỗi thiếu biến
    // môi trường không che mất vi phạm chính sách.
    delete process.env.EXPO_PUBLIC_WEB_URL;
    expect(() => duongDanWeb('checkout')).toThrow(DuongDanBiCamError);
  });

  it('báo lỗi rõ khi chưa cấu hình web', () => {
    // Im lặng trả chuỗi rỗng thì nút bấm không làm gì và không ai biết vì sao.
    delete process.env.EXPO_PUBLIC_WEB_URL;
    expect(() => duongDanWeb('workspace')).toThrow('EXPO_PUBLIC_WEB_URL');
  });
});

describe('coWeb', () => {
  it('báo chưa cấu hình để giao diện ẩn nút thay vì hiện nút chết', () => {
    delete process.env.EXPO_PUBLIC_WEB_URL;
    expect(coWeb()).toBe(false);
  });
});
