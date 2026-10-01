import {
  DuongDanBiCamError,
  TRANG_DUOC_MO,
  coWeb,
  duongDanWeb,
  laDuongDanThanhToan,
  laTrangDuocMo,
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

describe('laTrangDuocMo', () => {
  it.each(['privacy.html', 'dieu-khoan.html', 'ho-tro.html', 'xoa-tai-khoan.html', 'privacy.html#muc-10'])(
    'cho mở trang tĩnh "%s"',
    (duongDan) => {
      expect(laTrangDuocMo(duongDan)).toBe(true);
    },
  );

  /*
    Màn nào của ứng dụng web cũng nằm trong khung có "Nâng cấp gói", và
    #/contributions mở vào Cài đặt sát tab "Quản lý gói và thanh toán" — dù
    đường dẫn không chứa chữ nào bị cấm. Bộ lọc theo chữ từng cho lọt nó.
  */
  it.each([
    'contributions',
    'settings',
    'settings/billing',
    'workspace',
    'tasks',
    '',
    'privacy.html#/pricing',
    'chinh-sach-thanh-toan.html',
  ])('không cho mở "%s"', (duongDan) => {
    expect(laTrangDuocMo(duongDan)).toBe(false);
  });

  it('danh sách không có trang nào nói về mua gói', () => {
    for (const trang of TRANG_DUOC_MO) {
      expect(laDuongDanThanhToan(trang)).toBe(false);
    }
  });
});

describe('duongDanWeb', () => {
  it('dựng địa chỉ tới trang tĩnh, giữ mốc trong trang', () => {
    expect(duongDanWeb('privacy.html')).toBe('https://fe-wedo.vercel.app/privacy.html');
    expect(duongDanWeb('privacy.html#muc-10')).toBe('https://fe-wedo.vercel.app/privacy.html#muc-10');
  });

  it('bỏ dấu gạch thừa ở đầu', () => {
    expect(duongDanWeb('/ho-tro.html')).toBe(duongDanWeb('ho-tro.html'));
  });

  it('NÉM LỖI với màn của ứng dụng web: Cài đặt, Bảng đóng góp, bảng giá', () => {
    expect(() => duongDanWeb('contributions')).toThrow(DuongDanBiCamError);
    expect(() => duongDanWeb('settings')).toThrow(DuongDanBiCamError);
    expect(() => duongDanWeb('pricing')).toThrow(DuongDanBiCamError);
    expect(() => duongDanWeb('workspace')).toThrow(DuongDanBiCamError);
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
    expect(() => duongDanWeb('privacy.html')).toThrow('EXPO_PUBLIC_WEB_URL');
  });
});

describe('coWeb', () => {
  it('báo chưa cấu hình để giao diện ẩn nút thay vì hiện nút chết', () => {
    delete process.env.EXPO_PUBLIC_WEB_URL;
    expect(coWeb()).toBe(false);
  });
});
