import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import { EmptyChat } from '../EmptyChat';

describe('EmptyChat', () => {
  it('hiện tiêu đề và phần thân', async () => {
    const { getByText } = await render(
      <EmptyChat title="Chưa có tin nhắn nào" body="Gửi tin nhắn đầu tiên." />,
    );

    expect(getByText('Chưa có tin nhắn nào')).toBeTruthy();
    expect(getByText('Gửi tin nhắn đầu tiên.')).toBeTruthy();
  });

  /*
    Chốt chặn cho lỗi ngày 18/09/2026.

    Đây dùng làm `ListEmptyComponent` của một `FlatList inverted`. React Native
    ghép `StyleSheet.compose(inversionStyle, style-cua-component)`, style của
    component nằm sau nên `transform` của nó ghi đè sạch `transform` của RN.

    Trên Android phép lật là `scale: -1` (cả hai trục), không phải `scaleY: -1`.
    Nên chỉ cần component tự khai BẤT KỲ transform nào là trục ngang không còn
    được khử, và chữ hiện ra thành ảnh gương.

    Xoá test này đi thì lỗi quay lại mà không ai biết.
  */
  it('không tự khai transform, để FlatList inverted tự lo', async () => {
    const { getByTestId } = await render(<EmptyChat title="Tiêu đề" body="Thân" />);

    const style = StyleSheet.flatten(getByTestId('empty-chat').props.style) ?? {};

    expect(style.transform).toBeUndefined();
  });
});
