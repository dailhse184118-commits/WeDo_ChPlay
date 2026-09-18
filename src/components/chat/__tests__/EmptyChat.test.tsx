import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
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

  /*
    Nửa còn lại của cùng câu chuyện, và là lỗi người kiểm thử báo lần thứ hai
    trong ngày 18/09/2026: chữ quay đúng 180 độ.

    Không tự khai transform thôi là CHƯA ĐỦ. `_renderEmptyComponent` của
    VirtualizedList đưa style khử-lật vào **prop `style` của component**:

        style: StyleSheet.compose(inversionStyle, element.props.style)

    Component nào không nhận prop `style` thì style ấy rơi vào hư không, khung
    danh sách vẫn lật `scale: -1` mà không còn gì khử — chữ lộn ngược hoàn toàn.
  */
  it('nhận prop style từ ngoài và dán lên khung ngoài cùng', async () => {
    const { getByTestId } = await render(
      <EmptyChat title="Tiêu đề" body="Thân" style={{ transform: [{ scale: -1 }] }} />,
    );

    const style = StyleSheet.flatten(getByTestId('empty-chat').props.style) ?? {};

    expect(style.transform).toEqual([{ scale: -1 }]);
  });

  /*
    Test thật sự bắt được lỗi: dựng đúng cách màn chat dùng nó. Hai test trên
    chỉ kiểm hợp đồng, test này kiểm kết quả.
  */
  it('trong FlatList inverted thì được khử lật, không lộn ngược', async () => {
    const { getByTestId } = await render(
      <FlatList
        inverted
        data={[]}
        keyExtractor={(_, i) => String(i)}
        renderItem={() => null}
        ListEmptyComponent={<EmptyChat title="Tiêu đề" body="Thân" />}
      />,
    );

    const style = StyleSheet.flatten(getByTestId('empty-chat').props.style) ?? {};

    // Có transform nghĩa là style khử-lật của React Native đã tới nơi.
    expect(style.transform).toBeDefined();
  });
});
