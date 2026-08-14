import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { WorkspaceSwitcher } from '../WorkspaceSwitcher';
import type { Workspace } from '../../../lib/types';

function makeWorkspace(id: string, name: string): Workspace {
  return {
    id,
    name,
    ownerId: 'u1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  } as Workspace;
}

const A = makeWorkspace('a', 'Nhóm đồ án');
const B = makeWorkspace('b', 'Câu lạc bộ');

describe('WorkspaceSwitcher', () => {
  const onSelect = jest.fn();
  const onDismiss = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  function renderSheet(props: Partial<React.ComponentProps<typeof WorkspaceSwitcher>> = {}) {
    return render(
      <WorkspaceSwitcher
        visible
        workspaces={[A, B]}
        activeId="a"
        onSelect={onSelect}
        onDismiss={onDismiss}
        {...props}
      />,
    );
  }

  it('liệt kê mọi không gian làm việc', async () => {
    const { getByText } = await renderSheet();

    expect(getByText('Nhóm đồ án')).toBeTruthy();
    expect(getByText('Câu lạc bộ')).toBeTruthy();
  });

  it('đánh dấu cái đang dùng để người dùng biết mình đang ở đâu', async () => {
    const { getByTestId } = await renderSheet();

    expect(getByTestId('workspace-a').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('workspace-b').props.accessibilityState.selected).toBe(false);
  });

  it('báo id được chọn khi chạm vào một dòng', async () => {
    const { getByTestId } = await renderSheet();

    await fireEvent.press(getByTestId('workspace-b'));

    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('chạm vào cái đang dùng thì chỉ đóng sheet, không chọn lại', async () => {
    const { getByTestId } = await renderSheet();

    await fireEvent.press(getByTestId('workspace-a'));

    expect(onSelect).not.toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });

  it('không dựng gì khi đang ẩn', async () => {
    const { queryByText } = await renderSheet({ visible: false });

    expect(queryByText('Nhóm đồ án')).toBeNull();
  });
});
