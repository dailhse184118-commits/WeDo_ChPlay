import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';

import { UpdateBanner } from '../../components/update/UpdateBanner';
import { UpdateGate } from '../../components/update/UpdateGate';
import { KhongTaiDuocKhongGian } from '../../components/workspace/KhongTaiDuocKhongGian';
import { WorkspaceSwitcher } from '../../components/workspace/WorkspaceSwitcher';
import { XuatBaoCao } from '../../components/dong-gop/XuatBaoCao';
import { ApiError } from '../../lib/api/client';
import { xinLinkBaoCao } from '../../lib/api/bao-cao';
import { listProjects } from '../../lib/api/projects';
import { cauLoiBaoCao } from '../../lib/bao-cao';
import { chonTaiLieu } from '../../lib/files/pick-documents';
import { planReminders } from '../../lib/notifications/scheduler';
import { chuNutCapNhat } from '../../lib/version/mo-cua-hang';
import { chuVietConSot } from '../chu-viet-con-sot';
import { dichThongBaoLoi } from '../loi';
import { datNgonNguChoKiemThu } from '../ngon-ngu';
import { tuDienLoiMang } from '../tu-dien/loi-mang';

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('../../lib/version/bo-qua', () => ({
  daBoQua: jest.fn(async () => false),
  ghiNhoBoQua: jest.fn(async () => undefined),
}));
jest.mock('../../lib/api/bao-cao', () => ({ xinLinkBaoCao: jest.fn() }));
jest.mock('../../lib/api/projects', () => ({ listProjects: jest.fn() }));
jest.mock('../../lib/workspace/workspace-context', () => ({
  useWorkspace: () => ({ refresh: jest.fn(async () => undefined) }),
}));

type Nut = { props?: Record<string, unknown>; children?: unknown[] | null };
function gomChu(nut: unknown, ra: string[] = []): string[] {
  if (typeof nut === 'string') ra.push(nut);
  else if (nut && typeof nut === 'object') {
    const { props, children } = nut as Nut;
    for (const khoa of ['accessibilityLabel', 'placeholder', 'label', 'title']) {
      const v = props?.[khoa];
      if (typeof v === 'string') ra.push(v);
    }
    (children ?? []).forEach((con) => gomChu(con, ra));
  }
  return ra;
}
const cay = (man: { toJSON: () => unknown }) => {
  const goc = man.toJSON();
  return JSON.stringify((Array.isArray(goc) ? goc : [goc]).flatMap((n) => gomChu(n)));
};

beforeEach(() => {
  jest.clearAllMocks();
  datNgonNguChoKiemThu('en');
});
afterEach(() => datNgonNguChoKiemThu('vi'));

describe('câu lỗi của lớp mạng: bản tiếng Việt khớp nguyên văn với bảng dịch của loi.ts', () => {
  const vi = tuDienLoiMang.vi;
  const en = tuDienLoiMang.en;
  const dich = (cau: string) => dichThongBaoLoi(new Error(cau), 'dự phòng', 'en');

  it('câu cố định', () => {
    for (const khoa of ['khongKetNoi', 'khongGuiDuocTep', 'lyDoTuChoiNgan', 'chuaChonTep', 'lyDoTraLaiNgan'] as const) {
      expect(dich(vi[khoa])).toBe(en[khoa]);
    }
  });

  it('câu có mã trạng thái', () => {
    for (const khoa of ['mayChuBan', 'mayChuTraLoi', 'giaHanLoi'] as const) {
      expect(dich(vi[khoa](502))).toBe(en[khoa](502));
    }
  });
});

describe('lời nhắc đặt lịch trên máy', () => {
  const viec = (ten: string) =>
    ({
      id: 't1',
      title: ten,
      status: 'TODO',
      assigneeId: 'u1',
      dueDate: '2026-10-12T10:00:00.000Z',
    }) as never;
  const bayGio = new Date('2026-10-09T10:00:00.000Z');

  it('dựng theo ngôn ngữ đang dùng lúc đặt lịch', () => {
    const en = planReminders([viec('Report')], 'u1', bayGio);
    expect(en.map((p) => [p.title, p.body])).toEqual([
      ['Due soon', '"Report" is due in 24 hours.'],
      ['Due today', '"Report" is due now.'],
    ]);

    datNgonNguChoKiemThu('vi');
    const vi = planReminders([viec('Báo cáo')], 'u1', bayGio);
    expect(vi.map((p) => [p.title, p.body])).toEqual([
      ['Sắp đến hạn', '"Báo cáo" đến hạn sau 24 giờ nữa.'],
      ['Đến hạn hôm nay', '"Báo cáo" đến hạn bây giờ.'],
    ]);
  });
});

