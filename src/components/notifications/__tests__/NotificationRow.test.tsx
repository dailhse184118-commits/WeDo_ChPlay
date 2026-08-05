import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { NotificationRow } from '../NotificationRow';
import type { NotificationItem } from '../../../lib/types';

function makeItem(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: 'n1',
    type: 'TASK_ASSIGNED',
    title: 'Bạn có việc mới',
    message: 'Nộp báo cáo tuần đã được giao cho bạn',
    userId: 'u1',
    createdAt: '2026-08-04T10:00:00.000Z',
    ...overrides,
  };
}

describe('NotificationRow', () => {
  it('hiện tiêu đề và nội dung', async () => {
    const { getByText } = await render(<NotificationRow item={makeItem()} onPress={() => {}} />);
    expect(getByText('Bạn có việc mới')).toBeTruthy();
    expect(getByText('Nộp báo cáo tuần đã được giao cho bạn')).toBeTruthy();
  });

  it('hiện chấm chưa đọc khi readAt rỗng', async () => {
    const { getByTestId } = await render(
      <NotificationRow item={makeItem({ readAt: null })} onPress={() => {}} />,
    );
    expect(getByTestId('unread-dot-n1')).toBeTruthy();
  });

  it('ẩn chấm khi đã đọc', async () => {
    const { queryByTestId } = await render(
      <NotificationRow
        item={makeItem({ readAt: '2026-08-04T11:00:00.000Z' })}
        onPress={() => {}}
      />,
    );
    expect(queryByTestId('unread-dot-n1')).toBeNull();
  });

  it('gọi onPress khi nhấn', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(<NotificationRow item={makeItem()} onPress={onPress} />);

    await fireEvent.press(getByTestId('notification-n1'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('đổi ô icon theo loại thông báo', async () => {
    const { getByTestId } = await render(
      <NotificationRow item={makeItem({ type: 'TASK_DEADLINE_REMINDER' })} onPress={() => {}} />,
    );
    expect(getByTestId('notification-icon-n1')).toBeTruthy();
  });
});
