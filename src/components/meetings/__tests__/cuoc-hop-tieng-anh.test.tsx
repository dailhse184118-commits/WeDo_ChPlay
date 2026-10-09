import React from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { renderScreen } from '../../../test-utils/render';
import ManDanhSachHop from '../../../app/(tabs)/meetings/index';
import ManChiTietHop from '../../../app/(tabs)/meetings/[id]';
import ManTaoCuocHop from '../../../app/(tabs)/meetings/new';
import ManLich from '../../../app/(tabs)/calendar/index';
import ManDongBoLich from '../../../app/account/calendar-sync';
import { ApiError } from '../../../lib/api/client';
import { getCalendar, type MucLich } from '../../../lib/api/calendar';
import {
  cauLoiDongBoLich,
  layDongBoLich,
  taoLinkDongBoLich,
  tatDongBoLich,
} from '../../../lib/api/dong-bo-lich';
import {
  chiTietCuocHop,
  danhSachCuocHop,
  moPhongHop,
  taoCuocHop,
  type CuocHop,
} from '../../../lib/api/meetings';
import { listProjects } from '../../../lib/api/projects';
import { nhanNgay, nhomTheoNgay } from '../../../lib/calendar/nhom-theo-ngay';
import { ghepNgayGio } from '../../../lib/meetings/thoi-diem';
import { khoangGio, tenTrangThai } from '../../../lib/meetings/sap-xep';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { chuVietConSot } from '../../../i18n/chu-viet-con-sot';
import { datNgonNguChoKiemThu } from '../../../i18n/ngon-ngu';
import type { Project } from '../../../lib/types';

/*
  Cuộc họp, Lịch và Đồng bộ lịch ở tiếng Anh. Không còn chữ tiếng Việt nào hiện
  ra, trừ tiêu đề, nội dung dự kiến, tóm tắt, quyết định, hạng mục, tên người và
  tên dự án (dữ liệu của người dùng).
*/

jest.mock('../../../lib/api/meetings');
jest.mock('../../../lib/api/projects');
jest.mock('../../../lib/workspace/workspace-context');
jest.mock('../../../lib/api/calendar', () => ({
  ...jest.requireActual('../../../lib/api/calendar'),
  getCalendar: jest.fn(),
}));
jest.mock('../../../lib/api/dong-bo-lich', () => ({
  ...jest.requireActual<typeof import('../../../lib/api/dong-bo-lich')>('../../../lib/api/dong-bo-lich'),
  layDongBoLich: jest.fn(),
  taoLinkDongBoLich: jest.fn(),
  tatDongBoLich: jest.fn(),
}));

const mockRouter = {
  navigate: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: () => true,
};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ id: 'm-1' }),
  Redirect: jest.fn(() => null),
  useFocusEffect: (hieuUng: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(hieuUng, [hieuUng]);
  },
}));

const mockedDanhSach = danhSachCuocHop as jest.MockedFunction<typeof danhSachCuocHop>;
const mockedChiTiet = chiTietCuocHop as jest.MockedFunction<typeof chiTietCuocHop>;
const mockedMoPhong = moPhongHop as jest.MockedFunction<typeof moPhongHop>;
const mockedTao = taoCuocHop as jest.MockedFunction<typeof taoCuocHop>;
const mockedDuAn = listProjects as jest.MockedFunction<typeof listProjects>;
const mockedLich = getCalendar as jest.MockedFunction<typeof getCalendar>;
const mockedLay = layDongBoLich as jest.MockedFunction<typeof layDongBoLich>;
const mockedTaoLink = taoLinkDongBoLich as jest.MockedFunction<typeof taoLinkDongBoLich>;
const mockedTat = tatDongBoLich as jest.MockedFunction<typeof tatDongBoLich>;
const mockedWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;

const TEN_HOP = 'Chốt nội dung chương 2';
const TEN_DU_AN = 'Đồ án thiện nguyện';
const DU_LIEU = [TEN_HOP, TEN_DU_AN, 'Rà slide', 'Chốt đề tài', 'Minh Anh', 'Nộp slide', 'Lớp EXE201', 'Thiếu số liệu'];

