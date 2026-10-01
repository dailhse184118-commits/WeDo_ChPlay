import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { renderScreen } from '../../../test-utils/render';
import ManGopY from '../feedback';
import { getFeedbackStatus, submitFeedback, type TrangThaiDanhGia } from '../../../lib/api/feedback';

jest.mock('../../../lib/api/feedback');
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

const mockedTrangThai = getFeedbackStatus as jest.MockedFunction<typeof getFeedbackStatus>;
const mockedGui = submitFeedback as jest.MockedFunction<typeof submitFeedback>;

const DA_GUI = {
  id: 'f1',
  rating: 3,
  comment: 'Thiếu chế độ tối, còn lại ổn.',
  createdAt: '2026-09-20T00:00:00.000Z',
  updatedAt: '2026-09-20T00:00:00.000Z',
};

function trangThai(ghiDe: Partial<TrangThaiDanhGia>): TrangThaiDanhGia {
  return { feedback: null, canSubmit: true, locked: false, ...ghiDe };
}

async function moMan() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return renderScreen(
    <QueryClientProvider client={client}>
      <ManGopY />
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

describe('màn góp ý', () => {
  it('đã gửi và còn khoá thì hiện bản đã gửi, không có form', async () => {
    mockedTrangThai.mockResolvedValue(trangThai({ feedback: DA_GUI, canSubmit: false, locked: true }));
    const man = await moMan();

    await waitFor(() => expect(man.getByText('Bạn đã gửi đánh giá')).toBeTruthy());
    expect(man.queryByTestId('nut-gui-gop-y')).toBeNull();
  });

  /*
    Quản trị bấm "Cho phép đánh giá lại" trên web. Trước đây điện thoại đọc
    /feedback/mine — trả bản cũ bất kể đã mở khoá — nên vẫn hiện thẻ khoá và bảo
    người dùng nhắn đội ngũ, trong khi đội ngũ đã mở rồi.
  */
  it('đã được mở khoá thì hiện form, điền sẵn bản cũ để sửa', async () => {
    mockedTrangThai.mockResolvedValue(trangThai({ feedback: DA_GUI, canSubmit: true, locked: false }));
    mockedGui.mockResolvedValue(DA_GUI);
    const man = await moMan();

    await waitFor(() =>
      expect(man.getByTestId('o-noi-dung').props.value).toBe('Thiếu chế độ tối, còn lại ổn.'),
    );
    expect(man.queryByText('Bạn đã gửi đánh giá')).toBeNull();
    expect(man.getByText('Tạm được')).toBeTruthy();

    await fireEvent.press(man.getByTestId('nut-gui-gop-y'));
    await waitFor(() => expect(mockedGui).toHaveBeenCalledWith(3, 'Thiếu chế độ tối, còn lại ổn.'));
  });

  it('chưa gửi lần nào thì form trống', async () => {
    mockedTrangThai.mockResolvedValue(trangThai({}));
    const man = await moMan();

    await waitFor(() => expect(man.getByTestId('nut-gui-gop-y')).toBeTruthy());
    expect(man.getByTestId('o-noi-dung').props.value).toBe('');
  });
});
