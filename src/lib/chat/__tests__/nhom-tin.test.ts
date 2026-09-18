import { idsHienAvatar, idsHienTen } from '../nhom-tin';

describe('idsHienAvatar', () => {
  it('một mình một chuỗi thì có avatar', () => {
    const ket = idsHienAvatar([{ id: 'm1', nguoiGuiId: 'u2' }]);

    expect(ket.has('m1')).toBe(true);
  });

  /*
    Đây là lý do hàm này tồn tại. Gắn avatar cho mọi tin thì bốn tin liên tiếp
    của một người thành bốn khuôn mặt xếp dọc, chật và rối.
  */
  it('chuỗi liên tiếp chỉ tin cuối có avatar', () => {
    const ket = idsHienAvatar([
      { id: 'm1', nguoiGuiId: 'u2' },
      { id: 'm2', nguoiGuiId: 'u2' },
      { id: 'm3', nguoiGuiId: 'u2' },
    ]);

    expect(ket.has('m1')).toBe(false);
    expect(ket.has('m2')).toBe(false);
    expect(ket.has('m3')).toBe(true);
  });

  it('người khác xen vào thì chuỗi đứt', () => {
    const ket = idsHienAvatar([
      { id: 'm1', nguoiGuiId: 'u2' },
      { id: 'm2', nguoiGuiId: 'u2' },
      { id: 'm3', nguoiGuiId: 'u1' },
      { id: 'm4', nguoiGuiId: 'u2' },
    ]);

    expect(Array.from(ket).sort()).toEqual(['m2', 'm3', 'm4']);
  });

  /*
    Tin chưa gửi xong chưa có id máy chủ nhưng vẫn phải nằm đúng chuỗi, nếu
    không thì tin vừa gõ nhảy ra một khối riêng rồi lại nhập vào khi gửi xong.
  */
  it('không ngã khi thiếu người gửi', () => {
    const ket = idsHienAvatar([
      { id: 'm1', nguoiGuiId: undefined },
      { id: 'm2', nguoiGuiId: undefined },
      { id: 'm3', nguoiGuiId: 'u2' },
    ]);

    expect(ket.has('m1')).toBe(false);
    expect(ket.has('m2')).toBe(true);
    expect(ket.has('m3')).toBe(true);
  });

  it('danh sách rỗng trả tập rỗng', () => {
    expect(idsHienAvatar([]).size).toBe(0);
  });
});

describe('idsHienTen', () => {
  /*
    Tên đứng ở tin ĐẦU chuỗi, ngược hẳn với avatar. Lẫn hai cái thì người đọc
    gặp mấy bong bóng vô danh rồi mới biết của ai.
  */
  it('chuỗi liên tiếp chỉ tin đầu có tên', () => {
    const ket = idsHienTen([
      { id: 'm1', nguoiGuiId: 'u2' },
      { id: 'm2', nguoiGuiId: 'u2' },
      { id: 'm3', nguoiGuiId: 'u2' },
    ]);

    expect(Array.from(ket)).toEqual(['m1']);
  });

  it('người khác xen vào thì chuỗi đứt', () => {
    const ket = idsHienTen([
      { id: 'm1', nguoiGuiId: 'u2' },
      { id: 'm2', nguoiGuiId: 'u2' },
      { id: 'm3', nguoiGuiId: 'u1' },
      { id: 'm4', nguoiGuiId: 'u2' },
    ]);

    expect(Array.from(ket).sort()).toEqual(['m1', 'm3', 'm4']);
  });

  it('danh sách rỗng trả tập rỗng', () => {
    expect(idsHienTen([]).size).toBe(0);
  });
});