// 13:00 UTC = 20:00 giờ Việt Nam, thứ Sáu 25/09/2026.
const HOP: CuocHop = {
  id: 'm-1',
  title: TEN_HOP,
  startTime: '2026-09-25T13:00:00.000Z',
  endTime: '2026-09-25T14:30:00.000Z',
  status: 'SCHEDULED',
  workspaceId: 'w1',
  projectId: 'p1',
  project: { id: 'p1', name: TEN_DU_AN },
};

const DU_AN: Project = {
  id: 'p1',
  name: TEN_DU_AN,
  workspaceId: 'w1',
  status: 'ACTIVE',
  createdAt: '',
  updatedAt: '',
};

type Nut = { props?: Record<string, unknown>; children?: unknown[] | null };

/** Gom chữ hiển thị: nội dung chữ và các thuộc tính chữ (nhãn truy cập, gợi ý ô nhập). */
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

function cayChu(man: { toJSON: () => unknown }): string {
  const goc = man.toJSON();
  return JSON.stringify((Array.isArray(goc) ? goc : [goc]).flatMap((n) => gomChu(n)));
}

let queryClient: QueryClient;

function boc(ui: React.ReactElement) {
  return <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  datNgonNguChoKiemThu('en');
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  mockedWorkspace.mockReturnValue({
    active: { id: 'w1', name: 'Lớp EXE201' },
    workspaces: [],
    switchTo: jest.fn(),
  } as never);
  mockedDuAn.mockResolvedValue([DU_AN]);
  jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
});

afterEach(() => {
  jest.restoreAllMocks();
  queryClient.clear();
});

afterAll(() => datNgonNguChoKiemThu('vi'));

