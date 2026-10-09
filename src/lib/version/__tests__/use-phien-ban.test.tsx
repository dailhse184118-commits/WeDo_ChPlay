import React from 'react';
import { Platform, Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { getAppVersionInfo, type ThongTinPhienBan } from '../../api/app-version';
import { usePhienBan } from '../use-phien-ban';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '1.0.13' } },
}));
jest.mock('../../api/app-version', () => ({ getAppVersionInfo: jest.fn() }));

const mockedHoi = getAppVersionInfo as jest.MockedFunction<typeof getAppVersionInfo>;
const APP_STORE = 'https://apps.apple.com/app/id6700000000';

let queryClient: QueryClient;
let heDieuHanh: jest.ReplaceProperty<typeof Platform.OS> | undefined;

/*
  Hiện kèm `notes` để biết dữ liệu đã về: 'khong-can' cũng là giá trị lúc chưa
  tải xong, nên không chờ `notes` thì kết luận quá sớm.
*/
function HienMuc() {
  const { muc, notes } = usePhienBan();
  return <Text testID="muc">{`${muc}|${notes}`}</Text>;
}

async function mucVoi(thongTin: ThongTinPhienBan) {
  mockedHoi.mockResolvedValue(thongTin);
  const man = await render(
    <QueryClientProvider client={queryClient}>
      <HienMuc />
    </QueryClientProvider>,
  );
  return man;
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(() => {
  queryClient.clear();
  heDieuHanh?.restore();
  heDieuHanh = undefined;
});

describe('usePhienBan', () => {
  it('Android: quá phiên bản tối thiểu thì chặn, như trước', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
    const man = await mucVoi({ latest: '1.0.20', minimum: '1.0.15', notes: 'x', storeUrl: null });

    await waitFor(() => expect(man.getByTestId('muc').props.children).toBe('bat-buoc|x'));
  });

  /*
    iPhone mà máy chủ không chỉ được trang App Store thì không có chỗ nào để
    cập nhật. Chặn lúc đó là khoá người dùng ngoài app.
  */
  it('iPhone thiếu trang App Store: không chặn, không nhắc', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    const man = await mucVoi({ latest: '1.0.20', minimum: '1.0.15', notes: 'x', storeUrl: null });

    await waitFor(() => expect(man.getByTestId('muc').props.children).toBe('khong-can|x'));
  });

  it('iPhone có trang App Store: chặn đúng như Android', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    const man = await mucVoi({ latest: '1.0.20', minimum: '1.0.15', notes: 'x', storeUrl: APP_STORE });

    await waitFor(() => expect(man.getByTestId('muc').props.children).toBe('bat-buoc|x'));
  });

  it('iPhone: máy chủ chưa khai phiên bản iOS (null) thì không nhắc', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    const man = await mucVoi({ latest: null, minimum: null, notes: 'x', storeUrl: APP_STORE });

    await waitFor(() => expect(man.getByTestId('muc').props.children).toBe('khong-can|x'));
  });
});
