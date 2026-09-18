import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { FriendRow } from '../FriendRow';
import type { UserSummary } from '../../../lib/types';

const BAN: UserSummary = { id: 'u2', email: 'tuan@wedo.vn', fullName: 'Tuấn' };

describe('FriendRow', () => {
  const tay = {
    onNhanTin: jest.fn(),
    onGuiLoiMoi: jest.fn(),
    onDuyet: jest.fn(),
    onTuChoi: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  function dung(props: Partial<React.ComponentProps<typeof FriendRow>> = {}) {
    return render(<FriendRow nguoi={BAN} trangThai="chua-gi-ca" {...tay} {...props} />);
  }

  it('luôn hiện tên và email', async () => {
    const { getByText } = await dung();

    expect(getByText('Tuấn')).toBeTruthy();
    expect(getByText('tuan@wedo.vn')).toBeTruthy();
  });

  /*
    Chốt chặn cho đường truyền ảnh. `Avatar` đã có test riêng cho cả hai nhánh,
    nhưng thứ dễ đứt là chỗ QUÊN chuyền `avatarUrl` xuống — lúc đó ai cũng hiện
    vòng tròn chữ cái và trông như máy chủ chưa lưu ảnh.
  */
  it('có ảnh thì dựng ảnh thật, không phải vòng tròn chữ cái', async () => {
    const { getByTestId, queryByText } = await dung({
      nguoi: { ...BAN, avatarUrl: 'https://lh3.googleusercontent.com/abc' },
    });

    expect(getByTestId('avatar-anh')).toBeTruthy();
    expect(queryByText('T')).toBeNull();
  });

  it('chưa có quan hệ thì hiện nút kết bạn', async () => {
    const { getByTestId } = await dung({ trangThai: 'chua-gi-ca' });

    await fireEvent.press(getByTestId('friend-row-ket-ban'));

    expect(tay.onGuiLoiMoi).toHaveBeenCalled();
  });

  it('đã là bạn thì hiện nút nhắn tin, không còn nút kết bạn', async () => {
    const { getByTestId, queryByTestId } = await dung({ trangThai: 'la-ban' });

    expect(queryByTestId('friend-row-ket-ban')).toBeNull();
    await fireEvent.press(getByTestId('friend-row-nhan-tin'));

    expect(tay.onNhanTin).toHaveBeenCalled();
  });

  /*
    Hai nhánh PENDING phải khác hẳn nhau. Lẫn chúng thì người đang chờ mình
    duyệt lại thấy dòng chữ "Đã gửi lời mời" và không ai duyệt được cho ai.
  */
  it('mình đã gửi thì chỉ báo đang chờ, không có nút nào', async () => {
    const { getByText, queryByTestId } = await dung({ trangThai: 'da-gui-loi-moi' });

    expect(getByText('Đã gửi lời mời')).toBeTruthy();
    expect(queryByTestId('friend-row-ket-ban')).toBeNull();
    expect(queryByTestId('friend-row-duyet')).toBeNull();
  });

  it('người kia gửi thì hiện nút duyệt và từ chối', async () => {
    const { getByTestId } = await dung({ trangThai: 'cho-minh-duyet' });

    await fireEvent.press(getByTestId('friend-row-duyet'));
    expect(tay.onDuyet).toHaveBeenCalled();

    await fireEvent.press(getByTestId('friend-row-tu-choi'));
    expect(tay.onTuChoi).toHaveBeenCalled();
  });

  it('đang xử lý thì không nhận thêm thao tác', async () => {
    const { getByTestId } = await dung({ trangThai: 'cho-minh-duyet', dangXuLy: true });

    await fireEvent.press(getByTestId('friend-row-duyet'));

    expect(tay.onDuyet).not.toHaveBeenCalled();
  });
});
