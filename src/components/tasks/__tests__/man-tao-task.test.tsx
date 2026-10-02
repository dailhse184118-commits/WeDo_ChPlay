import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TEST_SAFE_AREA } from '../../../test-utils/render';
import ManTaoCongViec from '../../../app/(tabs)/tasks/new';
import { listProjects } from '../../../lib/api/projects';
import { createTask } from '../../../lib/api/tasks';
import { getWorkspace } from '../../../lib/api/workspaces';
import { useAuth } from '../../../lib/auth/auth-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import type { Project, WorkspaceChiTiet } from '../../../lib/types';

jest.mock('../../../lib/api/projects');
jest.mock('../../../lib/api/tasks');
jest.mock('../../../lib/api/workspaces');
jest.mock('../../../lib/auth/auth-context');
jest.mock('../../../lib/workspace/workspace-context');

/*
  Màn là một tab ẩn, sống suốt phiên: rời đi rồi quay lại là CÙNG một màn. Giả
  lập đúng vậy — hiệu ứng focus chạy lại, còn dọn dẹp chạy khi rời.
*/
type DangKyFocus = { chay: () => void | (() => void); don: void | (() => void) };
const mockDangKy = new Set<DangKyFocus>();
const mockNavigate = jest.fn();
const mockRouter = { navigate: mockNavigate, push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useFocusEffect: (hieuUng: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(() => {
      const dangKy: DangKyFocus = { chay: hieuUng, don: hieuUng() };
      mockDangKy.add(dangKy);
      return () => {
        if (typeof dangKy.don === 'function') dangKy.don();
        mockDangKy.delete(dangKy);
      };
    }, [hieuUng]);
  },
}));

/** Rời màn (chạy mọi dọn dẹp focus) rồi quay lại (chạy lại mọi hiệu ứng focus). */
async function roiRoiQuayLai() {
  await act(async () => {
    for (const dangKy of mockDangKy) {
      if (typeof dangKy.don === 'function') dangKy.don();
      dangKy.don = undefined;
    }
  });
  await act(async () => {
    for (const dangKy of mockDangKy) dangKy.don = dangKy.chay();
  });
}

const mockedDuAn = listProjects as jest.MockedFunction<typeof listProjects>;
const mockedTao = createTask as jest.MockedFunction<typeof createTask>;
const mockedKhongGian = getWorkspace as jest.MockedFunction<typeof getWorkspace>;
const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;

const TOI = { id: 'u-toi', email: 'toi@f.edu.vn', fullName: 'Lê Hữu Đại' };
const BAO = { id: 'u-bao', email: 'bao@f.edu.vn', fullName: 'Bảo' };
const CHI = { id: 'u-chi', email: null as unknown as string, fullName: 'Chi' };

function duAn(id: string, ten: string, thanhVien: Project['members']): Project {
  return {
    id,
    name: ten,
    workspaceId: 'w1',
    status: 'ACTIVE',
    createdAt: '',
    updatedAt: '',
    members: thanhVien,
  };
}

/* P1 có tôi (leader) và Bảo; P2 có tôi (thành viên thường) và Chi. */
const P1 = duAn('p1', 'Đồ án 1', [
  { id: 'pm1', role: 'LEADER', user: TOI },
  { id: 'pm2', role: 'MEMBER', user: BAO },
]);
const P2 = duAn('p2', 'Đồ án 2', [
  { id: 'pm3', role: 'MEMBER', user: TOI },
  { id: 'pm4', role: 'LEADER', user: CHI },
]);

const KHONG_GIAN: WorkspaceChiTiet = {
  id: 'w1',
  name: 'Lớp EXE201',
  ownerId: 'u-chu',
  createdAt: '',
  updatedAt: '',
  // Id bản ghi thành viên KHÁC id người dùng — gốc của lỗi chip không sáng.
  members: [
    { id: 'wm1', role: 'MEMBER', user: TOI },
    { id: 'wm2', role: 'MEMBER', user: BAO },
    { id: 'wm3', role: 'MEMBER', user: CHI },
  ],
};

let khongGianDangChon = { id: 'w1', name: 'Lớp EXE201' };
let queryClient: QueryClient;

