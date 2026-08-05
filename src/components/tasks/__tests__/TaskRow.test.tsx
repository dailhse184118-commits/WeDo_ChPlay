import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { TaskRow } from '../TaskRow';
import type { Task } from '../../../lib/types';

const NOW = new Date(2026, 7, 4, 10, 0, 0);

function iso(year: number, month: number, day: number, hour = 10): string {
  return new Date(year, month, day, hour, 0, 0).toISOString();
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Nộp báo cáo tuần',
    status: 'TODO',
    workspaceId: 'w1',
    assigneeId: 'u1',
    createdAt: iso(2026, 7, 1),
    updatedAt: iso(2026, 7, 1),
    ...overrides,
  };
}

describe('TaskRow', () => {
  it('hiện tiêu đề công việc', async () => {
    const { getByText } = await render(<TaskRow task={makeTask()} now={NOW} onPress={() => {}} />);
    expect(getByText('Nộp báo cáo tuần')).toBeTruthy();
  });

  it('hiện chip trạng thái bằng tiếng Việt', async () => {
    const { getByText } = await render(
      <TaskRow task={makeTask({ status: 'IN_PROGRESS' })} now={NOW} onPress={() => {}} />,
    );
    expect(getByText('Đang làm')).toBeTruthy();
  });

  /*
    Bắt được khi nghiệm thu 05/08: máy chủ đưa việc bị từ chối về trạng thái TODO,
    nên chip hiện "Cần làm" — nhìn y hệt việc còn phải làm. Người vừa từ chối xong
    lại tưởng mình vẫn nợ nó.
  */
  it('hiện "Đã từ chối" thay vì trạng thái khi việc bị từ chối', async () => {
    const { getByText, queryByText } = await render(
      <TaskRow
        task={makeTask({ status: 'TODO', assignmentStatus: 'REJECTED' })}
        now={NOW}
        onPress={() => {}}
      />,
    );

    expect(getByText('Đã từ chối')).toBeTruthy();
    expect(queryByText('Cần làm')).toBeNull();
  });

  it('vẫn hiện trạng thái bình thường khi việc đã nhận', async () => {
    const { getByText } = await render(
      <TaskRow
        task={makeTask({ status: 'TODO', assignmentStatus: 'ACCEPTED' })}
        now={NOW}
        onPress={() => {}}
      />,
    );
    expect(getByText('Cần làm')).toBeTruthy();
  });

  it('ẩn nút nhận và từ chối với việc đã nhận', async () => {
    const { queryByTestId } = await render(
      <TaskRow task={makeTask({ assignmentStatus: 'ACCEPTED' })} now={NOW} onPress={() => {}} />,
    );
    expect(queryByTestId('task-accept-t1')).toBeNull();
    expect(queryByTestId('task-reject-t1')).toBeNull();
  });

  it('hiện hai nút với việc chờ phản hồi', async () => {
    const { getByTestId } = await render(
      <TaskRow
        task={makeTask({ assignmentStatus: 'PENDING' })}
        now={NOW}
        onPress={() => {}}
        onAccept={() => {}}
        onReject={() => {}}
      />,
    );
    expect(getByTestId('task-accept-t1')).toBeTruthy();
    expect(getByTestId('task-reject-t1')).toBeTruthy();
  });

  it('gọi onAccept khi bấm Nhận việc', async () => {
    const onAccept = jest.fn();
    const { getByTestId } = await render(
      <TaskRow
        task={makeTask({ assignmentStatus: 'PENDING' })}
        now={NOW}
        onPress={() => {}}
        onAccept={onAccept}
        onReject={() => {}}
      />,
    );

    await fireEvent.press(getByTestId('task-accept-t1'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('gọi onReject khi bấm Từ chối', async () => {
    const onReject = jest.fn();
    const { getByTestId } = await render(
      <TaskRow
        task={makeTask({ assignmentStatus: 'PENDING' })}
        now={NOW}
        onPress={() => {}}
        onAccept={() => {}}
        onReject={onReject}
      />,
    );

    await fireEvent.press(getByTestId('task-reject-t1'));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('gọi onPress khi nhấn vào thẻ', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(<TaskRow task={makeTask()} now={NOW} onPress={onPress} />);

    await fireEvent.press(getByTestId('task-row-t1'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('hiện tên dự án ở dòng phụ', async () => {
    const { getByText } = await render(
      <TaskRow
        task={makeTask({ project: { id: 'p1', name: 'Đồ án CNTT', status: 'ACTIVE' } })}
        now={NOW}
        onPress={() => {}}
      />,
    );
    expect(getByText(/Đồ án CNTT/)).toBeTruthy();
  });

  it('hiện số ngày quá hạn thay vì ngày thô', async () => {
    const { getByText } = await render(
      <TaskRow task={makeTask({ dueDate: iso(2026, 7, 2) })} now={NOW} onPress={() => {}} />,
    );
    expect(getByText(/Quá hạn 2 ngày/)).toBeTruthy();
  });

  it('hiện "Hạn hôm nay" khi đến hạn trong ngày', async () => {
    const { getByText } = await render(
      <TaskRow task={makeTask({ dueDate: iso(2026, 7, 4, 17) })} now={NOW} onPress={() => {}} />,
    );
    expect(getByText(/Hạn hôm nay/)).toBeTruthy();
  });

  it('không hiện dòng hạn khi việc không có hạn chót', async () => {
    const { queryByText } = await render(
      <TaskRow task={makeTask({ dueDate: null })} now={NOW} onPress={() => {}} />,
    );
    expect(queryByText(/Hạn/)).toBeNull();
  });

  it('gắn ô icon với tông màu theo nhóm hạn', async () => {
    const { getByTestId } = await render(
      <TaskRow task={makeTask({ dueDate: iso(2026, 7, 2) })} now={NOW} onPress={() => {}} />,
    );
    expect(getByTestId('task-icon-t1')).toBeTruthy();
  });
});
