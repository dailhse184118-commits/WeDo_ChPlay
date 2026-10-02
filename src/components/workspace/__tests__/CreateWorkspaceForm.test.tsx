import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { CreateWorkspaceForm } from '../CreateWorkspaceForm';
import { thamGiaLoiMoi, xemTruocLoiMoi } from '../../../lib/api/loi-moi';
import { saveActiveWorkspaceId } from '../../../lib/auth/token-storage';
import { useWorkspace } from '../../../lib/workspace/workspace-context';

jest.mock('../../../lib/api/loi-moi');
jest.mock('../../../lib/auth/token-storage', () => ({
  ...jest.requireActual('../../../lib/auth/token-storage'),
  saveActiveWorkspaceId: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../lib/workspace/workspace-context');

const mockedWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;
const refresh = jest.fn(async () => undefined);
const create = jest.fn(async () => undefined);

beforeEach(() => {
  jest.clearAllMocks();
  mockedWorkspace.mockReturnValue({ refresh, create } as never);
  (xemTruocLoiMoi as jest.Mock).mockResolvedValue({
    projectName: 'Đồ án EXE',
    workspaceName: 'Nhóm 3',
    leaderName: 'Lan',
    memberCount: 4,
    expiresAt: '2026-10-09T03:30:00.000Z',
  });
  (thamGiaLoiMoi as jest.Mock).mockResolvedValue({
    projectId: 'p-moi',
    workspaceId: 'w2',
    alreadyMember: false,
  });
});

it('tài khoản chưa có không gian: nhập mã, tham gia xong thì lưu đúng không gian rồi mới nạp lại', async () => {
  const man = await render(<CreateWorkspaceForm choNhapMaMoi />);

  await fireEvent.press(man.getByTestId('nut-co-ma-moi'));
  await fireEvent.changeText(man.getByTestId('o-ma-moi'), '7k3m9qxa');
  await fireEvent.press(man.getByTestId('nut-xem-loi-moi'));
  await waitFor(() => man.getByText('Đồ án EXE'));
  await fireEvent.press(man.getByTestId('nut-tham-gia'));

  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  expect(thamGiaLoiMoi).toHaveBeenCalledWith('7K3M9QXA');
  expect(saveActiveWorkspaceId).toHaveBeenCalledWith('w2');
  // Lưu trước rồi mới nạp lại: `refresh` đọc id đã lưu để chọn không gian vừa vào.
  expect((saveActiveWorkspaceId as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
    refresh.mock.invocationCallOrder[0],
  );
  expect(create).not.toHaveBeenCalled();
});

it('mở trong hộp thoại tạo thêm không gian thì không hiện nút nhập mã', async () => {
  const man = await render(<CreateWorkspaceForm onDone={jest.fn()} />);

  expect(man.queryByTestId('nut-co-ma-moi')).toBeNull();
});
