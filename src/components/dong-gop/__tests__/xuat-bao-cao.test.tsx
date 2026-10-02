import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';

import { XuatBaoCao } from '../XuatBaoCao';
import { listProjects } from '../../../lib/api/projects';
import { xinLinkBaoCao } from '../../../lib/api/bao-cao';
import { ApiError } from '../../../lib/api/client';
import { renderScreen } from '../../../test-utils/render';
import type { Project } from '../../../lib/types';

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('../../../lib/api/projects', () => ({ listProjects: jest.fn() }));
jest.mock('../../../lib/api/bao-cao', () => ({ xinLinkBaoCao: jest.fn() }));

const mockedDuAn = listProjects as jest.MockedFunction<typeof listProjects>;
const mockedLink = xinLinkBaoCao as jest.MockedFunction<typeof xinLinkBaoCao>;
const mockedMo = WebBrowser.openBrowserAsync as jest.MockedFunction<typeof WebBrowser.openBrowserAsync>;

const duAn = (id: string, name: string) =>
  ({
    id,
    name,
    workspaceId: 'w1',
    status: 'ACTIVE',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  }) as Project;
const URL_TAI = 'https://api.wedo.test/contribution-report/download?token=abc';

let queryClient: QueryClient;

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mockedDuAn.mockResolvedValue([duAn('p1', 'EXE201'), duAn('p2', 'Đồ án môn học')]);
  mockedLink.mockResolvedValue({ url: URL_TAI, expiresAt: '2026-10-02T03:05:00.000Z' });
  mockedMo.mockResolvedValue({ type: 'opened' } as never);
});

afterEach(() => {
  queryClient.clear();
});

const ve = () =>
  renderScreen(
    <QueryClientProvider client={queryClient}>
      <XuatBaoCao workspaceId="w1" />
    </QueryClientProvider>,
  );

describe('XuatBaoCao', () => {
  it('mặc định dự án đầu và PDF; bấm Xuất báo cáo thì xin link rồi mở trình duyệt', async () => {
    const man = await ve();
    await waitFor(() => expect(man.getByText('EXE201')).toBeTruthy());

    await fireEvent.press(man.getByText('Xuất báo cáo'));

    await waitFor(() => expect(mockedMo).toHaveBeenCalledWith(URL_TAI));
    expect(mockedLink).toHaveBeenCalledWith('p1', 'pdf');
    expect(mockedDuAn).toHaveBeenCalledWith('w1');
  });

  it('chọn dự án khác và Excel', async () => {
    const man = await ve();
    await waitFor(() => expect(man.getByText('Đồ án môn học')).toBeTruthy());

    await fireEvent.press(man.getByText('Đồ án môn học'));
    await fireEvent.press(man.getByText('Excel'));
    await fireEvent.press(man.getByText('Xuất báo cáo'));

    await waitFor(() => expect(mockedLink).toHaveBeenCalledWith('p2', 'xlsx'));
  });

  it('lỗi máy chủ hiện câu tiếng Việt theo mã, không mở trình duyệt', async () => {
    mockedLink.mockRejectedValue(new ApiError('Báo cáo có hơn 3.000 việc.', 413, 'REPORT_TOO_LARGE'));
    const man = await ve();
    await waitFor(() => expect(man.getByText('EXE201')).toBeTruthy());

    await fireEvent.press(man.getByText('Xuất báo cáo'));

    expect(await man.findByText(/quá lớn để xuất trên điện thoại/)).toBeTruthy();
    expect(mockedMo).not.toHaveBeenCalled();
  });

  it('mất mạng: hiện câu kết nối của app', async () => {
    mockedLink.mockRejectedValue(new ApiError('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.', 0));
    const man = await ve();
    await waitFor(() => expect(man.getByText('EXE201')).toBeTruthy());

    await fireEvent.press(man.getByText('Xuất báo cáo'));

    expect(await man.findByText('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.')).toBeTruthy();
  });

  it('không gian chưa có dự án: báo rõ, không có nút xuất', async () => {
    mockedDuAn.mockResolvedValue([]);
    const man = await ve();

    expect(await man.findByText('Không gian này chưa có dự án nào.')).toBeTruthy();
    expect(man.queryByText('Xuất báo cáo')).toBeNull();
  });
});
