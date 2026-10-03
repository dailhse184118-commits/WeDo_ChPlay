import React from 'react';
import { Alert, Platform, Share } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect } from 'expo-router';

import ManDongBoLich from '../calendar-sync';
import { ApiError } from '../../../lib/api/client';
import {
  layDongBoLich,
  taoLinkDongBoLich,
  tatDongBoLich,
  type TrangThaiDongBoLich,
} from '../../../lib/api/dong-bo-lich';
import { renderScreen } from '../../../test-utils/render';

/*
  Màn "Đồng bộ lịch" theo từng trạng thái.

  jest-expo chạy với Platform.OS = 'ios' mặc định, mà màn ẩn hẳn trên iPhone —
  nên mọi ca ở đây tự đặt 'android', trừ ca iPhone.
*/

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  Redirect: jest.fn(() => null),
}));
// Giữ `cauLoiDongBoLich` thật: màn phải hiện đúng câu theo mã lỗi.
jest.mock('../../../lib/api/dong-bo-lich', () => ({
  ...jest.requireActual<typeof import('../../../lib/api/dong-bo-lich')>('../../../lib/api/dong-bo-lich'),
  layDongBoLich: jest.fn(),
  taoLinkDongBoLich: jest.fn(),
  tatDongBoLich: jest.fn(),
}));

const mockedLay = layDongBoLich as jest.MockedFunction<typeof layDongBoLich>;
const mockedTao = taoLinkDongBoLich as jest.MockedFunction<typeof taoLinkDongBoLich>;
const mockedTat = tatDongBoLich as jest.MockedFunction<typeof tatDongBoLich>;
const mockedRedirect = Redirect as unknown as jest.Mock;

const MA_A = 'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-AbCd';
const MA_B = 'ZyXwVuTsRqPoNmLkJiHgFeDcBa9876543210-_ZyXw';
const URL_A = `https://wedofpt.com.vn/lich/${MA_A}.ics`;
const URL_B = `https://wedofpt.com.vn/lich/${MA_B}.ics`;

const MIEN_PHI: TrangThaiDongBoLich = { duocDung: false, coLink: false };
const CHUA_CO_LINK: TrangThaiDongBoLich = { duocDung: true, coLink: false };
const CO_LINK: TrangThaiDongBoLich = {
  duocDung: true,
  coLink: true,
  url: URL_A,
  taoLuc: '2026-10-01T02:00:00.000Z',
  // 03:30 UTC = 10:30 giờ Việt Nam.
  layLanCuoi: '2026-10-02T03:30:00.000Z',
};

const CAU_MIEN_PHI = 'Tính năng của gói Pro và Team.';

let queryClient: QueryClient;
let thayHeDieuHanh: { restore: () => void };

beforeEach(() => {
  jest.clearAllMocks();
  thayHeDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
  /*
    `gcTime: Infinity`: không hẹn giờ dọn cache. Để mặc định thì bộ hẹn giờ 5
    phút giữ tiến trình sống và Jest không thoát khi chạy riêng tệp này.
  */
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
});

afterEach(() => {
  queryClient.clear();
  thayHeDieuHanh.restore();
});

const moMan = () =>
  renderScreen(
    <QueryClientProvider client={queryClient}>
      <ManDongBoLich />
    </QueryClientProvider>,
  );

/** Giả hộp thoại xác nhận: bấm nút "phá huỷ" (Tạo link mới / Tắt đồng bộ). */
function dongYHopThoai() {
  return jest.spyOn(Alert, 'alert').mockImplementation((_tieuDe, _noiDung, nut) => {
    nut?.find((n) => n.style === 'destructive')?.onPress?.();
  });
}

