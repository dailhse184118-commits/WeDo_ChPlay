import React from 'react';
import { AppState } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TEST_SAFE_AREA } from '../../../test-utils/render';
import ManLich from '../../../app/(tabs)/calendar/index';
import { getCalendar, type MucLich } from '../../../lib/api/calendar';
import { useWorkspace } from '../../../lib/workspace/workspace-context';

jest.mock('../../../lib/api/calendar', () => ({
  ...jest.requireActual('../../../lib/api/calendar'),
  getCalendar: jest.fn(),
}));
jest.mock('../../../lib/workspace/workspace-context');

/* Màn Lịch là tab ẩn, sống suốt phiên — rời đi rồi quay lại là CÙNG một màn. */
type DangKyFocus = { chay: () => void | (() => void); don: void | (() => void) };
const mockDangKy = new Set<DangKyFocus>();
const mockRouter = { navigate: jest.fn(), push: jest.fn(), back: jest.fn() };
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

const mockedLich = getCalendar as jest.MockedFunction<typeof getCalendar>;

/* Hạn chót 23:59 ngày 01/10 theo giờ máy. */
const HAN: MucLich = {
  id: 't1',
  kind: 'TASK_DEADLINE',
  title: 'Nộp slide',
  startTime: new Date(2026, 9, 1, 23, 59).toISOString(),
} as MucLich;

let queryClient: QueryClient;

function dung() {
  return (
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
      <QueryClientProvider client={queryClient}>
        <ManLich />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockDangKy.clear();
  // Chỉ giả đồng hồ ngày giờ; hẹn giờ vẫn chạy thật cho react-query và waitFor.
  jest.useFakeTimers({
    doNotFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'setImmediate',
      'clearImmediate',
      'nextTick',
      'queueMicrotask',
    ],
  });
  jest.setSystemTime(new Date(2026, 8, 30, 10, 0));
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  (useWorkspace as jest.Mock).mockReturnValue({
    active: { id: 'w1', name: 'Lớp' },
    workspaces: [],
    switchTo: jest.fn(),
  });
  mockedLich.mockResolvedValue([HAN]);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  queryClient.clear();
});

/*
  Trước đây khoảng ngày và mốc "Hôm nay" được tính MỘT lần lúc màn gắn lần đầu.
  App nằm nền qua đêm rồi mở lại Lịch: hạn chót của hôm nay vẫn ghi "Ngày mai"
  — sinh viên tưởng còn thêm một ngày.
*/
describe('Lịch theo đúng ngày hôm nay', () => {
  it('qua ngày rồi quay lại màn thì "Hôm nay" là ngày mới và khoảng ngày dời theo', async () => {
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('Ngày mai')).toBeTruthy());

    jest.setSystemTime(new Date(2026, 9, 1, 8, 0));
    await roiRoiQuayLai();

    await waitFor(() => expect(man.getByText('Hôm nay')).toBeTruthy());
    const tu = mockedLich.mock.calls[mockedLich.mock.calls.length - 1][1];
    expect(tu.getDate()).toBe(28);
    expect(tu.getMonth()).toBe(8);
  });

  it('mở app lên sau nửa đêm (không đổi màn) cũng tính lại', async () => {
    let khiDoi: ((trangThai: string) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((loai: string, fn: never) => {
      if (loai === 'change') khiDoi = fn;
      return { remove: jest.fn() };
    }) as never);

    const man = await render(dung());
    await waitFor(() => expect(man.getByText('Ngày mai')).toBeTruthy());

    jest.setSystemTime(new Date(2026, 9, 1, 8, 0));
    await act(async () => khiDoi?.('active'));

    await waitFor(() => expect(man.getByText('Hôm nay')).toBeTruthy());
  });
});
