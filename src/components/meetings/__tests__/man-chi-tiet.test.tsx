import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { renderScreen } from '../../../test-utils/render';
import ManChiTietHop from '../../../app/(tabs)/meetings/[id]';
import { chiTietCuocHop, moPhongHop, type CuocHop } from '../../../lib/api/meetings';

jest.mock('../../../lib/api/meetings');

const mockedRouter = {
  replace: jest.fn(),
  push: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
  canGoBack: () => true,
};
let mockParams: Record<string, string> = { id: 'm-1' };
jest.mock('expo-router', () => ({
  useRouter: () => mockedRouter,
  useLocalSearchParams: () => mockParams,
  // Chạy hiệu ứng ngay, như lúc màn đang được focus.
  useFocusEffect: (hieuUng: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(hieuUng, [hieuUng]);
  },
}));

const mockedChiTiet = chiTietCuocHop as jest.MockedFunction<typeof chiTietCuocHop>;
const mockedMoPhong = moPhongHop as jest.MockedFunction<typeof moPhongHop>;

const HOP: CuocHop = {
  id: 'm-1',
  title: 'Chốt nội dung chương 2',
  startTime: '2026-09-25T13:00:00.000Z',
  status: 'SCHEDULED',
  workspaceId: 'w-1',
  projectId: 'p-1',
  project: { id: 'p-1', name: 'Đồ án thiện nguyện' },
};

async function moMan(hop: Partial<CuocHop> = {}) {
  mockedChiTiet.mockResolvedValue({ ...HOP, ...hop });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const man = await renderScreen(
    <QueryClientProvider client={client}>
      <ManChiTietHop />
    </QueryClientProvider>,
  );
  await waitFor(() => man.getByTestId('meeting-title'));
  return man;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { id: 'm-1' };
  jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
});

describe('màn chi tiết cuộc họp', () => {
  it('hiện tiêu đề và trạng thái bằng tiếng Việt', async () => {
    const man = await moMan();
    expect(man.getByTestId('meeting-title').props.children).toBe('Chốt nội dung chương 2');
    expect(man.getByTestId('meeting-status').props.children).toBe('Đã lên lịch');
  });

  it('mở phòng bằng trình duyệt của máy', async () => {
    mockedMoPhong.mockResolvedValue({ ...HOP, roomUrl: 'https://wedo.daily.co/abc' });

    const man = await moMan();
    await fireEvent.press(man.getByTestId('meeting-join'));

    await waitFor(() => expect(Linking.openURL).toHaveBeenCalledWith('https://wedo.daily.co/abc'));
  });

  /*
    Máy chủ trả về thành công mà thiếu `roomUrl` là chuyện có thật khi phòng
    đang được dựng. Im lặng ở đây thì người dùng bấm nút, thấy nút quay xong,
    rồi không có gì xảy ra — và họ sẽ bấm tiếp.
  */
  it('nói rõ khi máy chủ chưa trả về đường vào phòng', async () => {
    mockedMoPhong.mockResolvedValue({ ...HOP, roomUrl: null });

    const man = await moMan();
    await fireEvent.press(man.getByTestId('meeting-join'));

    await waitFor(() => expect(man.getByText(/chưa trả về đường vào phòng/)).toBeTruthy());
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it('nói rõ khi máy không mở được đường dẫn', async () => {
    mockedMoPhong.mockResolvedValue({ ...HOP, roomUrl: 'https://wedo.daily.co/abc' });
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);

    const man = await moMan();
    await fireEvent.press(man.getByTestId('meeting-join'));

    await waitFor(() => expect(man.getByText(/không mở được đường dẫn/)).toBeTruthy());
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  /*
    Câu từ chối của máy chủ đã là tiếng Việt và nói rõ lý do — "Cuộc họp đã kết
    thúc", "Cuộc họp đã bị hủy". Thay bằng một câu chung chung là vứt đi thông
    tin duy nhất giúp người dùng hiểu chuyện gì đang xảy ra.
  */
  it('hiện nguyên câu từ chối của máy chủ', async () => {
    mockedMoPhong.mockRejectedValue(new Error('Cuộc họp đã kết thúc'));

    const man = await moMan();
    await fireEvent.press(man.getByTestId('meeting-join'));

    await waitFor(() => expect(man.getByText('Cuộc họp đã kết thúc')).toBeTruthy());
  });

  it('giấu nút vào phòng khi cuộc họp đã xong hoặc đã huỷ', async () => {
    const xong = await moMan({ status: 'COMPLETED' });
    expect(xong.queryByTestId('meeting-join')).toBeNull();

    const huy = await moMan({ status: 'CANCELLED' });
    expect(huy.queryByTestId('meeting-join')).toBeNull();
  });

  it('hiện hạng mục hành động kèm dấu đã thành công việc', async () => {
    const man = await moMan({
      actionItems: [
        {
          id: 'a-1',
          title: 'Gửi bản nháp cho cả nhóm',
          status: 'ACCEPTED',
          assignee: { id: 'u-2', fullName: 'Trần Thảo Quyên', email: 'q@f.edu.vn' },
          task: { id: 't-1', title: 'Gửi bản nháp', status: 'IN_PROGRESS' },
        },
      ],
    });

    expect(man.getByText('Gửi bản nháp cho cả nhóm')).toBeTruthy();
    expect(man.getByText(/đã thành công việc/)).toBeTruthy();
  });

  it('báo rõ khi không tìm thấy hoặc không có quyền xem', async () => {
    mockedChiTiet.mockRejectedValue(new Error('Không tìm thấy cuộc họp'));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const man = await renderScreen(
      <QueryClientProvider client={client}>
        <ManChiTietHop />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(man.getByText(/không có quyền xem/)).toBeTruthy());
  });

  /*
    Màn này nằm trong nhóm (tabs). Bộ điều hướng tab mặc định quay lại TAB ĐẦU
    TIÊN — ở app này là Trò chuyện. `router.back()` ở đây là văng người dùng
    sang màn chat. Phải điều hướng thẳng tới đúng chỗ họ vừa rời.
  */
  it('quay lại danh sách cuộc họp, không dùng lịch sử tab', async () => {
    const man = await moMan();
    await fireEvent.press(man.getByLabelText('Quay lại'));

    expect(mockedRouter.navigate).toHaveBeenCalledWith('/meetings');
    expect(mockedRouter.back).not.toHaveBeenCalled();
  });

  it('mở từ tab Lịch thì quay về Lịch', async () => {
    mockParams = { id: 'm-1', tu: 'lich' };
    const man = await moMan();
    await fireEvent.press(man.getByLabelText('Quay lại'));

    expect(mockedRouter.navigate).toHaveBeenCalledWith('/calendar');
  });
});
