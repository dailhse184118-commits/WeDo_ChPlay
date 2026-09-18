import { mucCapNhat, soSanhPhienBan } from '../so-sanh';

describe('soSanhPhienBan', () => {
  /*
    Cái bẫy của chính dự án này. So chuỗi thì '1.0.10' < '1.0.9' vì ký tự '1'
    nhỏ hơn '9'. Phải tách theo dấu chấm rồi so bằng số.
  */
  it('1.0.10 mới hơn 1.0.9, không so theo thứ tự chữ cái', () => {
    expect(soSanhPhienBan('1.0.10', '1.0.9')).toBe(1);
    expect(soSanhPhienBan('1.0.9', '1.0.10')).toBe(-1);
  });

  it('hai phiên bản giống nhau trả 0', () => {
    expect(soSanhPhienBan('1.0.10', '1.0.10')).toBe(0);
  });

  it('so từ bậc cao xuống bậc thấp', () => {
    expect(soSanhPhienBan('2.0.0', '1.99.99')).toBe(1);
    expect(soSanhPhienBan('1.1.0', '1.0.99')).toBe(1);
  });

  it('thiếu bậc thì coi bậc đó là 0', () => {
    expect(soSanhPhienBan('1.1', '1.1.0')).toBe(0);
    expect(soSanhPhienBan('1.1', '1.1.1')).toBe(-1);
  });

  it('bỏ qua phần đuôi không phải số', () => {
    expect(soSanhPhienBan('1.0.10-beta', '1.0.9')).toBe(1);
  });
});

describe('mucCapNhat', () => {
  it('không cần khi đang chạy đúng bản mới nhất', () => {
    expect(mucCapNhat({ hienTai: '1.0.10', latest: '1.0.10', minimum: '1.0.0' })).toBe(
      'khong-can',
    );
  });

  it('nên cập nhật khi có bản mới hơn', () => {
    expect(mucCapNhat({ hienTai: '1.0.9', latest: '1.0.10', minimum: '1.0.0' })).toBe(
      'nen-cap-nhat',
    );
  });

  it('bắt buộc khi thấp hơn phiên bản tối thiểu', () => {
    expect(mucCapNhat({ hienTai: '0.9.0', latest: '1.0.10', minimum: '1.0.0' })).toBe(
      'bat-buoc',
    );
  });

  it('bắt buộc thắng gợi ý khi dính cả hai', () => {
    expect(mucCapNhat({ hienTai: '0.5.0', latest: '1.0.10', minimum: '1.0.0' })).toBe(
      'bat-buoc',
    );
  });

  it('đúng bằng phiên bản tối thiểu thì không bị chặn', () => {
    expect(mucCapNhat({ hienTai: '1.0.0', latest: '1.0.0', minimum: '1.0.0' })).toBe(
      'khong-can',
    );
  });

  /*
    Nhóm "hỏng thì im lặng". Một cơ chế kiểm phiên bản mà khoá người dùng ra
    khỏi app đang chạy tốt thì tệ hơn hẳn việc không có nó.
  */
  it.each([
    ['thiếu phiên bản hiện tại', { hienTai: undefined, latest: '1.0.10', minimum: '1.0.0' }],
    ['phiên bản hiện tại rỗng', { hienTai: '', latest: '1.0.10', minimum: '1.0.0' }],
    ['thiếu cả latest lẫn minimum', { hienTai: '1.0.0', latest: '', minimum: '' }],
    ['dữ liệu rác', { hienTai: 'abc', latest: 'xyz', minimum: 'qqq' }],
    [
      'latest rỗng, minimum hợp lệ nhưng app mới hơn',
      { hienTai: '2.0.0', latest: '', minimum: '1.0.0' },
    ],
  ])('không cần cập nhật khi %s', (_ten, input) => {
    expect(mucCapNhat(input)).toBe('khong-can');
  });

  it('vẫn chặn được khi chỉ khai minimum, không khai latest', () => {
    expect(mucCapNhat({ hienTai: '0.9.0', latest: '', minimum: '1.0.0' })).toBe('bat-buoc');
  });
});
