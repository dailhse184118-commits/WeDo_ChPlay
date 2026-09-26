import React from 'react';
import { Alert, Linking } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';

import ManTaiKhoan from '../../../app/(tabs)/account/index';
import { datDongYAI } from '../../../lib/api/account';
import { useAuth } from '../../../lib/auth/auth-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import type { UserProfile } from '../../../lib/types';
import { renderScreen } from '../../../test-utils/render';

/*
  Công tắc "Cho phép dùng AI" và các đường pháp lý trên tab Tài khoản.

  Đặt ở đây chứ không cạnh màn hình: mọi tệp dưới `src/app/(tabs)/` đều thành
  một tab, kể cả tệp kiểm thử.
*/

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(async () => ({ type: 'opened' })) }));
jest.mock('../../../lib/api/account', () => ({
  capNhatAnhDaiDien: jest.fn(),
  datDongYAI: jest.fn(),
}));
jest.mock('../../../lib/auth/auth-context');
jest.mock('../../../lib/workspace/workspace-context');
jest.mock('../../../lib/images/anh-dai-dien', () => ({ chonAnhDaiDien: jest.fn() }));

const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;
const mockedDatDongYAI = datDongYAI as jest.MockedFunction<typeof datDongYAI>;
const mockedMoTrang = WebBrowser.openBrowserAsync as jest.MockedFunction<
  typeof WebBrowser.openBrowserAsync
>;

const capNhatHoSo = jest.fn();
const HO_SO: UserProfile = {
  id: 'u1',
  email: 'a@b.c',
  fullName: 'Lê Hữu Đại',
  aiConsentAt: '2026-09-20T10:00:00.000Z',
  termsAcceptedAt: '2026-09-20T10:00:00.000Z',
};

let hopThoai: jest.SpyInstance;

