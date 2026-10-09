import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { renderScreen } from '../../../test-utils/render';
import ManDanhSachViec from '../../../app/(tabs)/tasks/index';
import ManChiTietTask from '../../../app/(tabs)/tasks/[taskId]';
import ManTaoCongViec from '../../../app/(tabs)/tasks/new';
import { RejectTaskSheet } from '../RejectTaskSheet';
import { TaskRow } from '../TaskRow';
import { listProjects } from '../../../lib/api/projects';
import { acceptTask, createTask, getTask, listTasks, rejectTask } from '../../../lib/api/tasks';
import { getWorkspace } from '../../../lib/api/workspaces';
import { ApiError } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/auth-context';
import { groupByDeadline } from '../../../lib/tasks/deadline-groups';
import { dungInputTaoTask, FORM_TAO_TASK_RONG } from '../../../lib/tasks/tao-task';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { chuVietConSot } from '../../../i18n/chu-viet-con-sot';
import { datNgonNguChoKiemThu } from '../../../i18n/ngon-ngu';
import type { Project, Task, TaskSubmission } from '../../../lib/types';

/*
  Khu vực Công việc ở tiếng Anh: danh sách việc, chi tiết việc, tạo việc, từ chối
  nhận việc và trả bài. Không còn chữ tiếng Việt nào hiện ra, trừ tên việc, tên
  người và tên dự án (dữ liệu của người dùng).
*/

jest.mock('../../../lib/api/projects');
jest.mock('../../../lib/api/tasks');
jest.mock('../../../lib/api/workspaces');
jest.mock('../../../lib/auth/auth-context');
jest.mock('../../../lib/workspace/workspace-context');
jest.mock('../../../lib/files/pick-documents', () => ({ chonTaiLieu: jest.fn() }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: jest.fn(), push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ taskId: 't1' }),
  useFocusEffect: (hieuUng: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(hieuUng, [hieuUng]);
  },
}));

const mockedListTasks = listTasks as jest.MockedFunction<typeof listTasks>;
const mockedGetTask = getTask as jest.MockedFunction<typeof getTask>;
const mockedAccept = acceptTask as jest.MockedFunction<typeof acceptTask>;
const mockedReject = rejectTask as jest.MockedFunction<typeof rejectTask>;
const mockedCreate = createTask as jest.MockedFunction<typeof createTask>;
const mockedDuAn = listProjects as jest.MockedFunction<typeof listProjects>;
const mockedKhongGian = getWorkspace as jest.MockedFunction<typeof getWorkspace>;
const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;

const LEADER = 'u-leader';
const MINH_ANH = { id: 'u-minh-anh', email: 'ma@f.edu.vn', fullName: 'Minh Anh' };
const TEN_VIEC = 'Làm slide thuyết trình';
const TEN_DU_AN = 'Đồ án thiện nguyện';
/** Dữ liệu của người dùng, được giữ nguyên tiếng Việt. */
const DU_LIEU = [TEN_VIEC, TEN_DU_AN, 'Minh Anh', 'Lê Huân', 'Slide nhóm 3.pdf', 'Thiếu số liệu quý 2', 'Lớp EXE201'];

const DU_AN: Project = {
  id: 'p1',
  name: TEN_DU_AN,
  workspaceId: 'w1',
  status: 'ACTIVE',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  members: [
    { id: 'm1', role: 'LEADER', user: { id: LEADER, email: 'l@f.edu.vn', fullName: 'Lê Huân' } },
    { id: 'm2', role: 'MEMBER', user: MINH_ANH },
  ],
};

function congViec(ghiDe: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: TEN_VIEC,
    status: 'TODO',
    assignmentStatus: 'PENDING',
    assigneeId: MINH_ANH.id,
    assignee: MINH_ANH,
    creatorId: LEADER,
    projectId: 'p1',
    project: { id: 'p1', name: TEN_DU_AN, status: 'ACTIVE' },
    workspaceId: 'w1',
    createdAt: '2026-09-30T00:00:00.000Z',
    updatedAt: '2026-09-30T00:00:00.000Z',
    submissions: [],
    ...ghiDe,
  };
}

const BAI_NOP: TaskSubmission = {
  id: 's1',
  taskId: 't1',
  uploaderId: MINH_ANH.id,
  fileName: '9f3a-slide.pdf',
  originalName: 'Slide nhóm 3.pdf',
  mimeType: 'application/pdf',
  size: 300 * 1024,
  url: '/uploads/task-submissions/9f3a-slide.pdf',
  createdAt: '2026-09-30T09:00:00.000Z',
};

