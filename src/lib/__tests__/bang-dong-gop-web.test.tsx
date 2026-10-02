import React from 'react';
import { waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ManDongGop from '../../app/(tabs)/account/contributions';
import { getContributions, type DongGopThanhVien } from '../api/tasks';
import { useWorkspace } from '../workspace/workspace-context';
import { renderScreen } from '../../test-utils/render';

/*
  Nút "Xem đầy đủ trên web" của Bảng đóng góp.

  Trang web đó mở vào màn Cài đặt, sát cạnh tab "Quản lý gói và thanh toán",
  thanh bên có "Nâng cấp gói": một lối dẫn ra trang mua ngoài Google Play
  Billing. Nút phải biến mất trên MỌI nền tảng, kể cả khi đã cấu hình web.

  Đặt ở đây chứ không cạnh màn hình: mọi tệp dưới `src/app/(tabs)/` đều thành
  một tab, kể cả tệp kiểm thử.
*/

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: jest.fn(), push: jest.fn(), replace: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('../api/tasks', () => ({ getContributions: jest.fn() }));
jest.mock('../workspace/workspace-context');

const mockedBang = getContributions as jest.MockedFunction<typeof getContributions>;
const mockedWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;

const NGUOI: DongGopThanhVien = {
  userId: 'u1',
  duocGiao: 3,
  hoanThanh: 2,
  dungHan: 2,
  treHan: 0,
  chuaXong: 1,
  daNop: 2,
  biTraLai: 0,
  tyLeDungHanPhanTram: 100,
  user: { id: 'u1', fullName: 'Lê Hữu Đại', email: 'a@b.c' },
};

let queryClient: QueryClient;
const WEB_CU = process.env.EXPO_PUBLIC_WEB_URL;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_WEB_URL = 'https://fe-wedo.vercel.app';
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mockedWorkspace.mockReturnValue({ active: { id: 'w1', name: 'Nhóm EXE' } } as never);
  mockedBang.mockResolvedValue({ thanhVien: [NGUOI] } as never);
});

afterEach(() => {
  queryClient.clear();
  process.env.EXPO_PUBLIC_WEB_URL = WEB_CU;
});

describe('Bảng đóng góp — nút mở web', () => {
  it('đã cấu hình web vẫn không có nút "Xem đầy đủ trên web"', async () => {
    const man = await renderScreen(
      <QueryClientProvider client={queryClient}>
        <ManDongGop />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(man.getByText('Lê Hữu Đại')).toBeTruthy());
    expect(man.queryByText('Xem đầy đủ trên web')).toBeNull();
  });
});
