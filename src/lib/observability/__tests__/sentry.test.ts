import { dongMotHang, cauHinhSentry } from '../sentry';

describe('cauHinhSentry', () => {
  /*
    Chưa khai DSN — máy của lập trình viên, hay bản build trước lúc ai đó tạo
    tài khoản Sentry — thì phải im lặng bỏ qua. Bật giám sát lỗi mà lại làm app
    không mở được thì đúng là tự bắn vào chân.
  */
  it('không bật khi chưa khai DSN', () => {
    expect(cauHinhSentry({})).toBeNull();
    expect(cauHinhSentry({ dsn: '' })).toBeNull();
    expect(cauHinhSentry({ dsn: '   ' })).toBeNull();
  });

  it('bật khi có DSN', () => {
    expect(cauHinhSentry({ dsn: 'https://abc@o1.ingest.sentry.io/2' })?.dsn).toBe(
      'https://abc@o1.ingest.sentry.io/2',
    );
  });

  /*
    Phải tách được lỗi của bản tester đang chạy khỏi lỗi lúc ngồi code, nếu
    không thì mỗi lần sửa bài là sinh ra một đống nhiễu đè lên lỗi thật.
  */
  it('gắn nhãn môi trường theo chế độ chạy', () => {
    expect(cauHinhSentry({ dsn: 'x', dangPhatTrien: true })?.environment).toBe('development');
    expect(cauHinhSentry({ dsn: 'x', dangPhatTrien: false })?.environment).toBe('production');
  });

  /*
    Không có phiên bản thì mọi lỗi trông như nhau, và không biết bản vá đã ăn
    hay chưa. Đây đúng là thứ cần khi mỗi ngày ra hai ba bản.
  */
  it('gắn phiên bản app kèm mã build', () => {
    const c = cauHinhSentry({ dsn: 'x', phienBan: '1.0.13', maBuild: 16 });

    expect(c?.release).toBe('1.0.13');
    expect(c?.dist).toBe('16');
  });

  /*
    Mặc định Sentry kèm địa chỉ IP và dữ liệu thiết bị. WeDo giữ tin nhắn riêng
    của sinh viên; đẩy thêm dữ liệu cá nhân sang bên thứ ba là chuyện không ai
    đồng ý cả.
  */
  it('không gửi kèm dữ liệu cá nhân', () => {
    expect(cauHinhSentry({ dsn: 'x' })?.sendDefaultPii).toBe(false);
  });

  /*
    Lúc ngồi code thì mọi lỗi đã hiện đỏ trên màn hình rồi; gửi lên Sentry nữa
    chỉ tổ đốt hạn mức của gói miễn phí.
  */
  it('chỉ gửi thật khi không phải bản đang phát triển', () => {
    expect(cauHinhSentry({ dsn: 'x', dangPhatTrien: true })?.enabled).toBe(false);
    expect(cauHinhSentry({ dsn: 'x', dangPhatTrien: false })?.enabled).toBe(true);
  });
});

describe('dongMotHang', () => {
  /*
    Sentry tu choi tag co xuong dong hoac dai qua 200 ky tu, va hien `<invalid>`
    thay cho gia tri. Ngay 19/09 loi native cua Expo kem ca khoi "Call stack"
    nhieu dong nen nguyen nhan bi vut mat dung luc can nhat.
  */
  it('gộp mọi khoảng trắng và xuống dòng thành một dấu cách', () => {
    expect(dongMotHang('Error: hong\n  Call stack:\n   at x')).toBe(
      'Error: hong Call stack: at x',
    );
  });

  it('cắt bớt chuỗi quá dài để Sentry không từ chối', () => {
    const ket_qua = dongMotHang('x'.repeat(500));

    expect(ket_qua.length).toBeLessThanOrEqual(180);
    expect(ket_qua.endsWith('…')).toBe(true);
  });

  it('giữ nguyên chuỗi ngắn, một dòng', () => {
    expect(dongMotHang('Unsupported FormDataPart implementation')).toBe(
      'Unsupported FormDataPart implementation',
    );
  });

  it('trả về rỗng khi không có gì', () => {
    expect(dongMotHang('   \n  ')).toBe('');
  });
});
