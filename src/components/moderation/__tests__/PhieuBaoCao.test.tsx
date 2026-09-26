import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { PhieuBaoCao, type DoiTuongBaoCao } from '../PhieuBaoCao';
import { ApiError } from '../../../lib/api/client';
import { reportContent } from '../../../lib/api/moderation';

jest.mock('../../../lib/api/moderation', () => ({
  ...jest.requireActual('../../../lib/api/moderation'),
  reportContent: jest.fn(),
}));

const mockedBaoCao = reportContent as jest.MockedFunction<typeof reportContent>;

const TIN: DoiTuongBaoCao = { targetType: 'PROJECT_MESSAGE', targetId: 'm1', tenNguoi: 'Tuấn' };

let queryClient: QueryClient;

function dung(doiTuong: DoiTuongBaoCao | null = TIN, onDong = jest.fn()) {
  return (
    <QueryClientProvider client={queryClient}>
      <PhieuBaoCao doiTuong={doiTuong} onDong={onDong} />
    </QueryClientProvider>
  );
}

/* React Query v5 gọi `mutationFn(biến, ngữ cảnh)` — chỉ soi đối số đầu. */
function daGui() {
  return mockedBaoCao.mock.calls[0]?.[0];
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  mockedBaoCao.mockResolvedValue({ id: 'r1', status: 'OPEN' });
});

afterEach(() => queryClient.clear());

describe('phiếu báo cáo', () => {
  it('đóng thì không dựng gì', async () => {
    const man = await render(dung(null));
    expect(man.queryByTestId('phieu-bao-cao')).toBeNull();
  });

  it('hiện đủ sáu lý do theo đúng chữ đã hứa trong Điều khoản', async () => {
    const man = await render(dung());

    expect(man.getByText('Báo cáo tin nhắn')).toBeTruthy();
    expect(man.getByText('Vì sao bạn báo cáo tin nhắn này?')).toBeTruthy();
    for (const nhan of [
      'Spam, quảng cáo',
      'Quấy rối, bắt nạt',
      'Thù ghét, phân biệt đối xử',
      'Nội dung tình dục',
      'Bạo lực, đe doạ',
      'Lý do khác',
    ]) {
      expect(man.getByText(nhan)).toBeTruthy();
    }
  });

  it('báo cáo người dùng thì tiêu đề nêu tên người đó', async () => {
    const man = await render(dung({ targetType: 'USER', targetId: 'u2', tenNguoi: 'Tuấn' }));

    expect(man.getByText('Báo cáo Tuấn')).toBeTruthy();
    expect(man.getByText('Vì sao bạn báo cáo người này?')).toBeTruthy();
  });

  it('chưa chọn lý do thì chưa gửi được', async () => {
    const man = await render(dung());

    expect(man.getByTestId('bao-cao-gui').props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(man.getByTestId('bao-cao-gui'));
    expect(mockedBaoCao).not.toHaveBeenCalled();
  });

  it('gửi đúng đối tượng, lý do và ghi chú, rồi cảm ơn ngay trong phiếu', async () => {
    const man = await render(dung());

    await fireEvent.press(man.getByTestId('ly-do-HARASSMENT'));
    await fireEvent.changeText(man.getByTestId('bao-cao-ghi-chu'), 'Chửi bạn trong nhóm');
    await fireEvent.press(man.getByTestId('bao-cao-gui'));

    await waitFor(() => expect(man.getByTestId('bao-cao-da-gui')).toBeTruthy());
    expect(daGui()).toEqual({
      targetType: 'PROJECT_MESSAGE',
      targetId: 'm1',
      reason: 'HARASSMENT',
      note: 'Chửi bạn trong nhóm',
    });
    expect(man.getByText('Đã gửi báo cáo. WeDo sẽ xem xét trong vòng 24 giờ.')).toBeTruthy();
  });

  it('bấm Đóng sau khi gửi thì gọi onDong', async () => {
    const onDong = jest.fn();
    const man = await render(dung(TIN, onDong));

    await fireEvent.press(man.getByTestId('ly-do-SPAM'));
    await fireEvent.press(man.getByTestId('bao-cao-gui'));
    await waitFor(() => expect(man.getByTestId('bao-cao-dong')).toBeTruthy());
    await fireEvent.press(man.getByTestId('bao-cao-dong'));

    expect(onDong).toHaveBeenCalledTimes(1);
  });

  /* 429 là giới hạn 30 báo cáo mỗi ngày, không phải lỗi hỏng — nói thẳng là phải đợi. */
  it('bị giới hạn tần suất thì nói lịch sự là thử lại sau, phiếu vẫn mở', async () => {
    mockedBaoCao.mockRejectedValue(new ApiError('Too Many Requests', 429));
    const man = await render(dung());

    await fireEvent.press(man.getByTestId('ly-do-SPAM'));
    await fireEvent.press(man.getByTestId('bao-cao-gui'));

    await waitFor(() =>
      expect(
        man.getByText('Bạn đã gửi nhiều báo cáo trong 24 giờ qua. Vui lòng thử lại sau.'),
      ).toBeTruthy(),
    );
    expect(man.queryByTestId('bao-cao-da-gui')).toBeNull();
    expect(man.getByTestId('bao-cao-gui')).toBeTruthy();
  });

  it('lỗi khác thì hiện nguyên câu của máy chủ', async () => {
    mockedBaoCao.mockRejectedValue(new ApiError('Bạn không thể báo cáo chính mình.', 400));
    const man = await render(dung());

    await fireEvent.press(man.getByTestId('ly-do-OTHER'));
    await fireEvent.press(man.getByTestId('bao-cao-gui'));

    await waitFor(() => expect(man.getByText('Bạn không thể báo cáo chính mình.')).toBeTruthy());
  });

  /* Lý do của tin trước nằm sẵn ở tin sau là gửi nhầm báo cáo. */
  it('mở phiếu cho tin khác thì xoá lựa chọn cũ', async () => {
    const man = await render(dung());
    await fireEvent.press(man.getByTestId('ly-do-SPAM'));
    await fireEvent.changeText(man.getByTestId('bao-cao-ghi-chu'), 'ghi chú cũ');

    await man.rerender(dung({ targetType: 'PROJECT_MESSAGE', targetId: 'm2' }));

    expect(man.getByTestId('ly-do-SPAM').props.accessibilityState.checked).toBe(false);
    expect(man.getByTestId('bao-cao-ghi-chu').props.value).toBe('');
    expect(man.getByTestId('bao-cao-gui').props.accessibilityState.disabled).toBe(true);
  });
});
