import React from 'react';
import { Alert, Platform } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { renderScreen } from '../../../test-utils/render';
import ManXoaTaiKhoan from '../../../app/account/delete-account';
import { deleteAccount, getDeletionBlockers } from '../../../lib/api/account';
import { useAuth } from '../../../lib/auth/auth-context';

jest.mock('../../../lib/api/account', () => ({
  deleteAccount: jest.fn(),
  getDeletionBlockers: jest.fn(),
  transferWorkspaceOwner: jest.fn(),
}));
jest.mock('../../../lib/auth/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), back: jest.fn(), canGoBack: () => true }),
}));

const mockedBlockers = getDeletionBlockers as jest.MockedFunction<typeof getDeletionBlockers>;
const mockedDelete = deleteAccount as jest.MockedFunction<typeof deleteAccount>;
const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;

let client: QueryClient;
let heDieuHanh: jest.ReplaceProperty<typeof Platform.OS> | undefined;

async function moMan() {
  return await renderScreen(
    <QueryClientProvider client={client}>
      <ManXoaTaiKhoan />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mockedAuth.mockReturnValue({ signOut: jest.fn() } as never);
  mockedBlockers.mockResolvedValue({ canDelete: true, blockers: [] } as never);
});

afterEach(() => {
  heDieuHanh?.restore();
  heDieuHanh = undefined;
  client.clear();
});

describe('màn xoá tài khoản', () => {
  /*
    Apple: người dùng mong mọi dữ liệu gắn với tài khoản bị xoá, kể cả ảnh đã
    chia sẻ. Máy chủ xoá cả tin nhắn riêng, bạn bè và tệp trên kho lưu trữ; danh
    sách phải nói đủ, và iPhone không được nhắc gì tới cửa hàng hay gói trả phí.
  */
  it('iPhone: nói rõ tin nhắn riêng, bạn bè, ảnh và tệp cũng bị xoá, không nhắc cửa hàng hay gói', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    const man = await moMan();

    await waitFor(() => expect(man.getByTestId('delete-account')).toBeTruthy());
    expect(man.getByText('Tin nhắn riêng, danh sách bạn bè, ảnh và tệp bạn đã tải lên')).toBeTruthy();
    expect(man.queryByText(/Google Play|CH Play|App Store|gói|thanh toán/i)).toBeNull();
  });

  it('tải thông tin hỏng: có nút Thử lại, bấm là hỏi lại máy chủ', async () => {
    mockedBlockers.mockRejectedValueOnce(new Error('mạng'));
    const man = await moMan();

    await waitFor(() => expect(man.getByText('Không tải được thông tin tài khoản.')).toBeTruthy());
    expect(man.queryByTestId('delete-account')).toBeNull();

    await fireEvent.press(man.getByTestId('delete-retry'));

    await waitFor(() => expect(man.getByTestId('delete-account')).toBeTruthy());
    expect(mockedBlockers).toHaveBeenCalledTimes(2);
  });

  /*
    Gặp thật 28/09/2026: xoá xong, đăng xuất xoá cache và query trên màn tự tải
    lại bằng phiên đã mất, hiện "Không tải được thông tin tài khoản". Người duyệt
    của Apple sẽ tưởng xoá thất bại.
  */
  it('xoá thành công: đăng xuất xong mới báo "Đã xoá tài khoản"', async () => {
    const thuTu: string[] = [];
    const signOut = jest.fn(async () => {
      thuTu.push('signOut');
    });
    mockedAuth.mockReturnValue({ signOut, status: 'signedIn' } as never);
    mockedDelete.mockResolvedValue({ ok: true });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((tieuDe, _noiDung, nut) => {
      thuTu.push(String(tieuDe));
      // Hộp xác nhận: bấm luôn nút "Xoá tài khoản".
      nut?.find((n) => n.style === 'destructive')?.onPress?.();
    });

    const man = await moMan();
    await waitFor(() => expect(man.getByTestId('delete-account')).toBeTruthy());
    await fireEvent.changeText(man.getByTestId('delete-confirm'), 'XOA');
    await fireEvent.press(man.getByTestId('delete-account'));

    await waitFor(() => expect(thuTu).toContain('Đã xoá tài khoản'));
    expect(thuTu.indexOf('signOut')).toBeLessThan(thuTu.indexOf('Đã xoá tài khoản'));
    alert.mockRestore();
  });

  it('đã đăng xuất thì không tải lại thông tin tài khoản', async () => {
    mockedAuth.mockReturnValue({ signOut: jest.fn(), status: 'signedOut' } as never);

    await moMan();

    expect(mockedBlockers).not.toHaveBeenCalled();
  });
});