describe('báo cáo đóng góp', () => {
  it('câu lỗi theo mã, theo trạng thái và câu lạ', () => {
    expect(cauLoiBaoCao(new ApiError('x', 400, 'REPORT_TOO_LARGE'))).toMatch(/too large to export on a phone/);
    expect(cauLoiBaoCao(new ApiError('x', 404))).toBe('Project not found, or you’re no longer in this project.');
    expect(cauLoiBaoCao(new ApiError('x', 429))).toBe('You’re exporting too fast. Wait a minute and try again.');
    expect(cauLoiBaoCao(new ApiError(tuDienLoiMang.vi.khongKetNoi, 0))).toBe(tuDienLoiMang.en.khongKetNoi);
    expect(cauLoiBaoCao(new Error('lạ'))).toBe('Couldn’t open the report. Please try again in a few minutes.');
    expect(cauLoiBaoCao(new Error('lạ'), 'vi')).toBe('Không mở được báo cáo. Thử lại sau ít phút.');
  });

  it('khối xuất báo cáo dựng ở tiếng Anh, lỗi hiện tiếng Anh', async () => {
    (listProjects as jest.Mock).mockResolvedValue([{ id: 'p1', name: 'Capstone' }]);
    (xinLinkBaoCao as jest.Mock).mockRejectedValue(new ApiError('x', 429));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const man = await render(
      <QueryClientProvider client={queryClient}>
        <XuatBaoCao workspaceId="w1" />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(man.getByText('Capstone')).toBeTruthy());
    expect(man.getByText('Export contribution report')).toBeTruthy();
    expect(man.getByText('Project')).toBeTruthy();
    expect(man.getByText('Format')).toBeTruthy();
    await fireEvent.press(man.getByText('Export report'));
    await waitFor(() => expect(man.getByText('You’re exporting too fast. Wait a minute and try again.')).toBeTruthy());
    expect(chuVietConSot(cay(man))).toEqual([]);
    queryClient.clear();
  });

  it('khối xuất báo cáo khi chưa có dự án', async () => {
    (listProjects as jest.Mock).mockResolvedValue([]);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const man = await render(
      <QueryClientProvider client={queryClient}>
        <XuatBaoCao workspaceId="w1" />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(man.getByText('This workspace doesn’t have any projects yet.')).toBeTruthy());
    queryClient.clear();
  });
});

describe('nhắc cập nhật, màn chặn, không gian làm việc', () => {
  it('nút cập nhật theo nền tảng và ngôn ngữ', () => {
    const android = jest.replaceProperty(Platform, 'OS', 'android');
    expect(chuNutCapNhat()).toBe('Open Google Play to update');
    expect(chuNutCapNhat('vi')).toBe('Mở CH Play để cập nhật');
    android.restore();
    const ios = jest.replaceProperty(Platform, 'OS', 'ios');
    expect(chuNutCapNhat()).toBe('Open the App Store to update');
    expect(chuNutCapNhat('vi')).toBe('Mở App Store để cập nhật');
    ios.restore();
  });

  it('dải băng nhắc cập nhật', async () => {
    const android = jest.replaceProperty(Platform, 'OS', 'android');
    const man = await render(<UpdateBanner phienBanMoi="1.0.16" notes="" />);
    await waitFor(() => expect(man.getByText('Update available')).toBeTruthy());
    expect(man.getByText('A new version of WeDo is available.')).toBeTruthy();
    expect(man.getByText('Update')).toBeTruthy();
    expect(man.getByText('Later')).toBeTruthy();
    expect(man.getByLabelText('Dismiss this update reminder')).toBeTruthy();
    expect(chuVietConSot(cay(man))).toEqual([]);
    android.restore();
  });

  it('màn chặn cập nhật', async () => {
    const android = jest.replaceProperty(Platform, 'OS', 'android');
    const man = await render(<UpdateGate notes="" />);
    expect(man.getByText('WeDo needs an update')).toBeTruthy();
    expect(man.getByText('Open Google Play to update')).toBeTruthy();
    expect(chuVietConSot(cay(man))).toEqual([]);
    android.restore();
  });

  it('màn không kết nối được máy chủ', async () => {
    const man = await render(<KhongTaiDuocKhongGian />);
    expect(man.getByText('Can’t reach the server')).toBeTruthy();
    expect(man.getByText('Try again')).toBeTruthy();
    expect(chuVietConSot(cay(man))).toEqual([]);
  });

  it('bảng chọn không gian làm việc', async () => {
    const man = await render(
      <WorkspaceSwitcher
        visible
        workspaces={[{ id: 'w1', name: 'Capstone team' } as never]}
        activeId="w1"
        onSelect={jest.fn()}
        onCreate={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );
    expect(man.getByText('Workspaces')).toBeTruthy();
    expect(man.getByText('New workspace')).toBeTruthy();
    expect(man.getByLabelText('Create a new workspace')).toBeTruthy();
    expect(chuVietConSot(cay(man))).toEqual([]);
  });
});

describe('chọn tệp nộp bài', () => {
  it('lỗi quá số tệp và quá dung lượng bằng tiếng Anh, giữ nguyên câu khi ở tiếng Việt', async () => {
    const mocked = DocumentPicker.getDocumentAsync as jest.Mock;
    mocked.mockResolvedValue({
      canceled: false,
      assets: Array.from({ length: 11 }, (_, i) => ({ uri: `f${i}`, name: `f${i}.pdf`, size: 1 })),
    });
    await expect(chonTaiLieu()).rejects.toThrow('You can submit up to 10 files at a time.');

    mocked.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'f', name: 'report.pdf', size: 21 * 1024 * 1024 }],
    });
    await expect(chonTaiLieu()).rejects.toThrow('"report.pdf" is over 20 MB, so it can’t be submitted.');

    datNgonNguChoKiemThu('vi');
    await expect(chonTaiLieu()).rejects.toThrow('Tệp "report.pdf" nặng quá 20MB nên không nộp được.');
  });
});
