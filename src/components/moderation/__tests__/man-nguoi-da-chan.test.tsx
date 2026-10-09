import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { renderScreen } from '../../../test-utils/render';
import ManNguoiDaChan from '../../../app/account/blocked';
import { listBlocks, unblockUser } from '../../../lib/api/moderation';
import { KHOA_DANH_SACH_CHAN } from '../../../lib/moderation/use-kiem-duyet';

jest.mock('../../../lib/api/moderation', () => ({
  ...jest.requireActual('../../../lib/api/moderation'),
  listBlocks: jest.fn(),
  unblockUser: jest.fn(),
}));

const mockedRouter = { replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => true };
jest.mock('expo-router', () => ({
  useRouter: () => mockedRouter,
}));

/*
  Kiểm thử màn hình đặt ở đây, không ở `src/app/account/__tests__/`: Expo Router
  coi mọi tệp dưới `src/app/` là một đường dẫn, kể cả tệp kiểm thử.
*/
const mockedDanhSach = listBlocks as jest.MockedFunction<typeof listBlocks>;
const mockedBoChan = unblockUser as jest.MockedFunction<typeof unblockUser>;

const TUAN = { userId: 'u2', fullName: 'Tuấn', avatarUrl: null, blockedAt: '2026-09-26T01:00:00.000Z' };
const LAN = { userId: 'u3', fullName: 'Lan', avatarUrl: null, blockedAt: '2026-09-26T02:00:00.000Z' };

let queryClient: QueryClient;

async function moMan() {
  return await renderScreen(
    <QueryClientProvider client={queryClient}>
      <ManNguoiDaChan />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

afterEach(() => queryClient.clear());

describe('màn Người đã chặn', () => {
  it('liệt kê người đã chặn, mỗi dòng một nút Bỏ chặn', async () => {
    mockedDanhSach.mockResolvedValue([TUAN, LAN]);
    const man = await moMan();

    await waitFor(() => expect(man.getByText('Tuấn')).toBeTruthy());
    expect(man.getByText('Người đã chặn')).toBeTruthy();
    expect(man.getByText('Lan')).toBeTruthy();
    expect(man.getByTestId('bo-chan-u2')).toBeTruthy();
    expect(man.getByTestId('bo-chan-u3')).toBeTruthy();
  });

  it('chưa chặn ai thì nói rõ như vậy', async () => {
    mockedDanhSach.mockResolvedValue([]);
    const man = await moMan();

    await waitFor(() => expect(man.getByText('Bạn chưa chặn ai.')).toBeTruthy());
  });

  it('bấm Bỏ chặn thì gọi máy chủ và người đó biến khỏi danh sách ngay', async () => {
    mockedDanhSach.mockResolvedValueOnce([TUAN, LAN]).mockResolvedValue([LAN]);
    mockedBoChan.mockResolvedValue({ ok: true });
    const man = await moMan();
    await waitFor(() => expect(man.getByText('Tuấn')).toBeTruthy());

    await fireEvent.press(man.getByTestId('bo-chan-u2'));

    await waitFor(() => expect(man.queryByText('Tuấn')).toBeNull());
    expect(mockedBoChan.mock.calls[0]?.[0]).toBe('u2');
    expect(man.getByText('Lan')).toBeTruthy();
    // Cache dùng chung đã khớp: khung chat hiện lại tin của người vừa được bỏ chặn.
    expect(queryClient.getQueryData(KHOA_DANH_SACH_CHAN)).toEqual([LAN]);
  });

  it('bỏ chặn hỏng thì báo lỗi và người đó vẫn còn trong danh sách', async () => {
    mockedDanhSach.mockResolvedValue([TUAN]);
    mockedBoChan.mockRejectedValue(new Error('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.'));
    const man = await moMan();
    await waitFor(() => expect(man.getByText('Tuấn')).toBeTruthy());

    await fireEvent.press(man.getByTestId('bo-chan-u2'));

    await waitFor(() =>
      expect(man.getByText('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.')).toBeTruthy(),
    );
    expect(man.getByText('Tuấn')).toBeTruthy();
  });

  it('nút Quay lại về đúng màn trước', async () => {
    mockedDanhSach.mockResolvedValue([]);
    const man = await moMan();

    await fireEvent.press(man.getByTestId('header-back'));
    expect(mockedRouter.back).toHaveBeenCalled();
  });
});
