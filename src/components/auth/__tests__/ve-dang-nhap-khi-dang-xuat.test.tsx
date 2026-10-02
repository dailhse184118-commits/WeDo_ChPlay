import React from 'react';
import { render } from '@testing-library/react-native';

import { VeDangNhapKhiDangXuat } from '../VeDangNhapKhiDangXuat';
import { useAuth } from '../../../lib/auth/auth-context';

const mockRouter = { canDismiss: jest.fn(() => true), dismissAll: jest.fn(), replace: jest.fn() };
let mockPathname = '/account/delete-account';

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPathname,
}));
jest.mock('../../../lib/auth/auth-context', () => ({ useAuth: jest.fn() }));

const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function dat(status: 'loading' | 'signedIn' | 'signedOut') {
  mockedAuth.mockReturnValue({ status } as never);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPathname = '/account/delete-account';
  mockRouter.canDismiss.mockReturnValue(true);
});

describe('VeDangNhapKhiDangXuat', () => {
  /*
    Gặp thật 28/09/2026: xoá tài khoản trên iPhone xong vẫn đứng ở màn xoá, vì
    <Redirect> trong (tabs) chỉ chạy khi (tabs) đang được focus.
  */
  it('đang ở màn ngoài (tabs) mà đăng xuất thì gỡ các màn đang chồng và về Đăng nhập', async () => {
    dat('signedIn');
    const man = await render(<VeDangNhapKhiDangXuat />);

    dat('signedOut');
    await man.rerender(<VeDangNhapKhiDangXuat />);

    expect(mockRouter.dismissAll).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/login');
  });

  it('không có màn nào để gỡ thì chỉ chuyển sang Đăng nhập', async () => {
    mockRouter.canDismiss.mockReturnValue(false);
    dat('signedIn');
    const man = await render(<VeDangNhapKhiDangXuat />);

    dat('signedOut');
    await man.rerender(<VeDangNhapKhiDangXuat />);

    expect(mockRouter.dismissAll).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/login');
  });

  it('mở app khi chưa đăng nhập (loading → signedOut) thì để src/app/index.tsx lo, không điều hướng', async () => {
    dat('loading');
    const man = await render(<VeDangNhapKhiDangXuat />);

    dat('signedOut');
    await man.rerender(<VeDangNhapKhiDangXuat />);

    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('đã đứng ở màn Đăng nhập thì không điều hướng thêm', async () => {
    mockPathname = '/login';
    dat('signedIn');
    const man = await render(<VeDangNhapKhiDangXuat />);

    dat('signedOut');
    await man.rerender(<VeDangNhapKhiDangXuat />);

    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
