import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { TaskSuggestionSheet } from '../TaskSuggestionSheet';
import type { ChatTaskSuggestion, UserSummary } from '../../../lib/types';

const members: UserSummary[] = [
  { id: 'u1', email: 'a@b.c', fullName: 'Lê Hữu Đại' },
  { id: 'u2', email: 'x@y.z', fullName: 'Nguyễn Văn A' },
];

const suggestion: ChatTaskSuggestion = {
  hasTask: true,
  title: 'Nộp báo cáo tuần',
  description: 'Từ tin nhắn trong nhóm',
  assigneeId: 'u2',
  dueDate: '2026-08-10',
  dueTime: '09:00',
  confidence: 'high',
};

describe('TaskSuggestionSheet', () => {
  it('hiện trạng thái đang phân tích', async () => {
    const { getByText } = await render(
      <TaskSuggestionSheet
        visible
        loading
        members={members}
        onConfirm={() => {}}
        onDismiss={() => {}}
      />,
    );
    expect(getByText('Đang phân tích tin nhắn…')).toBeTruthy();
  });

  it('điền sẵn tiêu đề từ đề xuất', async () => {
    const { getByTestId } = await render(
      <TaskSuggestionSheet
        visible
        suggestion={suggestion}
        members={members}
        onConfirm={() => {}}
        onDismiss={() => {}}
      />,
    );

    await waitFor(() =>
      expect(getByTestId('suggestion-title').props.value).toBe('Nộp báo cáo tuần'),
    );
  });

  it('cho sửa tiêu đề rồi gửi giá trị đã sửa', async () => {
    const onConfirm = jest.fn();
    const { getByTestId } = await render(
      <TaskSuggestionSheet
        visible
        suggestion={suggestion}
        members={members}
        onConfirm={onConfirm}
        onDismiss={() => {}}
      />,
    );

    await fireEvent.changeText(getByTestId('suggestion-title'), 'Tiêu đề đã sửa');
    await fireEvent.press(getByTestId('suggestion-confirm'));

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ title: 'Tiêu đề đã sửa' })),
    );
  });

  it('chặn gửi khi tiêu đề rỗng', async () => {
    const onConfirm = jest.fn();
    const { getByTestId, getByText } = await render(
      <TaskSuggestionSheet
        visible
        suggestion={suggestion}
        members={members}
        onConfirm={onConfirm}
        onDismiss={() => {}}
      />,
    );

    await fireEvent.changeText(getByTestId('suggestion-title'), '   ');
    await fireEvent.press(getByTestId('suggestion-confirm'));

    await waitFor(() => expect(getByText('Vui lòng nhập tên công việc')).toBeTruthy());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('báo khi AI không thấy công việc nhưng vẫn cho tạo', async () => {
    const onConfirm = jest.fn();
    const { getByText, getByTestId } = await render(
      <TaskSuggestionSheet
        visible
        suggestion={{ hasTask: false, title: '', confidence: 'low' }}
        members={members}
        onConfirm={onConfirm}
        onDismiss={() => {}}
      />,
    );

    expect(getByText('Tin nhắn này có vẻ không chứa công việc')).toBeTruthy();

    await fireEvent.changeText(getByTestId('suggestion-title'), 'Tự nhập');
    await fireEvent.press(getByTestId('suggestion-confirm'));

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ title: 'Tự nhập' })),
    );
  });

  it('hiện thông báo lỗi khi được truyền vào', async () => {
    const { getByText } = await render(
      <TaskSuggestionSheet
        visible
        error="Không phân tích được tin nhắn."
        members={members}
        onConfirm={() => {}}
        onDismiss={() => {}}
      />,
    );
    expect(getByText('Không phân tích được tin nhắn.')).toBeTruthy();
  });

  it('gọi onReport khi báo đề xuất sai', async () => {
    const onReport = jest.fn();
    const { getByTestId } = await render(
      <TaskSuggestionSheet
        visible
        suggestion={suggestion}
        members={members}
        onConfirm={() => {}}
        onDismiss={() => {}}
        onReport={onReport}
      />,
    );

    await fireEvent.press(getByTestId('suggestion-report'));
    expect(onReport).toHaveBeenCalledTimes(1);
  });
});
