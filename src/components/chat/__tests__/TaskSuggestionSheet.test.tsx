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

  // Theo thiết kế, nút chuyển sang trạng thái chưa bật khi tiêu đề rỗng — nền phẳng
  // không bóng. Nút mờ sẵn nói rõ hơn một thông báo lỗi chỉ hiện ra sau khi bấm.
  it('vô hiệu hoá nút tạo khi tiêu đề rỗng', async () => {
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

    await fireEvent.changeText(getByTestId('suggestion-title'), '   ');

    await waitFor(() =>
      expect(getByTestId('suggestion-confirm').props.accessibilityState.disabled).toBe(true),
    );

    await fireEvent.press(getByTestId('suggestion-confirm'));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('hiện tin nhắn gốc để đối chiếu trước khi giao việc', async () => {
    const { getByText } = await render(
      <TaskSuggestionSheet
        visible
        suggestion={suggestion}
        members={members}
        sourceMessage="Hà làm phần khảo sát người dùng, xong trước 20/8 nha"
        onConfirm={() => {}}
        onDismiss={() => {}}
      />,
    );

    expect(getByText(/Hà làm phần khảo sát người dùng/)).toBeTruthy();
  });

  it('gọi thành viên là "Bạn" khi đó chính là mình', async () => {
    const { getByText, queryByText } = await render(
      <TaskSuggestionSheet
        visible
        suggestion={suggestion}
        members={members}
        currentUserId="u1"
        onConfirm={() => {}}
        onDismiss={() => {}}
      />,
    );

    expect(getByText('Bạn')).toBeTruthy();
    expect(queryByText('Lê Hữu Đại')).toBeNull();
  });

  it('mặc định giờ hết hạn 23:59 khi AI không trả về giờ', async () => {
    const { getByTestId } = await render(
      <TaskSuggestionSheet
        visible
        suggestion={{ hasTask: true, title: 'Nộp bài', confidence: 'high', dueDate: '2026-08-20' }}
        members={members}
        onConfirm={() => {}}
        onDismiss={() => {}}
      />,
    );

    await waitFor(() => expect(getByTestId('suggestion-due-time').props.value).toBe('23:59'));
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
