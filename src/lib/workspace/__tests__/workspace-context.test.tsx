import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, waitFor, fireEvent } from '@testing-library/react-native';

import { WorkspaceProvider, useWorkspace } from '../workspace-context';
import * as workspacesApi from '../../api/workspaces';
import * as tokenStorage from '../../auth/token-storage';

jest.mock('../../api/workspaces');
jest.mock('../../auth/token-storage');

const mockedApi = workspacesApi as jest.Mocked<typeof workspacesApi>;
const mockedStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;

function makeWorkspace(id: string) {
  return {
    id,
    name: `Không gian ${id}`,
    ownerId: 'u1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function Probe() {
  const { status, active, workspaces, create, switchTo } = useWorkspace();
  return (
    <>
      <Text testID="status">{status}</Text>
      <Text testID="active">{active?.id ?? 'khong'}</Text>
      <Text testID="so-luong">{String(workspaces.length)}</Text>
      <Pressable testID="create" onPress={() => create('Nhóm đồ án')}>
        <Text>tao</Text>
      </Pressable>
      <Pressable testID="chuyen-sang-b" onPress={() => switchTo('b')}>
        <Text>chuyen</Text>
      </Pressable>
      <Pressable testID="chuyen-sang-khong-co" onPress={() => switchTo('khong-ton-tai')}>
        <Text>chuyen bay</Text>
      </Pressable>
    </>
  );
}

function renderProbe() {
  return render(
    <WorkspaceProvider>
      <Probe />
    </WorkspaceProvider>,
  );
}

describe('WorkspaceProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.loadActiveWorkspaceId.mockResolvedValue(null);
    mockedStorage.saveActiveWorkspaceId.mockResolvedValue(undefined);
  });

  it('báo empty khi tài khoản chưa có workspace nào', async () => {
    mockedApi.listWorkspaces.mockResolvedValue([]);

    const { getByTestId } = await renderProbe();

    await waitFor(() => expect(getByTestId('status').props.children).toBe('empty'));
  });

  it('chọn workspace đã lưu khi nó còn tồn tại', async () => {
    mockedApi.listWorkspaces.mockResolvedValue([makeWorkspace('a'), makeWorkspace('b')] as never);
    mockedStorage.loadActiveWorkspaceId.mockResolvedValue('b');

    const { getByTestId } = await renderProbe();

    await waitFor(() => expect(getByTestId('status').props.children).toBe('ready'));
    expect(getByTestId('active').props.children).toBe('b');
  });

  it('quay về workspace đầu tiên khi cái đã lưu không còn', async () => {
    mockedApi.listWorkspaces.mockResolvedValue([makeWorkspace('a'), makeWorkspace('b')] as never);
    mockedStorage.loadActiveWorkspaceId.mockResolvedValue('da-bi-xoa');

    const { getByTestId } = await renderProbe();

    await waitFor(() => expect(getByTestId('active').props.children).toBe('a'));
    expect(mockedStorage.saveActiveWorkspaceId).toHaveBeenCalledWith('a');
  });

  it('tạo workspace rồi chuyển sang ready', async () => {
    mockedApi.listWorkspaces.mockResolvedValue([]);
    mockedApi.createWorkspace.mockResolvedValue(makeWorkspace('moi') as never);

    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('status').props.children).toBe('empty'));

    await fireEvent.press(getByTestId('create'));

    await waitFor(() => expect(getByTestId('status').props.children).toBe('ready'));
    expect(mockedApi.createWorkspace).toHaveBeenCalledWith({ name: 'Nhóm đồ án' });
    expect(mockedStorage.saveActiveWorkspaceId).toHaveBeenCalledWith('moi');
  });
});

describe('chuyển không gian làm việc', () => {
  beforeEach(() => {
    mockedApi.listWorkspaces.mockResolvedValue([makeWorkspace('a'), makeWorkspace('b')]);
    mockedStorage.loadActiveWorkspaceId.mockResolvedValue('a');
    mockedStorage.saveActiveWorkspaceId.mockResolvedValue(undefined);
  });

  it('đổi workspace đang dùng sang cái được chọn', async () => {
    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('active').props.children).toBe('a'));

    await fireEvent.press(getByTestId('chuyen-sang-b'));

    await waitFor(() => expect(getByTestId('active').props.children).toBe('b'));
  });

  it('nhớ lựa chọn xuống máy, để mở lại app không nhảy về cái cũ', async () => {
    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('active').props.children).toBe('a'));

    await fireEvent.press(getByTestId('chuyen-sang-b'));

    await waitFor(() => expect(mockedStorage.saveActiveWorkspaceId).toHaveBeenCalledWith('b'));
  });

  it('bỏ qua id không có trong danh sách, không xoá trắng workspace đang dùng', async () => {
    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('active').props.children).toBe('a'));

    // Workspace vừa bị xoá ở máy khác, hoặc người dùng bị mời ra.
    await fireEvent.press(getByTestId('chuyen-sang-khong-co'));

    expect(getByTestId('active').props.children).toBe('a');
  });
});
