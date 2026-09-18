import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { ConversationRow } from '../ConversationRow';
import type { DirectConversation, UserSummary } from '../../../lib/types';

function nguoi(id: string, ten: string): UserSummary {
  return { id, email: `${id}@wedo.vn`, fullName: ten };
}

const TOI = nguoi('u1', 'Đại');
const BAN = nguoi('u2', 'Tuấn');

function hoiThoai(unreadCount = 0): DirectConversation {
  return {
    id: 'c1',
    pairKey: 'u1:u2',
    createdAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z',
    unreadCount,
    participants: [
      { id: 'p1', userId: TOI.id, user: TOI },
      { id: 'p2', userId: BAN.id, user: BAN },
    ],
  };
}

describe('ConversationRow', () => {
  it('hiện tên người đối thoại, không phải tên mình', async () => {
    const { getByText, queryByText } = await render(
      <ConversationRow
        conversation={hoiThoai()}
        currentUserId="u1"
        online={false}
        onPress={jest.fn()}
      />,
    );

    expect(getByText('Tuấn')).toBeTruthy();
    expect(queryByText('Đại')).toBeNull();
  });

  it('hiện huy hiệu khi còn tin chưa đọc', async () => {
    const { getByTestId } = await render(
      <ConversationRow
        conversation={hoiThoai(3)}
        currentUserId="u1"
        online={false}
        onPress={jest.fn()}
      />,
    );

    expect(getByTestId('unread-badge')).toBeTruthy();
  });

  it('không hiện huy hiệu khi đã đọc hết', async () => {
    const { queryByTestId } = await render(
      <ConversationRow
        conversation={hoiThoai(0)}
        currentUserId="u1"
        online={false}
        onPress={jest.fn()}
      />,
    );

    expect(queryByTestId('unread-badge')).toBeNull();
  });

  it('gộp số chưa đọc quá lớn thành 99+', async () => {
    const { getByTestId } = await render(
      <ConversationRow
        conversation={hoiThoai(120)}
        currentUserId="u1"
        online={false}
        onPress={jest.fn()}
      />,
    );

    expect(getByTestId('unread-badge')).toHaveTextContent('99+');
  });

  it('hiện chấm online khi người kia đang kết nối', async () => {
    const { getByTestId } = await render(
      <ConversationRow
        conversation={hoiThoai()}
        currentUserId="u1"
        online
        onPress={jest.fn()}
      />,
    );

    expect(getByTestId('cham-online')).toBeTruthy();
  });

  it('báo ra ngoài khi được chạm', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <ConversationRow
        conversation={hoiThoai()}
        currentUserId="u1"
        online={false}
        onPress={onPress}
      />,
    );

    fireEvent.press(getByTestId('conversation-row-c1'));

    expect(onPress).toHaveBeenCalled();
  });

  /*
    Tài khoản kia có thể vừa bị xoá. Một dòng hỏng thì bỏ dòng đó, không được
    làm sập cả danh sách.
  */
  it('không dựng gì khi không tìm ra người đối thoại', async () => {
    const { toJSON } = await render(
      <ConversationRow
        conversation={hoiThoai()}
        currentUserId="u9"
        online={false}
        onPress={jest.fn()}
      />,
    );

    expect(toJSON()).toBeNull();
  });
});
