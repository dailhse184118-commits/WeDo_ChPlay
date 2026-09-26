import React from 'react';
import { Platform } from 'react-native';
import { waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ManDongGop from '../../app/(tabs)/account/contributions';
import { getContributions, type DongGopThanhVien } from '../api/tasks';
import { useWorkspace } from '../workspace/workspace-context';
import { renderScreen } from '../../test-utils/render';

/*
  Nút "Xem đầy đủ trên web" của Bảng đóng góp.

  Trang web đó mở vào màn Cài đặt, sát cạnh tab "Quản lý gói và thanh toán".
  Trên iPhone đó là một lối dẫn sang trang mua (Guideline 3.1.1(a), 3.1.3(f)),
  nên nút phải biến mất hẳn. Android giữ nguyên như cũ.

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
let heDieuHanh: jest.ReplaceProperty<typeof Platform.OS> | undefined;
const WEB_CU = process.env.EXPO_PUBLIC_WEB_URL;

async function moMan() {
  return await renderScreen(
    <QueryClientProvider client={queryClient}>
      <ManDongGop />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_WEB_URL = 'https://wedofpt.com.vn';
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mockedWorkspace.mockReturnValue({ active: { id: 'w1', name: 'Nhóm EXE' } } as never);
  mockedBang.mockResolvedValue({ thanhVien: [NGUOI] } as never);
});

afterEach(() => {
  heDieuHanh?.restore();
  heDieuHanh = undefined;
  queryClient.clear();
  process.env.EXPO_PUBLIC_WEB_URL = WEB_CU;
});

describe('Bảng đóng góp — nút mở web', () => {
  it('iPhone: không có nút "Xem đầy đủ trên web"', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    const man = await moMan();

    await waitFor(() => expect(man.getByText('Lê Hữu Đại')).toBeTruthy());
    expect(man.queryByText('Xem đầy đủ trên web')).toBeNull();
  });

  it('Android: vẫn có nút như trước', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
    const man = await moMan();

    await waitFor(() => expect(man.getByText('Lê Hữu Đại')).toBeTruthy());
    expect(man.getByText('Xem đầy đủ trên web')).toBeTruthy();
  });
});