describe('màn Đồng bộ lịch', () => {
  it('đang tải: hiện vòng xoay, chưa có nút nào', async () => {
    mockedLay.mockReturnValue(new Promise(() => undefined));
    const man = await moMan();

    expect(man.getByTestId('dong-bo-lich-dang-tai')).toBeTruthy();
    expect(man.queryByText('Tạo link đồng bộ')).toBeNull();
  });

  it('gói Miễn phí: chỉ một câu, không nút mua, không nút tạo link', async () => {
    mockedLay.mockResolvedValue(MIEN_PHI);
    const man = await moMan();

    expect(await man.findByText(CAU_MIEN_PHI)).toBeTruthy();
    expect(man.queryByText('Tạo link đồng bộ')).toBeNull();
    expect(man.queryByText(/mua|nâng cấp gói/i)).toBeNull();
    // Nút duy nhất là mũi tên Quay lại trên đầu màn.
    expect(man.queryAllByRole('button').map((nut) => nut.props.testID)).toEqual(['header-back']);
  });

  it('gói Miễn phí mà link cũ còn: vẫn tắt được link', async () => {
    mockedLay.mockResolvedValue({ ...CO_LINK, duocDung: false });
    mockedTat.mockResolvedValue(undefined);
    const hoi = dongYHopThoai();
    const man = await moMan();

    await fireEvent.press(await man.findByTestId('nut-tat-dong-bo-lich'));

    await waitFor(() => expect(mockedTat).toHaveBeenCalledTimes(1));
    expect(man.queryByTestId('link-dong-bo-lich')).toBeNull();
    hoi.mockRestore();
  });

  it('được dùng, chưa có link: bấm Tạo link đồng bộ thì hiện link', async () => {
    mockedLay.mockResolvedValue(CHUA_CO_LINK);
    mockedTao.mockResolvedValue({ ...CO_LINK, layLanCuoi: null });
    const man = await moMan();

    await fireEvent.press(await man.findByText('Tạo link đồng bộ'));

    await waitFor(() => expect(man.getByTestId('link-dong-bo-lich').props.children).toBe(URL_A));
    expect(mockedTao).toHaveBeenCalledTimes(1);
    expect(man.getByText('Chưa có ứng dụng lịch nào lấy dữ liệu từ link này.')).toBeTruthy();
  });

  it('có link: hiện link, link webcal, hướng dẫn, cảnh báo và lần cuối lấy theo giờ Việt Nam', async () => {
    mockedLay.mockResolvedValue(CO_LINK);
    const man = await moMan();

    await waitFor(() => expect(man.getByTestId('link-dong-bo-lich').props.children).toBe(URL_A));
    expect(man.getByTestId('link-webcal').props.children).toBe(`webcal://wedofpt.com.vn/lich/${MA_A}.ics`);
    expect(man.getByText(/calendar\.google\.com/)).toBeTruthy();
    expect(man.getByText(/Thêm lịch → Từ URL/)).toBeTruthy();
    expect(man.getByText(/Ai có link này đều xem được lịch của bạn/)).toBeTruthy();
    expect(man.getByTestId('lan-cuoi-lay-lich').props.children).toBe(
      'Lần cuối lịch của bạn lấy dữ liệu: 10:30 02/10/2026',
    );
  });

  it('Chia sẻ link mở bảng chia sẻ của hệ điều hành với đúng link', async () => {
    mockedLay.mockResolvedValue(CO_LINK);
    const chiaSe = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
    const man = await moMan();

    await fireEvent.press(await man.findByText('Chia sẻ link'));

    await waitFor(() => expect(chiaSe).toHaveBeenCalledWith({ title: 'Link lịch WeDo', message: URL_A }));
    chiaSe.mockRestore();
  });

  it('Tạo link mới: hỏi xác nhận rồi thay link đang hiện', async () => {
    mockedLay.mockResolvedValue(CO_LINK);
    mockedTao.mockResolvedValue({ ...CO_LINK, url: URL_B, layLanCuoi: null });
    const hoi = dongYHopThoai();
    const man = await moMan();

    await fireEvent.press(await man.findByText('Tạo link mới'));

    await waitFor(() => expect(man.getByTestId('link-dong-bo-lich').props.children).toBe(URL_B));
    expect(hoi).toHaveBeenCalledTimes(1);
    expect(hoi.mock.calls[0][0]).toBe('Tạo link mới?');
    hoi.mockRestore();
  });

  it('Tạo link mới mà bấm Huỷ: không gọi máy chủ', async () => {
    mockedLay.mockResolvedValue(CO_LINK);
    const hoi = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const man = await moMan();

    await fireEvent.press(await man.findByText('Tạo link mới'));

    expect(hoi).toHaveBeenCalledTimes(1);
    expect(mockedTao).not.toHaveBeenCalled();
    hoi.mockRestore();
  });

  it('Tắt đồng bộ: hỏi xác nhận, tắt xong quay về nút Tạo link đồng bộ', async () => {
    mockedLay.mockResolvedValue(CO_LINK);
    mockedTat.mockResolvedValue(undefined);
    const hoi = dongYHopThoai();
    const man = await moMan();

    await fireEvent.press(await man.findByTestId('nut-tat-dong-bo-lich'));

    expect(await man.findByText('Tạo link đồng bộ')).toBeTruthy();
    expect(mockedTat).toHaveBeenCalledTimes(1);
    expect(hoi.mock.calls[0][0]).toBe('Tắt đồng bộ lịch?');
    expect(man.queryByTestId('link-dong-bo-lich')).toBeNull();
    hoi.mockRestore();
  });

  it('tạo link bị 403 vì gói vừa hết hạn: báo đúng câu và chuyển sang câu giới thiệu gói', async () => {
    mockedLay.mockResolvedValueOnce(CHUA_CO_LINK).mockResolvedValueOnce(MIEN_PHI);
    mockedTao.mockRejectedValue(
      new ApiError('Đồng bộ lịch dành cho gói Pro và Team.', 403, 'CALENDAR_FEED_NOT_IN_PLAN'),
    );
    const man = await moMan();

    await fireEvent.press(await man.findByText('Tạo link đồng bộ'));

    expect(
      await man.findByText('Gói hiện tại của bạn không có đồng bộ lịch. Tính năng này dành cho gói Pro và Team.'),
    ).toBeTruthy();
    expect(await man.findByText(CAU_MIEN_PHI)).toBeTruthy();
    expect(mockedLay).toHaveBeenCalledTimes(2);
  });

  it('tải trạng thái lỗi vì mất mạng: báo câu tiếng Việt, bấm Thử lại thì nạp lại', async () => {
    mockedLay
      .mockRejectedValueOnce(new ApiError('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.', 0))
      .mockResolvedValueOnce(CHUA_CO_LINK);
    const man = await moMan();

    expect(await man.findByText('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.')).toBeTruthy();
    await fireEvent.press(man.getByText('Thử lại'));

    expect(await man.findByText('Tạo link đồng bộ')).toBeTruthy();
  });

  it('iPhone: không gọi máy chủ, không vẽ gì, chuyển về Tài khoản', async () => {
    thayHeDieuHanh.restore();
    thayHeDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    const man = await moMan();

    expect(mockedRedirect).toHaveBeenCalled();
    expect(mockedRedirect.mock.calls[0][0]).toEqual({ href: '/account' });
    expect(mockedLay).not.toHaveBeenCalled();
    expect(man.queryByText('Đồng bộ lịch')).toBeNull();
  });
});
