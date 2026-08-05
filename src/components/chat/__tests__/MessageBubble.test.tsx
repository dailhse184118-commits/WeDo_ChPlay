import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { MessageBubble } from '../MessageBubble';
import type { ChatMessage } from '../../../lib/types';

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'm1',
    content: 'Mai nộp báo cáo nhé',
    workspaceId: 'w1',
    projectId: 'p1',
    authorId: 'u1',
    createdAt: '2026-08-04T03:15:00.000Z',
    updatedAt: '2026-08-04T03:15:00.000Z',
    author: { id: 'u1', email: 'a@b.c', fullName: 'Lê Hữu Đại' },
    ...overrides,
  };
}

describe('MessageBubble', () => {
  it('hiện nội dung tin nhắn', async () => {
    const { getByText } = await render(
      <MessageBubble message={makeMessage()} isMine={false} onLongPress={() => {}} />,
    );
    expect(getByText('Mai nộp báo cáo nhé')).toBeTruthy();
  });

  it('hiện tên người gửi khi không phải tin của mình', async () => {
    const { getByText } = await render(
      <MessageBubble message={makeMessage()} isMine={false} onLongPress={() => {}} />,
    );
    expect(getByText('Lê Hữu Đại')).toBeTruthy();
  });

  it('ẩn tên người gửi với tin của mình', async () => {
    const { queryByText } = await render(
      <MessageBubble message={makeMessage()} isMine onLongPress={() => {}} />,
    );
    expect(queryByText('Lê Hữu Đại')).toBeNull();
  });

  it('gọi onLongPress khi nhấn giữ', async () => {
    const onLongPress = jest.fn();
    const { getByTestId } = await render(
      <MessageBubble message={makeMessage()} isMine={false} onLongPress={onLongPress} />,
    );

    await fireEvent(getByTestId('message-m1'), 'longPress');
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('hiện chữ thu hồi thay cho nội dung cũ', async () => {
    const { getByText, queryByText } = await render(
      <MessageBubble
        message={makeMessage({ deletedAt: '2026-08-04T04:00:00.000Z' })}
        isMine={false}
        onLongPress={() => {}}
      />,
    );

    expect(getByText('Tin nhắn đã được thu hồi')).toBeTruthy();
    expect(queryByText('Mai nộp báo cáo nhé')).toBeNull();
  });

  it('không cho nhấn giữ tin đã thu hồi', async () => {
    const onLongPress = jest.fn();
    const { getByTestId } = await render(
      <MessageBubble
        message={makeMessage({ deletedAt: '2026-08-04T04:00:00.000Z' })}
        isMine={false}
        onLongPress={onLongPress}
      />,
    );

    await fireEvent(getByTestId('message-m1'), 'longPress');
    expect(onLongPress).not.toHaveBeenCalled();
  });

  // Thiết kế tách nhãn và tiêu đề thành hai dòng trong một dải nền sáng,
  // thay vì một chuỗi gộp — dải này đọc được trên cả bong bóng xanh lẫn trắng.
  it('hiện dải công việc khi tin đã gắn công việc', async () => {
    const { getByText } = await render(
      <MessageBubble
        message={makeMessage({
          taskId: 't1',
          task: {
            id: 't1',
            title: 'Nộp báo cáo',
            status: 'TODO',
            projectId: 'p1',
            workspaceId: 'w1',
          },
        })}
        isMine={false}
        onLongPress={() => {}}
      />,
    );
    expect(getByText('Đã tạo công việc')).toBeTruthy();
    expect(getByText('Nộp báo cáo')).toBeTruthy();
  });

  it('hiện nút thử lại khi gửi hỏng', async () => {
    const onRetry = jest.fn();
    const { getByTestId } = await render(
      <MessageBubble
        message={makeMessage()}
        isMine
        isFailed
        onRetry={onRetry}
        onLongPress={() => {}}
      />,
    );

    await fireEvent.press(getByTestId('retry-m1'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
