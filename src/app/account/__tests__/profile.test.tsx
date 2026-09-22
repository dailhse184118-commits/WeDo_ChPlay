import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { renderScreen } from '../../../test-utils/render';
import ManThongTinCaNhan from '../profile';
import { capNhatThongTinCaNhan } from '../../../lib/api/account';
import { useAuth } from '../../../lib/auth/auth-context';

jest.mock('../../../lib/api/account');
jest.mock('../../../lib/auth/auth-context');

const mockedRouter = { replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => true };
jest.mock('expo-router', () => ({
  useRouter: () => mockedRouter,
}));

const mockedLuu = capNhatThongTinCaNhan as jest.MockedFunction<typeof capNhatThongTinCaNhan>;
const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;

/*
  React Query v5 gọi `mutationFn(variables, context)` — tham số thứ hai là
  `{ client, meta, mutationKey }` của chính thư viện. Nên `toHaveBeenCalledWith`
  luôn trượt. Chỉ soi đối số ĐẦU, thứ duy nhất màn hình này quyết định.
*/
function thamSoDaGui() {
  return mockedLuu.mock.calls[0]?.[0];
}

const HO_SO = {
  id: 'u-1',
  email: 'dai@fpt.edu.vn',
  fullName: 'Lê Hữu Đại',
  phone: '0900000000',
  dob: '1999-08-14T00:00:00.000Z',
  avatarUrl: null,
};

const capNhatHoSo = jest.fn();

async function moMan(hoSo: Partial<typeof HO_SO> = {}) {
  mockedAuth.mockReturnValue({ user: { ...HO_SO, ...hoSo }, capNhatHoSo } as never);
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return await renderScreen(
    <QueryClientProvider client={client}>
      <ManThongTinCaNhan />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedLuu.mockResolvedValue(HO_SO as never);
});

describe('màn thông tin cá nhân', () => {
  it('điền sẵn hồ sơ hiện tại, ngày sinh hiện theo dd/mm/yyyy', async () => {
    const man = await moMan();
    expect(man.getByTestId('profile-fullname').props.value).toBe('Lê Hữu Đại');
    expect(man.getByTestId('profile-phone').props.value).toBe('0900000000');
    expect(man.getByTestId('profile-dob').props.value).toBe('14/08/1999');
    expect(man.getByTestId('profile-email').props.children).toBe('dai@fpt.edu.vn');
  });

  /*
    Mở màn ra rồi bấm Lưu theo phản xạ là một lượt gọi máy chủ thừa, và nó hiện
    "Đã lưu" cho một việc chẳng xảy ra.
  */
  it('khoá nút Lưu khi chưa sửa gì', async () => {
    const man = await moMan();
    expect(man.getByTestId('profile-save').props.accessibilityState.disabled).toBe(true);
  });

  it('mở khoá nút Lưu ngay khi có thay đổi', async () => {
    const man = await moMan();
    await fireEvent.changeText(man.getByTestId('profile-fullname'), 'Lê Hữu Đại B');
    expect(man.getByTestId('profile-save').props.accessibilityState.disabled).toBe(false);
  });

  it('gửi ngày sinh dạng yyyy-mm-dd, không phải dd/mm/yyyy', async () => {
    const man = await moMan();
    await fireEvent.changeText(man.getByTestId('profile-dob'), '01012000');
    await fireEvent.press(man.getByTestId('profile-save'));

    await waitFor(() => expect(mockedLuu).toHaveBeenCalled());
    expect(thamSoDaGui()).toEqual({
      fullName: 'Lê Hữu Đại',
      phone: '0900000000',
      dob: '2000-01-01',
    });
  });

  it('tự chèn dấu gạch trong lúc gõ ngày', async () => {
    const man = await moMan();
    await fireEvent.changeText(man.getByTestId('profile-dob'), '01012000');
    expect(man.getByTestId('profile-dob').props.value).toBe('01/01/2000');
  });

  it('xoá trống ô ngày sinh thì gửi null để gỡ hẳn', async () => {
    const man = await moMan();
    await fireEvent.changeText(man.getByTestId('profile-dob'), '');
    await fireEvent.press(man.getByTestId('profile-save'));

    await waitFor(() => expect(mockedLuu).toHaveBeenCalled());
    expect(thamSoDaGui()).toEqual(expect.objectContaining({ dob: null }));
  });

  it('chặn ngày không có trên lịch và không gọi máy chủ', async () => {
    const man = await moMan();
    await fireEvent.changeText(man.getByTestId('profile-dob'), '31022025');
    await fireEvent.press(man.getByTestId('profile-save'));

    await waitFor(() => expect(man.getByText(/không có trên lịch/)).toBeTruthy());
    expect(mockedLuu).not.toHaveBeenCalled();
  });

  it('chặn họ tên để trống và không gọi máy chủ', async () => {
    const man = await moMan();
    await fireEvent.changeText(man.getByTestId('profile-fullname'), '   ');
    await fireEvent.press(man.getByTestId('profile-save'));

    await waitFor(() => expect(man.getByText(/không được để trống/)).toBeTruthy());
    expect(mockedLuu).not.toHaveBeenCalled();
  });

  it('cắt khoảng trắng thừa trước khi gửi', async () => {
    const man = await moMan();
    await fireEvent.changeText(man.getByTestId('profile-fullname'), '  Trần Gia Bảo  ');
    await fireEvent.press(man.getByTestId('profile-save'));

    await waitFor(() => expect(mockedLuu).toHaveBeenCalled());
    expect(thamSoDaGui()).toEqual(expect.objectContaining({ fullName: 'Trần Gia Bảo' }));
  });

  /*
    Hồ sơ mới phải chảy ngược vào AuthContext, nếu không thì tên trên thẻ danh
    tính ở màn Tài khoản vẫn là tên cũ cho tới lần mở lại app.
  */
  it('đẩy hồ sơ mới vào AuthContext sau khi lưu', async () => {
    const hoSoMoi = { ...HO_SO, fullName: 'Trần Gia Bảo' };
    mockedLuu.mockResolvedValue(hoSoMoi as never);

    const man = await moMan();
    await fireEvent.changeText(man.getByTestId('profile-fullname'), 'Trần Gia Bảo');
    await fireEvent.press(man.getByTestId('profile-save'));

    await waitFor(() => expect(capNhatHoSo).toHaveBeenCalledWith(hoSoMoi));
    expect(man.getByTestId('profile-saved')).toBeTruthy();
  });

  it('hiện lỗi máy chủ thay vì im lặng', async () => {
    mockedLuu.mockRejectedValue(new Error('Mất mạng'));

    const man = await moMan();
    await fireEvent.changeText(man.getByTestId('profile-fullname'), 'Ai đó');
    await fireEvent.press(man.getByTestId('profile-save'));

    await waitFor(() => expect(man.getByText('Mất mạng')).toBeTruthy());
    expect(capNhatHoSo).not.toHaveBeenCalled();
  });

  it('mở được với hồ sơ chưa có số điện thoại và ngày sinh', async () => {
    const man = await moMan({ phone: null as never, dob: null as never });
    expect(man.getByTestId('profile-phone').props.value).toBe('');
    expect(man.getByTestId('profile-dob').props.value).toBe('');
  });
});
