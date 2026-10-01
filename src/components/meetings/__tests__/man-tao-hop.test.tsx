import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TEST_SAFE_AREA } from '../../../test-utils/render';
import ManTaoCuocHop from '../../../app/(tabs)/meetings/new';
import { taoCuocHop } from '../../../lib/api/meetings';
import { listProjects } from '../../../lib/api/projects';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import type { Project } from '../../../lib/types';

jest.mock('../../../lib/api/meetings');
jest.mock('../../../lib/api/projects');
jest.mock('../../../lib/workspace/workspace-context');

/* Màn là tab ẩn, sống suốt phiên — xem ghi chú ở man-tao-task.test.tsx. */
type DangKyFocus = { chay: () => void | (() => void); don: void | (() => void) };
const mockDangKy = new Set<DangKyFocus>();
const mockReplace = jest.fn();
const mockRouter = { navigate: jest.fn(), replace: mockReplace, push: jest.fn(), back: jest.fn() };
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

const mockedTao = taoCuocHop as jest.MockedFunction<typeof taoCuocHop>;
const mockedDuAn = listProjects as jest.MockedFunction<typeof listProjects>;
const mockedWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;

const DU_AN: Project = {
  id: 'p1',
  name: 'Đồ án thiện nguyện',
  workspaceId: 'w1',
  status: 'ACTIVE',
  createdAt: '',
  updatedAt: '',
};

let khongGian = { id: 'w1', name: 'Lớp EXE201' };
let queryClient: QueryClient;

function dung() {
  return (
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
      <QueryClientProvider client={queryClient}>
        <ManTaoCuocHop />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

async function moVaDien() {
  const man = await render(dung());
  await waitFor(() => man.getByTestId('project-p1'));
  await fireEvent.press(man.getByTestId('project-p1'));
  await fireEvent.changeText(man.getByTestId('meeting-title'), 'Chốt chương 2');
  await fireEvent.changeText(man.getByTestId('meeting-agenda'), 'Rà slide');
  await fireEvent.changeText(man.getByTestId('meeting-date'), '05102026');
  await fireEvent.changeText(man.getByTestId('meeting-time'), '2000');
  return man;
}

function formTrong(man: Awaited<ReturnType<typeof moVaDien>>) {
  expect(man.getByTestId('meeting-title').props.value).toBe('');
  expect(man.getByTestId('meeting-agenda').props.value).toBe('');
  expect(man.getByTestId('meeting-date').props.value).toBe('');
  expect(man.getByTestId('meeting-time').props.value).toBe('');
  expect(man.getByTestId('project-p1').props.accessibilityState?.selected).toBe(false);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockDangKy.clear();
  khongGian = { id: 'w1', name: 'Lớp EXE201' };
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  mockedWorkspace.mockImplementation(() => ({ active: khongGian }) as never);
  mockedDuAn.mockResolvedValue([DU_AN]);
  mockedTao.mockResolvedValue({ id: 'm-moi' } as never);
});

afterEach(() => queryClient.clear());

/*
  Trước đây bấm "Tạo cuộc họp" lần sau vẫn thấy nguyên tiêu đề, nội dung, ngày,
  giờ và dự án của cuộc họp vừa tạo — bấm Tạo lần nữa là ra cuộc họp trùng.
*/
describe('form tạo cuộc họp luôn trống khi mở lại', () => {
  it('tạo xong thì form trống', async () => {
    const man = await moVaDien();

    await fireEvent.press(man.getByTestId('meeting-create'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/meetings/m-moi'));

    formTrong(man);
  });

  it('rời màn giữa chừng rồi quay lại cũng là form trống', async () => {
    const man = await moVaDien();

    await roiRoiQuayLai();

    formTrong(man);
  });

  it('đổi không gian làm việc thì bỏ dự án của không gian cũ', async () => {
    const man = await moVaDien();
    expect(man.getByTestId('project-p1').props.accessibilityState?.selected).toBe(true);

    khongGian = { id: 'w2', name: 'Không gian khác' };
    await man.rerender(dung());

    await waitFor(() =>
      expect(man.getByTestId('project-p1').props.accessibilityState?.selected).toBe(false),
    );
  });
});