function dung() {
  return (
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
      <QueryClientProvider client={queryClient}>
        <ManTaoCongViec />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

async function moMan() {
  const man = await render(dung());
  await waitFor(() => man.getByText('Đồ án 1'));
  await waitFor(() => man.getByText('Chi'));
  return man;
}

const chip = (man: Awaited<ReturnType<typeof moMan>>, ten: string) => man.getByLabelText(ten);
const dangChon = (man: Awaited<ReturnType<typeof moMan>>, ten: string) =>
  chip(man, ten).props.accessibilityState?.selected;

beforeEach(() => {
  jest.clearAllMocks();
  mockDangKy.clear();
  khongGianDangChon = { id: 'w1', name: 'Lớp EXE201' };
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  mockedAuth.mockReturnValue({ user: TOI } as never);
  mockedWorkspace.mockImplementation(
    () => ({ active: khongGianDangChon, workspaces: [{ ...KHONG_GIAN }] }) as never,
  );
  mockedDuAn.mockResolvedValue([P1, P2]);
  mockedKhongGian.mockResolvedValue(KHONG_GIAN);
  mockedTao.mockResolvedValue({ id: 't-moi' } as never);
});

afterEach(() => queryClient.clear());

describe('chọn người được giao', () => {
  it('chip sáng lên khi chọn, bấm lại thì bỏ chọn', async () => {
    const man = await moMan();

    await fireEvent.press(chip(man, 'Bảo'));
    expect(dangChon(man, 'Bảo')).toBe(true);

    await fireEvent.press(chip(man, 'Bảo'));
    expect(dangChon(man, 'Bảo')).toBe(false);

    await fireEvent.changeText(man.getByTestId('o-tieu-de'), 'Viết báo cáo');
    await fireEvent.press(man.getByTestId('nut-tao'));
    await waitFor(() => expect(mockedTao).toHaveBeenCalled());
    expect(mockedTao.mock.calls[0][0]).not.toHaveProperty('assigneeId');
  });

  it('gửi id NGƯỜI DÙNG, không phải id bản ghi thành viên', async () => {
    const man = await moMan();

    await fireEvent.changeText(man.getByTestId('o-tieu-de'), 'Viết báo cáo');
    await fireEvent.press(chip(man, 'Bảo'));
    await fireEvent.press(man.getByTestId('nut-tao'));

    await waitFor(() => expect(mockedTao).toHaveBeenCalled());
    expect(mockedTao.mock.calls[0][0]).toEqual(expect.objectContaining({ assigneeId: 'u-bao' }));
  });

  it('đã chọn dự án thì chỉ mời chọn người trong dự án đó', async () => {
    const man = await moMan();

    await fireEvent.press(chip(man, 'Đồ án 1'));

    expect(man.queryByLabelText('Bảo')).toBeTruthy();
    expect(man.queryByLabelText('Chi')).toBeNull();
  });

  it('đổi dự án thì bỏ người đã chọn ở dự án cũ', async () => {
    const man = await moMan();

    await fireEvent.press(chip(man, 'Đồ án 1'));
    await fireEvent.press(chip(man, 'Bảo'));
    expect(dangChon(man, 'Bảo')).toBe(true);

    await fireEvent.press(chip(man, 'Đồ án 2'));
    await fireEvent.press(chip(man, 'Đồ án 1'));

    expect(dangChon(man, 'Bảo')).toBe(false);
  });

  it('nói trước với người không phải Leader rằng chỉ Leader giao việc trong dự án', async () => {
    const man = await moMan();

    expect(man.queryByTestId('ghi-chu-khong-phai-leader')).toBeNull();
    await fireEvent.press(chip(man, 'Đồ án 2'));
    expect(man.getByTestId('ghi-chu-khong-phai-leader')).toBeTruthy();

    await fireEvent.press(chip(man, 'Đồ án 1'));
    expect(man.queryByTestId('ghi-chu-khong-phai-leader')).toBeNull();
  });
});

/*
  Màn không bao giờ bị gỡ: trước đây mở lại "+" vẫn thấy nguyên tên, mô tả, hạn
  và — tệ nhất — người được giao của lần trước, vô hình vì chip không sáng. Việc
  "không giao cho ai" kế tiếp âm thầm giao cho người đó.
*/
describe('form luôn trống khi mở lại', () => {
  it('tạo xong thì lần mở sau là form trống', async () => {
    const man = await moMan();

    await fireEvent.changeText(man.getByTestId('o-tieu-de'), 'Viết báo cáo');
    await fireEvent.press(chip(man, 'Bảo'));
    await fireEvent.press(man.getByTestId('nut-tao'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/tasks'));

    expect(man.getByTestId('o-tieu-de').props.value).toBe('');
    expect(dangChon(man, 'Bảo')).toBe(false);
  });

  it('rời màn giữa chừng rồi quay lại cũng là form trống', async () => {
    const man = await moMan();
    await fireEvent.changeText(man.getByTestId('o-tieu-de'), 'Nháp dở');

    await roiRoiQuayLai();

    expect(man.getByTestId('o-tieu-de').props.value).toBe('');
  });

  it('đổi không gian làm việc thì bỏ dự án đã chọn ở không gian cũ', async () => {
    const man = await moMan();
    await fireEvent.press(chip(man, 'Đồ án 1'));
    expect(dangChon(man, 'Đồ án 1')).toBe(true);

    khongGianDangChon = { id: 'w2', name: 'Không gian khác' };
    mockedDuAn.mockResolvedValue([P1]);
    await man.rerender(dung());

    await waitFor(() => expect(mockedDuAn).toHaveBeenCalledWith('w2'));
    await waitFor(() => expect(dangChon(man, 'Đồ án 1')).toBe(false));
  });
});