const KHONG_GIAN = {
  id: 'w1',
  name: 'Lớp EXE201',
  ownerId: 'u-chu',
  createdAt: '',
  updatedAt: '',
  members: [
    { id: 'wm1', role: 'MEMBER', user: MINH_ANH },
    { id: 'wm2', role: 'MEMBER', user: { id: LEADER, email: 'l@f.edu.vn', fullName: 'Lê Huân' } },
  ],
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

function boc(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  datNgonNguChoKiemThu('en');
  mockedAuth.mockReturnValue({ user: { id: LEADER } } as never);
  mockedWorkspace.mockReturnValue({
    active: { id: 'w1', name: 'Lớp EXE201' },
    workspaces: [KHONG_GIAN],
    switchTo: jest.fn(),
  } as never);
  mockedDuAn.mockResolvedValue([DU_AN]);
  mockedKhongGian.mockResolvedValue(KHONG_GIAN as never);
});

afterAll(() => datNgonNguChoKiemThu('vi'));

describe('danh sách việc ở tiếng Anh', () => {
  it('có việc: nhóm, số đếm, trạng thái và nút nhận việc đều là tiếng Anh', async () => {
    const homNay = new Date();
    mockedListTasks.mockResolvedValue([
      congViec({ assigneeId: LEADER, assignee: null }),
      congViec({
        id: 't2',
        title: 'Thiếu số liệu quý 2',
        assigneeId: LEADER,
        assignmentStatus: 'ACCEPTED',
        status: 'IN_PROGRESS',
        dueDate: homNay.toISOString(),
      }),
      congViec({
        id: 't3',
        title: 'Thiếu số liệu quý 2',
        assigneeId: LEADER,
        assignmentStatus: 'ACCEPTED',
        status: 'REVIEW',
        dueDate: new Date(homNay.getTime() - 3 * 24 * 3600 * 1000).toISOString(),
      }),
    ]);
    const man = await renderScreen(boc(<ManDanhSachViec />));
    await waitFor(() => man.getByText('Waiting for your reply'));

    expect(man.getByText('My tasks')).toBeTruthy();
    expect(man.getByText('Accept task')).toBeTruthy();
    expect(man.getByText('Decline')).toBeTruthy();
    expect(man.getByText(/Overdue by 3 days$/)).toBeTruthy();
    expect(man.getByText('Today')).toBeTruthy();
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('chưa có việc nào: trạng thái rỗng là tiếng Anh', async () => {
    mockedListTasks.mockResolvedValue([]);
    const man = await renderScreen(boc(<ManDanhSachViec />));
    await waitFor(() => man.getByText('No tasks for you yet'));

    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('lỗi tải: câu báo lỗi là tiếng Anh', async () => {
    mockedListTasks.mockRejectedValue(new Error('Lỗi lạ chưa có bản dịch'));
    const man = await renderScreen(boc(<ManDanhSachViec />));
    await waitFor(() => man.getByText('Couldn’t load your tasks.'));

    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('nhận việc hỏng: băng đỏ dịch theo mã lỗi', async () => {
    mockedListTasks.mockResolvedValue([congViec({ assigneeId: LEADER, assignee: null })]);
    mockedAccept.mockRejectedValue(new Error('Lỗi lạ chưa có bản dịch'));
    const man = await renderScreen(boc(<ManDanhSachViec />));
    await waitFor(() => man.getByTestId('task-accept-t1'));

    await fireEvent.press(man.getByTestId('task-accept-t1'));
    await waitFor(() => man.getByText('Couldn’t accept this task.'));
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('nhóm theo hạn đúng ngôn ngữ', () => {
    const nhan = groupByDeadline([congViec()], new Date()).map((nhom) => nhom.label);
    expect(nhan).toEqual(['Waiting for your reply']);
    expect(groupByDeadline([congViec()], new Date(), 'vi').map((nhom) => nhom.label)).toEqual([
      'Chờ bạn phản hồi',
    ]);
  });
});

describe('dòng công việc ở tiếng Anh', () => {
  const NOW = new Date('2026-10-05T03:00:00.000Z');

  function dong(ghiDe: Partial<Task>) {
    return renderScreen(
      <TaskRow task={congViec({ assignmentStatus: 'ACCEPTED', ...ghiDe })} now={NOW} onPress={() => {}} />,
    );
  }

  it('hạn hôm nay, ngày mai, ngày xa và quá hạn', async () => {
    // 03:00 UTC = 10:00 giờ Việt Nam.
    expect((await dong({ dueDate: '2026-10-05T07:05:00.000Z' })).getByText(/Due today, /)).toBeTruthy();
    expect((await dong({ dueDate: '2026-10-06T07:05:00.000Z' })).getByText(/Due tomorrow, /)).toBeTruthy();
    expect((await dong({ dueDate: '2026-10-09T07:05:00.000Z' })).getByText(/Due Oct 9, /)).toBeTruthy();
    expect((await dong({ dueDate: '2026-10-04T07:05:00.000Z' })).getByText(/Overdue by 1 day$/)).toBeTruthy();
    expect((await dong({ dueDate: '2026-10-02T07:05:00.000Z' })).getByText(/Overdue by 3 days$/)).toBeTruthy();
  });

  it('việc đã từ chối và việc đã xong', async () => {
    const tuChoi = await dong({ assignmentStatus: 'REJECTED' });
    expect(tuChoi.getByText('Declined')).toBeTruthy();

    const xong = await dong({
      status: 'DONE',
      dueDate: '2026-10-05T07:05:00.000Z',
      completedAt: '2026-10-05T07:05:00.000Z',
    });
    expect(xong.getByText('Done')).toBeTruthy();
    expect(xong.getByText(/Done at /)).toBeTruthy();
    expect(chuVietConSot(cayChu(xong), DU_LIEU)).toEqual([]);
  });
});

describe('chi tiết việc ở tiếng Anh', () => {
  async function moMan(task: Task, meId = LEADER) {
    mockedGetTask.mockResolvedValue(task);
    mockedAuth.mockReturnValue({ user: { id: meId } } as never);
    const man = await renderScreen(boc(<ManChiTietTask />));
    await waitFor(() => man.getByText(TEN_VIEC));
    await waitFor(() => expect(mockedDuAn).toHaveBeenCalled());
    return man;
  }

  it('Leader xem việc đang chờ người khác phản hồi', async () => {
    const man = await moMan(congViec({ dueDate: '2026-10-05T07:05:00.000Z' }));

    expect(man.getByText('Task details')).toBeTruthy();
    expect(man.getByText('Status')).toBeTruthy();
    expect(man.getByText('Due date')).toBeTruthy();
    expect(man.getAllByText('Waiting for Minh Anh to reply')).toHaveLength(2);
    expect(man.getByText('Oct 5, 2026, 2:05 PM')).toBeTruthy();
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('người được giao thấy nút nhận và từ chối, mở phiếu từ chối bằng tiếng Anh', async () => {
    const man = await moMan(congViec(), MINH_ANH.id);

    expect(man.getByText('Accept task')).toBeTruthy();
    await fireEvent.press(man.getByTestId('detail-reject'));
    await waitFor(() => man.getByText('Decline task'));

    expect(man.getByText('Clashes with another deadline')).toBeTruthy();
    expect(man.getByText('Reason for declining', { exact: false })).toBeTruthy();
    expect(man.getByText('Send decline')).toBeTruthy();
    expect(man.getByText('Required')).toBeTruthy();
    expect(man.getByPlaceholderText('For example: I have midterms this week and won’t have time.')).toBeTruthy();
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('lý do từ chối quá ngắn: báo lỗi tiếng Anh, rồi gửi được', async () => {
    mockedReject.mockResolvedValue(congViec() as never);
    const man = await moMan(congViec(), MINH_ANH.id);
    await fireEvent.press(man.getByTestId('detail-reject'));
    await waitFor(() => man.getByTestId('reject-reason'));

    await fireEvent.changeText(man.getByTestId('reject-reason'), 'ab');
    await fireEvent.press(man.getByTestId('reject-confirm'));
    expect(man.getByText('The reason must be at least 3 characters')).toBeTruthy();
    expect(mockedReject).not.toHaveBeenCalled();

    await fireEvent.press(man.getByTestId('quick-reason-1'));
    await fireEvent.press(man.getByTestId('reject-confirm'));
    await waitFor(() => expect(mockedReject).toHaveBeenCalledWith('t1', 'Too much on my plate'));
  });

  it('người làm xong bài: bảng tài liệu và nút gửi duyệt', async () => {
    const man = await moMan(
      congViec({
        assigneeId: LEADER,
        assignee: null,
        assignmentStatus: 'ACCEPTED',
        status: 'IN_PROGRESS',
        submissions: [BAI_NOP],
        reviewRejectedReason: 'Thiếu số liệu quý 2',
      }),
    );

    expect(man.getByText('Returned for changes')).toBeTruthy();
    expect(man.getByText('Submitted files')).toBeTruthy();
    expect(man.getByText('Submit files')).toBeTruthy();
    expect(man.getByText('Submit for review')).toBeTruthy();
    expect(man.getByLabelText('Open file Slide nhóm 3.pdf')).toBeTruthy();
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('Leader duyệt bài: hộp hỏi và phiếu trả bài bằng tiếng Anh', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const man = await moMan(
      congViec({ assignmentStatus: 'ACCEPTED', status: 'REVIEW', submissions: [BAI_NOP] }),
    );

    expect(man.getByText('Approve submission')).toBeTruthy();
    await fireEvent.press(man.getByTestId('review-approve'));
    expect(alert).toHaveBeenCalledWith(
      'Approve this submission?',
      'The task will move to Done and the whole team will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: expect.any(Function) },
      ],
    );

    await fireEvent.press(man.getByTestId('review-reject'));
    await waitFor(() => man.getByText('Return submission'));
    expect(man.getByText('Missing content')).toBeTruthy();
    expect(man.getByText('Request changes')).toBeTruthy();
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
    alert.mockRestore();
  });
});

describe('phiếu từ chối ở tiếng Anh', () => {
  it('có tên người giao việc', async () => {
    const man = await renderScreen(
      <RejectTaskSheet visible assignerName="Lê Huân" onConfirm={() => {}} onDismiss={() => {}} />,
    );

    expect(
      man.getByText(
        'Lê Huân will see your reason, so keep it short and specific to help the team reassign.',
      ),
    ).toBeTruthy();
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('đang gửi thì nút đổi chữ', async () => {
    const man = await renderScreen(
      <RejectTaskSheet visible submitting onConfirm={() => {}} onDismiss={() => {}} />,
    );
    expect(man.getByText('Sending…')).toBeTruthy();
  });
});

describe('tạo việc ở tiếng Anh', () => {
  async function moMan() {
    return renderScreen(boc(<ManTaoCongViec />));
  }

  it('form, chip dự án và người nhận là tiếng Anh', async () => {
    const man = await moMan();
    await waitFor(() => man.getByLabelText(TEN_DU_AN));

    expect(man.getByText('New task')).toBeTruthy();
    expect(man.getByText('Task name')).toBeTruthy();
    expect(man.getByText('Due date')).toBeTruthy();
    expect(man.getByText('Assign to')).toBeTruthy();
    expect(man.getByText('Create task')).toBeTruthy();
    expect(man.getByPlaceholderText('day/month/year, for example 02/09/2026')).toBeTruthy();
    expect(chuVietConSot(cayChu(man), DU_LIEU)).toEqual([]);
  });

  it('thiếu tên, hạn sai: câu báo lỗi tiếng Anh', async () => {
    const man = await moMan();
    await waitFor(() => man.getByLabelText(TEN_DU_AN));

    await fireEvent.press(man.getByTestId('nut-tao'));
    expect(man.getByText('Enter a task name first.')).toBeTruthy();

    await fireEvent.changeText(man.getByTestId('o-tieu-de'), 'Viết báo cáo');
    await fireEvent.changeText(man.getByTestId('o-han-chot'), '31/02/2026');
    await fireEvent.press(man.getByTestId('nut-tao'));
    expect(man.getByText('The due date must be day/month/year, for example 02/09/2026.')).toBeTruthy();
    expect(chuVietConSot(cayChu(man), [...DU_LIEU, 'Viết báo cáo'])).toEqual([]);
  });

  it('chọn dự án mà mình không phải Leader: ghi chú tiếng Anh', async () => {
    mockedAuth.mockReturnValue({ user: { id: MINH_ANH.id } } as never);
    const man = await moMan();
    await waitFor(() => man.getByLabelText(TEN_DU_AN));
    await fireEvent.press(man.getByLabelText(TEN_DU_AN));

    expect(
      man.getByText(
        'Only the Leader of this project can create tasks in it. Deselect the project to create a personal task.',
      ),
    ).toBeTruthy();
  });

  it('máy chủ từ chối: lỗi lạ dùng câu dự phòng tiếng Anh, lỗi có mã thì dịch', async () => {
    mockedCreate.mockRejectedValueOnce(new Error('Lỗi lạ chưa có bản dịch'));
    const man = await moMan();
    await waitFor(() => man.getByLabelText(TEN_DU_AN));
    await fireEvent.changeText(man.getByTestId('o-tieu-de'), 'Viết báo cáo');
    await fireEvent.press(man.getByTestId('nut-tao'));
    await waitFor(() => man.getByText('Couldn’t create the task.'));

    mockedCreate.mockRejectedValueOnce(
      new ApiError('Tài khoản của bạn đã bị khoá', 403, 'ACCOUNT_SUSPENDED'),
    );
    await fireEvent.press(man.getByTestId('nut-tao'));
    await waitFor(() => man.getByText(/Your account has been suspended/));
  });

  it('dungInputTaoTask trả câu theo ngôn ngữ và kèm khoá lỗi', () => {
    const en = dungInputTaoTask(FORM_TAO_TASK_RONG, 'w1');
    expect(en.khoaLoi).toBe('thieuTen');
    expect(en.loi).toBe('Enter a task name first.');
    const vi = dungInputTaoTask(FORM_TAO_TASK_RONG, 'w1', 'vi');
    expect(vi.loi).toBe('Nhập tên công việc trước đã.');
    expect(dungInputTaoTask({ ...FORM_TAO_TASK_RONG, tieuDe: 'A' }, 'w1').khoaLoi).toBeNull();
  });
});
