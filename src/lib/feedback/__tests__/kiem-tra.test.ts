import { TOI_DA_KY_TU, kiemTraDanhGia, soKyTuConLai } from '../kiem-tra';

describe('kiemTraDanhGia', () => {
  it('bắt chọn sao trước', () => {
    expect(kiemTraDanhGia(0, 'nội dung đủ dài để qua ải')).toBe('Chọn số sao trước đã.');
  });

  it('từ chối sao ngoài khoảng 1 tới 5', () => {
    expect(kiemTraDanhGia(6, 'nội dung đủ dài để qua ải')).not.toBeNull();
  });

  it('nói rõ còn thiếu bao nhiêu ký tự', () => {
    /*
      Nêu mức tối thiểu thôi thì người dùng vẫn phải tự trừ nhẩm. Nói thẳng số
      còn thiếu là bớt cho họ một bước.
    */
    expect(kiemTraDanhGia(5, 'ngắn')).toBe(
      'Viết thêm 6 ký tự nữa để chúng tôi hiểu ý bạn.',
    );
  });

  it('đếm sau khi cắt khoảng trắng, không cho lách bằng dấu cách', () => {
    // Máy chủ cũng cắt trước khi đếm; kiểm khác nhau thì máy khách cho qua rồi
    // máy chủ chặn, người dùng nhận lỗi ở chỗ không ngờ tới.
    expect(kiemTraDanhGia(5, '   ngắn   ')).not.toBeNull();
  });

  it('cho qua khi đủ điều kiện', () => {
    expect(kiemTraDanhGia(4, 'App dùng ổn, chỉ hơi chậm lúc mở chat.')).toBeNull();
  });

  it('chặn nội dung dài quá giới hạn', () => {
    expect(kiemTraDanhGia(5, 'a'.repeat(TOI_DA_KY_TU + 1))).toContain('rút gọn');
  });
});

describe('soKyTuConLai', () => {
  it('trừ theo độ dài đã cắt khoảng trắng', () => {
    expect(soKyTuConLai('  abc  ')).toBe(TOI_DA_KY_TU - 3);
  });

  it('trả số âm khi đã vượt, để giao diện tô đỏ được', () => {
    expect(soKyTuConLai('a'.repeat(TOI_DA_KY_TU + 5))).toBe(-5);
  });
});