function dangNhap(user: UserProfile) {
  mockedAuth.mockReturnValue({
    status: 'signedIn',
    user,
    signIn: jest.fn(),
    signInWithGoogle: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    capNhatHoSo,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  hopThoai = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  mockedWorkspace.mockReturnValue({ active: { id: 'w1', name: 'Nhóm EXE' } } as never);
  dangNhap(HO_SO);
});

afterEach(() => {
  hopThoai.mockRestore();
});

describe('công tắc Cho phép dùng AI', () => {
  it('phản ánh đúng hồ sơ: đã đồng ý thì bật', async () => {
    const man = await renderScreen(<ManTaiKhoan />);

    expect(man.getByText('Cho phép dùng AI')).toBeTruthy();
    expect(man.getByTestId('account-ai-consent').props.value).toBe(true);
  });

  it('tắt: rút lại ngay trên máy chủ, không hỏi, rồi ghi vào hồ sơ', async () => {
    mockedDatDongYAI.mockResolvedValue({ aiConsentAt: null });
    const man = await renderScreen(<ManTaiKhoan />);

    await fireEvent(man.getByTestId('account-ai-consent'), 'valueChange', false);

    await waitFor(() => expect(capNhatHoSo).toHaveBeenCalledWith({ ...HO_SO, aiConsentAt: null }));
    expect(mockedDatDongYAI).toHaveBeenCalledWith(false);
    expect(hopThoai).not.toHaveBeenCalled();
  });

  it('tắt hỏng: nói rõ, hồ sơ giữ nguyên', async () => {
    mockedDatDongYAI.mockRejectedValue(new Error('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.'));
    const man = await renderScreen(<ManTaiKhoan />);

    await fireEvent(man.getByTestId('account-ai-consent'), 'valueChange', false);

    await waitFor(() =>
      expect(man.getByText('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.')).toBeTruthy(),
    );
    expect(capNhatHoSo).not.toHaveBeenCalled();
  });

  it('bật: đi qua hộp thoại giải thích trước, đồng ý mới lưu', async () => {
    dangNhap({ ...HO_SO, aiConsentAt: null });
    mockedDatDongYAI.mockResolvedValue({ aiConsentAt: '2026-09-26T10:00:00.000Z' });
    const man = await renderScreen(<ManTaiKhoan />);
    expect(man.getByTestId('account-ai-consent').props.value).toBe(false);

    await fireEvent(man.getByTestId('account-ai-consent'), 'valueChange', true);

    expect(hopThoai).toHaveBeenCalledTimes(1);
    expect(hopThoai.mock.calls[0][0]).toBe('Dùng AI để gợi ý công việc?');
    expect(mockedDatDongYAI).not.toHaveBeenCalled();

    const nut = hopThoai.mock.calls[0][2] as Array<{ text: string; onPress?: () => void }>;
    await act(async () => nut.find((n) => n.text === 'Đồng ý')?.onPress?.());

    await waitFor(() =>
      expect(capNhatHoSo).toHaveBeenCalledWith({
        ...HO_SO,
        aiConsentAt: '2026-09-26T10:00:00.000Z',
      }),
    );
    expect(mockedDatDongYAI).toHaveBeenCalledWith(true);
  });

  it('bật rồi bấm "Không, cảm ơn": không lưu gì', async () => {
    dangNhap({ ...HO_SO, aiConsentAt: null });
    const man = await renderScreen(<ManTaiKhoan />);

    await fireEvent(man.getByTestId('account-ai-consent'), 'valueChange', true);
    const nut = hopThoai.mock.calls[0][2] as Array<{ text: string; onPress?: () => void }>;
    await act(async () => nut.find((n) => n.text === 'Không, cảm ơn')?.onPress?.());

    expect(mockedDatDongYAI).not.toHaveBeenCalled();
    expect(capNhatHoSo).not.toHaveBeenCalled();
  });
});

describe('đường pháp lý và hỗ trợ', () => {
  /*
    Apple đòi đường tới chính sách, điều khoản và cách liên hệ phải dễ tìm ngay
    trong app (Guideline 1.2, 1.5, 5.1.1). Bốn dòng này luôn hiện, không phụ
    thuộc biến môi trường nào.
  */
  it('luôn có đủ bốn dòng: quyền riêng tư, điều khoản, hỗ trợ, địa chỉ liên hệ', async () => {
    const man = await renderScreen(<ManTaiKhoan />);

    expect(man.getByText('Chính sách quyền riêng tư')).toBeTruthy();
    expect(man.getByText('Điều khoản sử dụng')).toBeTruthy();
    expect(man.getByText('Hỗ trợ')).toBeTruthy();
    expect(man.getByText('Liên hệ: wedosupport6886@gmail.com')).toBeTruthy();
  });

  it('Điều khoản sử dụng và Chính sách quyền riêng tư mở đúng trang', async () => {
    const man = await renderScreen(<ManTaiKhoan />);

    await fireEvent.press(man.getByTestId('account-terms'));
    await fireEvent.press(man.getByTestId('account-privacy'));

    expect(mockedMoTrang).toHaveBeenNthCalledWith(1, 'https://wedofpt.com.vn/dieu-khoan.html');
    expect(mockedMoTrang.mock.calls[1][0]).toMatch(/privacy\.html$/);
  });

  it('Hỗ trợ mở trang hỗ trợ', async () => {
    const man = await renderScreen(<ManTaiKhoan />);

    await fireEvent.press(man.getByTestId('account-help'));

    expect(mockedMoTrang).toHaveBeenCalledWith('https://wedofpt.com.vn/ho-tro.html');
  });

  it('dòng liên hệ ghi rõ email và mở ứng dụng thư', async () => {
    const moNgoai = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const man = await renderScreen(<ManTaiKhoan />);

    await fireEvent.press(man.getByTestId('account-support'));

    expect(moNgoai).toHaveBeenCalledWith('mailto:wedosupport6886@gmail.com');
    moNgoai.mockRestore();
  });

  it('máy không có ứng dụng thư thì mở trang hỗ trợ', async () => {
    const moNgoai = jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('No handler'));
    const man = await renderScreen(<ManTaiKhoan />);

    await fireEvent.press(man.getByTestId('account-support'));

    await waitFor(() =>
      expect(mockedMoTrang).toHaveBeenCalledWith('https://wedofpt.com.vn/ho-tro.html'),
    );
    moNgoai.mockRestore();
  });
});
