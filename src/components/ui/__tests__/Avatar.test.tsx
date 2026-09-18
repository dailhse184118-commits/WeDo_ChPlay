import React from 'react';
import { render } from '@testing-library/react-native';

import { Avatar } from '../Avatar';

describe('Avatar', () => {
  it('hiện chữ cái đầu khi người dùng chưa có ảnh', async () => {
    const { getByText } = await render(<Avatar hoTen="Tuấn Anh" />);

    expect(getByText('T')).toBeTruthy();
  });

  it('viết hoa chữ cái đầu dù tên gõ thường', async () => {
    const { getByText } = await render(<Avatar hoTen="lan" />);

    expect(getByText('L')).toBeTruthy();
  });

  /*
    Tên rỗng không được cho ra một vòng tròn trắng trơn trông như lỗi dựng hình.
  */
  it('dùng dấu hỏi khi không có tên', async () => {
    const { getByText } = await render(<Avatar hoTen="" />);

    expect(getByText('?')).toBeTruthy();
  });

  it('có ảnh thì dựng ảnh, không còn chữ cái', async () => {
    const { queryByText, getByTestId } = await render(
      <Avatar hoTen="Tuấn" anhUrl="https://lh3.googleusercontent.com/abc" />,
    );

    expect(getByTestId('avatar-anh')).toBeTruthy();
    expect(queryByText('T')).toBeNull();
  });

  /*
    Máy chủ trả chuỗi rỗng cho người chưa từng đặt ảnh. Đưa chuỗi rỗng vào
    `expo-image` cho ra một ô trống, không phải chữ cái đầu.
  */
  it('coi chuỗi rỗng như chưa có ảnh', async () => {
    const { getByText, queryByTestId } = await render(<Avatar hoTen="Tuấn" anhUrl="" />);

    expect(getByText('T')).toBeTruthy();
    expect(queryByTestId('avatar-anh')).toBeNull();
  });
});