describe('danh sách cuộc họp ở tiếng Anh', () => {
  it('có cuộc họp: nhóm, trạng thái, giờ và số hạng mục đều là tiếng Anh', async () => {
    const qua = { ...HOP, id: 'm-2', startTime: '2020-01-01T13:00:00.000Z', endTime: null, status: 'COMPLETED' as const };
    mockedDanhSach.mockResolvedValue([
      {
        ...HOP,
        startTime: new Date(Date.now() + 86_400_000).toISOString(),
        endTime: null,
        actionItems: [
          { id: 'a1', title: 'Chốt đề tài', status: 'PENDING' },
          { id: 'a2', title: 'Chốt đề tài', status: 'PENDING' },
        ],
      },
      qua,
    ]);
    const man = await renderScreen(boc(<ManDanhSachHop />));
    await waitFor(() => man.getByText('Upcoming'));

    expect(man.getAllByText('Meetings').length).toBeGreaterThan(0);
    expect(man.getByText('Past')).toBeTruthy();
    expect(man.getByText('Calendar')).toBeTruthy();
    expect(man.getByText('Deadlines and events')).toBeTruthy();
    expect(man.getByText('Schedule a meeting')).toBeTruthy();
    expect(man.getByText('Scheduled')).toBeTruthy();
    expect(man.getByText('Completed')).toBeTruthy();
    expect(man.getByText('2 action items')).toBeTruthy();
    expect(man.getAllByText(/^\d{1,2}:\d{2} (AM|PM)$/).length).toBe(2);
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('chưa có cuộc họp nào: trạng thái rỗng là tiếng Anh', async () => {
    mockedDanhSach.mockResolvedValue([]);
    const man = await renderScreen(boc(<ManDanhSachHop />));
    await waitFor(() => man.getByText('No meetings yet'));

    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('lỗi tải: câu báo lỗi là tiếng Anh', async () => {
    mockedDanhSach.mockRejectedValue(new Error('Lỗi lạ'));
    const man = await renderScreen(boc(<ManDanhSachHop />));
    await waitFor(() => man.getByText('Couldn’t load your meetings.'));

    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });
});

describe('chi tiết cuộc họp ở tiếng Anh', () => {
  async function moMan(hop: Partial<CuocHop> = {}) {
    mockedChiTiet.mockResolvedValue({ ...HOP, ...hop });
    const man = await renderScreen(boc(<ManChiTietHop />));
    await waitFor(() => man.getByTestId('meeting-title'));
    return man;
  }

  it('ngày, giờ, trạng thái và nút vào phòng là tiếng Anh', async () => {
    const man = await moMan();

    expect(man.getByTestId('meeting-status').props.children).toBe('Scheduled');
    expect(man.getByText('Friday, Sep 25, 2026')).toBeTruthy();
    expect(man.getByText('8:00 PM – 9:30 PM')).toBeTruthy();
    expect(man.getByText('Join the meeting')).toBeTruthy();
    expect(man.getByText('The meeting room opens in your phone’s browser.')).toBeTruthy();
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('đủ các khối: người dự, tóm tắt, quyết định, hạng mục hành động', async () => {
    const man = await moMan({
      agenda: 'Rà slide',
      summary: 'Rà slide',
      decisions: 'Chốt đề tài',
      participants: [{ id: 'p1', user: { id: 'u1', email: 'ma@f.edu.vn', fullName: 'Minh Anh' } }],
      actionItems: [
        { id: 'a1', title: 'Chốt đề tài', status: 'PENDING' },
        {
          id: 'a2',
          title: 'Chốt đề tài',
          status: 'APPROVED',
          assignee: { id: 'u1', email: 'ma@f.edu.vn', fullName: 'Minh Anh' },
          task: { id: 't1', title: 'Chốt đề tài', status: 'TODO' },
        },
        { id: 'a3', title: 'Chốt đề tài', status: 'REJECTED' },
      ],
    });

    expect(man.getByText('Agenda')).toBeTruthy();
    expect(man.getByText('Attendees (1)')).toBeTruthy();
    expect(man.getByText('Summary')).toBeTruthy();
    expect(man.getByText('Decisions')).toBeTruthy();
    expect(man.getByText('Action items (3)')).toBeTruthy();
    expect(man.getByText('Unassigned · Waiting for Leader approval')).toBeTruthy();
    expect(man.getByText('Minh Anh · Approved · turned into a task')).toBeTruthy();
    expect(man.getByText('Unassigned · Declined')).toBeTruthy();
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('họp xong mà chưa có tóm tắt: ghi chú dùng web là tiếng Anh', async () => {
    const man = await moMan({ status: 'COMPLETED' });

    expect(man.getByText('Completed')).toBeTruthy();
    expect(man.getByText('Minutes and summaries are created on the web version at wedofpt.com.vn.')).toBeTruthy();
    expect(man.queryByTestId('meeting-join')).toBeNull();
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('chưa có đường vào phòng: băng đỏ tiếng Anh', async () => {
    mockedMoPhong.mockResolvedValue({ ...HOP, roomUrl: null });
    const man = await moMan();
    await fireEvent.press(man.getByTestId('meeting-join'));

    await waitFor(() =>
      man.getByText('The server didn’t return a link to the room. Please try again in a few minutes.'),
    );
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('máy không mở được đường dẫn: băng đỏ tiếng Anh', async () => {
    mockedMoPhong.mockResolvedValue({ ...HOP, roomUrl: 'https://wedo.daily.co/abc' });
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    const man = await moMan();
    await fireEvent.press(man.getByTestId('meeting-join'));

    await waitFor(() => man.getByText('Your phone couldn’t open the meeting link.'));
  });

  it('máy chủ từ chối bằng câu lạ: dùng câu dự phòng tiếng Anh', async () => {
    mockedMoPhong.mockRejectedValue(new Error('Cuộc họp đã kết thúc'));
    const man = await moMan();
    await fireEvent.press(man.getByTestId('meeting-join'));

    await waitFor(() => man.getByText('Couldn’t open the meeting room.'));
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('404: không tìm thấy cuộc họp; 500: báo lỗi và cho thử lại', async () => {
    mockedChiTiet.mockRejectedValue(new ApiError('Không tìm thấy', 404));
    const man = await renderScreen(boc(<ManChiTietHop />));
    await waitFor(() => man.getByText('We couldn’t find this meeting, or you don’t have access to it.'));
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);

    queryClient.clear();
    mockedChiTiet.mockRejectedValue(new ApiError('Lỗi máy chủ', 500));
    const man2 = await renderScreen(boc(<ManChiTietHop />));
    await waitFor(() => man2.getByText('Couldn’t load the meeting.'));
    expect(man2.getByText('Try again')).toBeTruthy();
    expect(chuVietConSot(cayChu(man2), DU_LIEU)).toEqual([]);
  });
});

describe('tạo cuộc họp ở tiếng Anh', () => {
  async function moForm() {
    const man = await renderScreen(boc(<ManTaoCuocHop />));
    await waitFor(() => man.getByTestId('project-p1'));
    return man;
  }

  it('nhãn, gợi ý và ghi chú là tiếng Anh', async () => {
    const man = await moForm();

    expect(man.getByText('Project')).toBeTruthy();
    expect(man.getByText('Title')).toBeTruthy();
    expect(man.getByText('Agenda')).toBeTruthy();
    expect(man.getByText('Meeting date (dd/mm/yyyy)')).toBeTruthy();
    expect(man.getByText('Meeting time (hh:mm)')).toBeTruthy();
    expect(man.getByText('Only the project’s Leader can schedule a meeting. All project members are added and notified.')).toBeTruthy();
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('báo lỗi từng ô bằng tiếng Anh, riêng cho cuộc họp', async () => {
    const man = await moForm();

    await fireEvent.press(man.getByTestId('meeting-create'));
    await waitFor(() => man.getByText('The title can’t be empty.'));

    await fireEvent.changeText(man.getByTestId('meeting-title'), TEN_HOP);
    await fireEvent.press(man.getByTestId('meeting-create'));
    await waitFor(() => man.getByText('Choose a project for the meeting.'));

    await fireEvent.press(man.getByTestId('project-p1'));
    await fireEvent.press(man.getByTestId('meeting-create'));
    await waitFor(() => man.getByText('Enter a valid meeting date.'));

    await fireEvent.changeText(man.getByTestId('meeting-date'), '3102');
    await fireEvent.press(man.getByTestId('meeting-create'));
    await waitFor(() => man.getByText('Enter the meeting date as dd/mm/yyyy.'));

    await fireEvent.changeText(man.getByTestId('meeting-date'), '31022026');
    await fireEvent.press(man.getByTestId('meeting-create'));
    await waitFor(() => man.getByText('That date doesn’t exist on the calendar.'));

    await fireEvent.changeText(man.getByTestId('meeting-date'), '05102026');
    await fireEvent.press(man.getByTestId('meeting-create'));
    await waitFor(() => man.getByText('Enter the meeting time as hh:mm, for example 20:00.'));

    await fireEvent.changeText(man.getByTestId('meeting-time'), '2560');
    await fireEvent.press(man.getByTestId('meeting-create'));
    await waitFor(() => man.getByText('The meeting time must be between 00:00 and 23:59.'));

    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('máy chủ từ chối vì không phải Leader: câu tiếng Anh', async () => {
    mockedTao.mockRejectedValue(new ApiError('Chỉ Leader dự án mới có thể tạo cuộc họp.', 403));
    const man = await moForm();
    await fireEvent.press(man.getByTestId('project-p1'));
    await fireEvent.changeText(man.getByTestId('meeting-title'), TEN_HOP);
    await fireEvent.changeText(man.getByTestId('meeting-date'), '05102026');
    await fireEvent.changeText(man.getByTestId('meeting-time'), '2000');
    await fireEvent.press(man.getByTestId('meeting-create'));

    await waitFor(() => man.getByText('Only a project Leader can schedule a meeting.'));
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('lỗi lạ: câu dự phòng tiếng Anh', async () => {
    mockedTao.mockRejectedValue(new Error('Lỗi lạ chưa có bản dịch'));
    const man = await moForm();
    await fireEvent.press(man.getByTestId('project-p1'));
    await fireEvent.changeText(man.getByTestId('meeting-title'), TEN_HOP);
    await fireEvent.changeText(man.getByTestId('meeting-date'), '05102026');
    await fireEvent.changeText(man.getByTestId('meeting-time'), '2000');
    await fireEvent.press(man.getByTestId('meeting-create'));

    await waitFor(() => man.getByText('Couldn’t schedule the meeting.'));
  });

  it('lỗi ngày giờ đổi ngôn ngữ theo máy khi chuyển giữa chừng', async () => {
    const man = await moForm();
    await fireEvent.press(man.getByTestId('project-p1'));
    await fireEvent.changeText(man.getByTestId('meeting-title'), TEN_HOP);
    await fireEvent.press(man.getByTestId('meeting-create'));
    await waitFor(() => man.getByText('Enter a valid meeting date.'));

    await act(async () => datNgonNguChoKiemThu('vi'));
    await waitFor(() => man.getByText('Ngày họp chưa hợp lệ.'));
  });
});

describe('lịch ở tiếng Anh', () => {
  beforeEach(() => {
    jest.useFakeTimers({
      doNotFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'setImmediate',
        'clearImmediate',
        'nextTick',
        'queueMicrotask',
      ],
    });
    jest.setSystemTime(new Date(2026, 8, 30, 10, 0));
  });
  afterEach(() => jest.useRealTimers());

  const MUC = (ghiDe: Partial<MucLich>): MucLich =>
    ({
      id: 'x',
      kind: 'EVENT',
      title: 'Nộp slide',
      startTime: new Date(2026, 8, 30, 9, 0).toISOString(),
      endTime: new Date(2026, 8, 30, 9, 0).toISOString(),
      workspaceId: 'w1',
      ...ghiDe,
    }) as MucLich;

  it('nhãn ngày, huy hiệu loại và giờ là tiếng Anh', async () => {
    mockedLich.mockResolvedValue([
      MUC({ id: 'a', kind: 'TASK_DEADLINE', startTime: new Date(2026, 9, 1, 23, 59).toISOString() }),
      MUC({ id: 'b', kind: 'MEETING', startTime: '2026-10-05T13:00:00.000Z' }),
      MUC({ id: 'c', kind: 'EVENT', description: 'Thiếu số liệu', startTime: new Date(2026, 8, 30, 14, 0).toISOString() }),
    ]);
    const man = await renderScreen(boc(<ManLich />));
    await waitFor(() => man.getByText('Tomorrow'));

    expect(man.getByText('Today')).toBeTruthy();
    expect(man.getByText('Monday, Oct 5')).toBeTruthy();
    expect(man.getByText('Due date')).toBeTruthy();
    expect(man.getByText('Meeting')).toBeTruthy();
    expect(man.getByText('Event')).toBeTruthy();
    expect(man.getByText('11:59 PM')).toBeTruthy();
    expect(man.getByText('8:00 PM')).toBeTruthy();
    expect(man.getByLabelText('Open meeting Nộp slide')).toBeTruthy();
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('lịch trống và lỗi tải là tiếng Anh', async () => {
    mockedLich.mockResolvedValue([]);
    const man = await renderScreen(boc(<ManLich />));
    await waitFor(() => man.getByText('Nothing on your calendar yet'));
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);

    queryClient.clear();
    mockedLich.mockRejectedValue(new Error('Lỗi lạ'));
    const man2 = await renderScreen(boc(<ManLich />));
    await waitFor(() => man2.getByText('Couldn’t load your calendar.'));
    expect(chuVietConSot(cayChu(man2), DU_LIEU)).toEqual([]);
  });
});

describe('hàm thuần của cuộc họp và lịch', () => {
  it('nhanNgay: Today, Tomorrow, Yesterday và ngày xa kèm thứ', () => {
    const homNay = new Date(2026, 8, 30, 10, 0);
    expect(nhanNgay(new Date(2026, 8, 30), homNay, 'en')).toBe('Today');
    expect(nhanNgay(new Date(2026, 9, 1), homNay, 'en')).toBe('Tomorrow');
    expect(nhanNgay(new Date(2026, 8, 29), homNay, 'en')).toBe('Yesterday');
    expect(nhanNgay(new Date(2026, 9, 8), homNay, 'en')).toBe('Thursday, Oct 8');
    // Tiếng Việt giữ nguyên.
    expect(nhanNgay(new Date(2026, 9, 8), homNay, 'vi')).toBe('Thứ năm, 8/10');
  });

  it('nhanNgay: ngày xa không lệch khi máy đặt múi giờ khác Việt Nam', () => {
    // 21/08/2026 là thứ Sáu, dù giờ máy là nửa đêm hay giữa trưa.
    expect(nhanNgay(new Date(2026, 7, 21, 0, 0), new Date(2026, 8, 30), 'en')).toBe('Friday, Aug 21');
    expect(nhanNgay(new Date(2026, 7, 21, 23, 59), new Date(2026, 8, 30), 'en')).toBe('Friday, Aug 21');
  });

  it('nhomTheoNgay truyền ngôn ngữ xuống nhãn', () => {
    const muc = [
      { id: 'a', kind: 'EVENT', title: 'x', startTime: new Date(2026, 9, 1, 8).toISOString(), endTime: '', workspaceId: 'w' },
    ] as MucLich[];
    expect(nhomTheoNgay(muc, new Date(2026, 8, 30), 'en')[0].nhan).toBe('Tomorrow');
    expect(nhomTheoNgay(muc, new Date(2026, 8, 30), 'vi')[0].nhan).toBe('Ngày mai');
  });

  it('khoangGio và tenTrangThai theo ngôn ngữ; tiếng Việt giữ như cũ', () => {
    expect(khoangGio(HOP, 'en')).toBe('8:00 PM – 9:30 PM');
    expect(khoangGio(HOP, 'vi')).toBe('20:00 – 21:30');
    expect(tenTrangThai('CANCELLED', 'en')).toBe('Cancelled');
    expect(tenTrangThai('CANCELLED', 'vi')).toBe('Đã huỷ');
  });

  it('ghepNgayGio: tiếng Việt giữ đúng câu cũ, tiếng Anh viết riêng cho cuộc họp', () => {
    const cases: Array<[string, string, string, string]> = [
      ['', '20:00', 'Ngày họp chưa hợp lệ.', 'Enter a valid meeting date.'],
      ['25/09', '20:00', 'Ngày sinh cần viết theo dạng dd/mm/yyyy.', 'Enter the meeting date as dd/mm/yyyy.'],
      ['31/02/2026', '20:00', 'Ngày sinh này không có trên lịch.', 'That date doesn’t exist on the calendar.'],
      ['25/09/2026', '20', 'Giờ họp cần viết theo dạng hh:mm, ví dụ 20:00.', 'Enter the meeting time as hh:mm, for example 20:00.'],
      ['25/09/2026', '25:00', 'Giờ họp phải trong khoảng 00:00 đến 23:59.', 'The meeting time must be between 00:00 and 23:59.'],
    ];
    for (const [ngay, gio, vi, en] of cases) {
      expect(ghepNgayGio(ngay, gio, 'vi').loi).toBe(vi);
      expect(ghepNgayGio(ngay, gio, 'en').loi).toBe(en);
    }
    expect(ghepNgayGio('25/09/2026', '20:00', 'en').khoaLoi).toBeNull();
  });
});

describe('đồng bộ lịch ở tiếng Anh', () => {
  let thayHeDieuHanh: { restore: () => void };
  const URL_A = 'https://wedofpt.com.vn/lich/AbCdEf.ics';

  beforeEach(() => {
    thayHeDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
  });
  afterEach(() => thayHeDieuHanh.restore());

  it('gói Miễn phí: một câu tiếng Anh', async () => {
    mockedLay.mockResolvedValue({ duocDung: false, coLink: false });
    const man = await renderScreen(boc(<ManDongBoLich />));
    await waitFor(() => man.getByText('Calendar sync is part of the Pro and Team plans.'));

    expect(man.getAllByText('Calendar sync').length).toBeGreaterThan(0);
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('chưa có link: nút tạo link là tiếng Anh', async () => {
    mockedLay.mockResolvedValue({ duocDung: true, coLink: false });
    const man = await renderScreen(boc(<ManDongBoLich />));
    await waitFor(() => man.getByText('Create sync link'));
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('có link: hướng dẫn, lần lấy dữ liệu cuối (giờ Việt Nam) và nút đều là tiếng Anh', async () => {
    mockedLay.mockResolvedValue({
      duocDung: true,
      coLink: true,
      url: URL_A,
      // 03:30 UTC = 10:30 giờ Việt Nam.
      layLanCuoi: '2026-10-02T03:30:00.000Z',
    });
    const man = await renderScreen(boc(<ManDongBoLich />));
    await waitFor(() => man.getByText('Your link'));

    expect(man.getByText('Add to your calendar')).toBeTruthy();
    expect(man.getByText('Apple Calendar (Mac, iPhone)')).toBeTruthy();
    expect(man.getByText('Your calendar last fetched data: Oct 2, 2026, 10:30 AM')).toBeTruthy();
    expect(man.getByText('Share link')).toBeTruthy();
    expect(man.getByText('Create a new link')).toBeTruthy();
    expect(man.getByText('Turn off sync')).toBeTruthy();
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);

    // Đổi ngôn ngữ giữa chừng: dòng "lần cuối" đổi theo ngay.
    await act(async () => datNgonNguChoKiemThu('vi'));
    await waitFor(() => man.getByText('Lần cuối lịch của bạn lấy dữ liệu: 10:30 02/10/2026'));
  });

  it('chưa ứng dụng lịch nào lấy dữ liệu: câu tiếng Anh', async () => {
    mockedLay.mockResolvedValue({ duocDung: true, coLink: true, url: URL_A, layLanCuoi: null });
    const man = await renderScreen(boc(<ManDongBoLich />));
    await waitFor(() => man.getByText('No calendar app has fetched data from this link yet.'));
  });

  it('hộp thoại xác nhận và băng lỗi là tiếng Anh', async () => {
    mockedLay.mockResolvedValue({ duocDung: true, coLink: true, url: URL_A, layLanCuoi: null });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const man = await renderScreen(boc(<ManDongBoLich />));
    await waitFor(() => man.getByTestId('nut-tao-link-moi-lich'));

    await fireEvent.press(man.getByTestId('nut-tao-link-moi-lich'));
    expect(alert).toHaveBeenLastCalledWith(
      'Create a new link?',
      expect.stringContaining('Your current link stops working right away.'),
      expect.arrayContaining([expect.objectContaining({ text: 'Cancel' }), expect.objectContaining({ text: 'Create a new link' })]),
    );

    await fireEvent.press(man.getByTestId('nut-tat-dong-bo-lich'));
    expect(alert).toHaveBeenLastCalledWith(
      'Turn off calendar sync?',
      expect.stringContaining('The link stops working right away.'),
      expect.arrayContaining([expect.objectContaining({ text: 'Turn off sync' })]),
    );

    // Gói hết hạn giữa chừng: câu báo lỗi theo mã, tiếng Anh.
    alert.mockImplementation((_t, _n, nut) => {
      nut?.find((n) => n.style === 'destructive')?.onPress?.();
    });
    mockedTaoLink.mockRejectedValue(new ApiError('x', 403, 'CALENDAR_FEED_NOT_IN_PLAN'));
    await fireEvent.press(man.getByTestId('nut-tao-link-moi-lich'));
    await waitFor(() =>
      man.getByText('Your current plan doesn’t include calendar sync. It’s part of the Pro and Team plans.'),
    );
    expect(mockedTat).not.toHaveBeenCalled();
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('cauLoiDongBoLich: tiếng Việt giữ nguyên, tiếng Anh dịch từng loại lỗi', () => {
    expect(cauLoiDongBoLich(new ApiError('x', 429), 'vi')).toBe('Bạn thao tác quá nhanh. Đợi một phút rồi thử lại.');
    expect(cauLoiDongBoLich(new ApiError('x', 429), 'en')).toBe('You’re going too fast. Wait a minute and try again.');
    expect(cauLoiDongBoLich(new Error('boom'), 'vi')).toBe('Chưa làm được lúc này. Thử lại sau ít phút.');
    expect(cauLoiDongBoLich(new Error('boom'), 'en')).toBe('Couldn’t do that right now. Please try again in a few minutes.');
    expect(cauLoiDongBoLich(new ApiError('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.', 0), 'en')).toBe(
      'Can’t reach the server. Check your connection and try again.',
    );
  });
});
