import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { NewConversationSheet } from '../NewConversationSheet';
import type { WorkspaceChiTiet } from '../../../lib/types';

function thanhVien(id: string, ten: string) {
  return {
    id: `m-${id}`,
    role: 'MEMBER',
    user: { id, email: `${id}@wedo.vn`, fullName: ten },
  };
}

const WORKSPACE = {
  id: 'w1',
  name: 'Nhóm đồ án',
  ownerId: 'u1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  members: [thanhVien('u1', 'Đại'), thanhVien('u2', 'Tuấn'), thanhVien('u3', 'Hạnh')],
} as WorkspaceChiTiet;

describe('NewConversationSheet', () => {
  const onChon = jest.fn();
  const onDismiss = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  function dung(props: Partial<React.ComponentProps<typeof NewConversationSheet>> = {}) {
    return render(
      <NewConversationSheet
        visible
        workspace={WORKSPACE}
        currentUserId="u1"
        dangTao={false}
        onChon={onChon}
        onDismiss={onDismiss}
        {...props}
      />,
    );
  }

  it('liệt kê thành viên trong không gian làm việc', async () => {
    const { getByText } = await dung();

    expect(getByText('Tuấn')).toBeTruthy();
    expect(getByText('Hạnh')).toBeTruthy();
  });

  /*
    Tự nhắn cho chính mình là vô nghĩa, và máy chủ cũng từ chối. Lọc ở đây để
    người dùng không bao giờ chạm phải một dòng chắc chắn báo lỗi.
  */
  it('không liệt kê chính mình', async () => {
    const { queryByText } = await dung();

    expect(queryByText('Đại')).toBeNull();
  });

  it('báo id người được chọn', async () => {
    const { getByTestId } = await dung();

    await fireEvent.press(getByTestId('nguoi-nhan-u2'));

    expect(onChon).toHaveBeenCalledWith('u2', 'Tuấn');
  });

  it('không dựng gì khi đang ẩn', async () => {
    const { queryByText } = await dung({ visible: false });

    expect(queryByText('Tuấn')).toBeNull();
  });

  it('nói rõ khi không gian chưa có ai khác', async () => {
    const { getByText } = await dung({
      workspace: { ...WORKSPACE, members: [thanhVien('u1', 'Đại')] } as WorkspaceChiTiet,
    });

    expect(getByText('Không gian này chưa có thành viên nào khác')).toBeTruthy();
  });

  it('khoá danh sách trong lúc đang tạo hội thoại', async () => {
    const { getByTestId } = await dung({ dangTao: true });

    await fireEvent.press(getByTestId('nguoi-nhan-u2'));

    expect(onChon).not.toHaveBeenCalled();
  });
});
