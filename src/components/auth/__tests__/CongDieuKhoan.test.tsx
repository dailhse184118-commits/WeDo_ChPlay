import React from 'react';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Text } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { CongDieuKhoan, canDongYDieuKhoan } from '../CongDieuKhoan';
import { dongYDieuKhoan } from '../../../lib/api/account';
import { useAuth, type AuthState } from '../../../lib/auth/auth-context';
import type { UserProfile } from '../../../lib/types';
import { renderScreen } from '../../../test-utils/render';

jest.mock('../../../lib/auth/auth-context');
jest.mock('../../../lib/api/account', () => ({ dongYDieuKhoan: jest.fn() }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(async () => ({ type: 'opened' })) }));

const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedDongY = dongYDieuKhoan as jest.MockedFunction<typeof dongYDieuKhoan>;

const capNhatHoSo = jest.fn();
const signOut = jest.fn(async () => undefined);

const NGUOI_CU: UserProfile = {
  id: 'u1',
  email: 'a@b.c',
  fullName: 'Lê Hữu Đại',
  termsAcceptedAt: null,
  adultConfirmedAt: null,
  aiConsentAt: null,
};

function dangNhap(user: UserProfile | null, status: AuthState['status'] = 'signedIn') {
  mockedAuth.mockReturnValue({
    status,
    user,
    signIn: jest.fn(),
    signInWithGoogle: jest.fn(),
    signUp: jest.fn(),
    signOut,
    capNhatHoSo,
  });
}

function dung() {
  return renderScreen(
    <CongDieuKhoan>
      <Text>trong app</Text>
    </CongDieuKhoan>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ai phải qua màn đồng ý điều khoản', () => {
  it('máy chủ nói chưa đồng ý (null): chắn cả app', async () => {
    dangNhap(NGUOI_CU);
    const man = await dung();

    expect(man.getByTestId('cong-dieu-khoan')).toBeTruthy();
    expect(man.getByRole('header', { name: 'Điều khoản sử dụng' })).toBeTruthy();
    expect(man.queryByText('trong app')).toBeNull();
  });

  it('đã đồng ý: vào thẳng app', async () => {
    dangNhap({ ...NGUOI_CU, termsAcceptedAt: '2026-09-26T10:00:00.000Z' });
    const man = await dung();

    expect(man.getByText('trong app')).toBeTruthy();
    expect(man.queryByTestId('cong-dieu-khoan')).toBeNull();
  });

  /*
    Máy chủ bản cũ không trả khoá này. Chặn cả trường hợp đó thì mọi người kẹt
    ở màn này mãi, vì máy chủ cũ không có đường đồng ý để bấm qua.
  */
  it('máy chủ cũ không biết tới điều khoản (thiếu khoá): không chắn', async () => {
    const { termsAcceptedAt: _boDi, ...khongCoKhoa } = NGUOI_CU;
    dangNhap(khongCoKhoa);
    const man = await dung();

    expect(man.getByText('trong app')).toBeTruthy();
  });

  it('chưa đăng nhập hay đang khôi phục phiên: để màn đăng nhập tự lo', async () => {
    dangNhap(null, 'signedOut');
    expect((await dung()).getByText('trong app')).toBeTruthy();

    dangNhap(null, 'loading');
    expect((await dung()).getByText('trong app')).toBeTruthy();
  });

  it('canDongYDieuKhoan chỉ đúng khi có người và mốc là null', () => {
    expect(canDongYDieuKhoan(null)).toBe(false);
    expect(canDongYDieuKhoan(NGUOI_CU)).toBe(true);
    expect(canDongYDieuKhoan({ ...NGUOI_CU, termsAcceptedAt: undefined })).toBe(false);
    expect(canDongYDieuKhoan({ ...NGUOI_CU, termsAcceptedAt: '2026-09-26T10:00:00.000Z' })).toBe(
      false,
    );
  });
});

describe('màn đồng ý một lần', () => {
  beforeEach(() => {
    dangNhap(NGUOI_CU);
  });

  it('nút tắt cho tới khi đánh dấu ô; ô không đánh dấu sẵn', async () => {
    const man = await dung();

    expect(man.getByTestId('dong-y-dieu-khoan').props.accessibilityState).toEqual(
      expect.objectContaining({ checked: false }),
    );
    expect(man.getByTestId('cong-dieu-khoan-dong-y').props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );

    await fireEvent.press(man.getByTestId('cong-dieu-khoan-dong-y'));
    expect(mockedDongY).not.toHaveBeenCalled();
  });

  it('đồng ý: lưu lên máy chủ rồi ghép mốc vào hồ sơ, không mất trường nào', async () => {
    mockedDongY.mockResolvedValue({
      termsAcceptedAt: '2026-09-26T10:00:00.000Z',
      adultConfirmedAt: '2026-09-26T10:00:00.000Z',
    });
    const man = await dung();

    await fireEvent.press(man.getByTestId('dong-y-dieu-khoan'));
    await fireEvent.press(man.getByTestId('cong-dieu-khoan-dong-y'));

    await waitFor(() => expect(capNhatHoSo).toHaveBeenCalledTimes(1));
    expect(mockedDongY).toHaveBeenCalledTimes(1);
    expect(capNhatHoSo).toHaveBeenCalledWith({
      ...NGUOI_CU,
      termsAcceptedAt: '2026-09-26T10:00:00.000Z',
      adultConfirmedAt: '2026-09-26T10:00:00.000Z',
    });
  });

  it('lưu hỏng: nói rõ, vẫn ở lại màn này để thử lại', async () => {
    mockedDongY.mockRejectedValue(new Error('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.'));
    const man = await dung();

    await fireEvent.press(man.getByTestId('dong-y-dieu-khoan'));
    await fireEvent.press(man.getByTestId('cong-dieu-khoan-dong-y'));

    await waitFor(() =>
      expect(man.getByText('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.')).toBeTruthy(),
    );
    expect(capNhatHoSo).not.toHaveBeenCalled();
    expect(man.getByTestId('cong-dieu-khoan-dong-y').props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: false }),
    );
  });

  it('không muốn đồng ý thì đăng xuất được', async () => {
    const man = await dung();

    await fireEvent.press(man.getByTestId('cong-dieu-khoan-dang-xuat'));

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(mockedDongY).not.toHaveBeenCalled();
  });
});

/*
  Cổng chỉ có tác dụng khi nó bọc TOÀN BỘ `<Stack>` ở layout gốc — đặt trong một
  nhóm màn thì màn mở từ thông báo hay đường dẫn đi vòng qua được. Kiểm thử màn
  hình giả lập hook nên không bắt được chuyện đó; đọc thẳng tệp layout.
*/
it('layout gốc bọc cả Stack trong cổng điều khoản', () => {
  const layout = readFileSync(join(__dirname, '../../../app/_layout.tsx'), 'utf8');

  expect(layout).toMatch(/<CongDieuKhoan>\s*<Stack\b[^>]*\/>\s*<\/CongDieuKhoan>/);
});
