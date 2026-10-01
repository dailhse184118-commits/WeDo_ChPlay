import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';

import { renderScreen } from '../../../test-utils/render';
import ManChiTietTask from '../../../app/(tabs)/tasks/[taskId]';
import { listProjects } from '../../../lib/api/projects';
import { LoiGuiDoDang } from '../../../lib/api/chat-files';
import { approveReview, getTask, updateTaskStatus, uploadSubmissions } from '../../../lib/api/tasks';
import { chonTaiLieu } from '../../../lib/files/pick-documents';
import { useAuth } from '../../../lib/auth/auth-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import type { Project, Task, TaskSubmission } from '../../../lib/types';

jest.mock('../../../lib/api/tasks');
jest.mock('../../../lib/api/projects');
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

const mockedGetTask = getTask as jest.MockedFunction<typeof getTask>;
const mockedDuAn = listProjects as jest.MockedFunction<typeof listProjects>;
const mockedDoiTrangThai = updateTaskStatus as jest.MockedFunction<typeof updateTaskStatus>;
const mockedDuyet = approveReview as jest.MockedFunction<typeof approveReview>;
const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;
const mockedMoTrinhDuyet = WebBrowser.openBrowserAsync as jest.MockedFunction<
  typeof WebBrowser.openBrowserAsync
>;

const LEADER = 'u-leader';
const MINH_ANH = { id: 'u-minh-anh', email: 'ma@f.edu.vn', fullName: 'Minh Anh' };

const DU_AN: Project = {
  id: 'p1',
  name: 'Đồ án thiện nguyện',
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
    title: 'Làm slide thuyết trình',
    status: 'TODO',
    assignmentStatus: 'PENDING',
    assigneeId: MINH_ANH.id,
    assignee: MINH_ANH,
    creatorId: LEADER,
    projectId: 'p1',
    project: { id: 'p1', name: 'Đồ án thiện nguyện', status: 'ACTIVE' },
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

async function moMan(task: Task, meId = LEADER) {
  mockedGetTask.mockResolvedValue(task);
  mockedAuth.mockReturnValue({ user: { id: meId } } as never);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const man = await renderScreen(
    <QueryClientProvider client={client}>
      <ManChiTietTask />
    </QueryClientProvider>,
  );
  await waitFor(() => man.getByText('Làm slide thuyết trình'));
  // Chờ danh sách dự án về: quyền leader tính từ đó.
  await waitFor(() => expect(mockedDuAn).toHaveBeenCalled());
  return man;
}

const GOC_CU = process.env.EXPO_PUBLIC_API_BASE_URL;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.wedo.test';
  mockedDuAn.mockResolvedValue([DU_AN]);
  mockedWorkspace.mockReturnValue({
    workspaces: [{ id: 'w1', name: 'Nhóm', ownerId: 'u-chu', createdAt: '', updatedAt: '' }],
  } as never);
  mockedMoTrinhDuyet.mockResolvedValue({ type: 'opened' } as never);
});

afterAll(() => {
  process.env.EXPO_PUBLIC_API_BASE_URL = GOC_CU;
});

/*
  Luồng trình diễn chính: Leader tạo việc bằng AI cho Minh Anh từ khung chat rồi
  bấm "Xem công việc". Trước đây màn hiện "Nhận việc"/"Từ chối" cho chính Leader,
  bấm vào là ăn lỗi 403 "Chỉ người được giao task mới có thể chấp nhận task này".
*/
describe('việc đang chờ người được giao phản hồi', () => {
  it('leader xem việc giao cho người khác: không có nút nhận hay từ chối', async () => {
    const man = await moMan(congViec());

    expect(man.queryByTestId('detail-accept')).toBeNull();
    expect(man.queryByTestId('detail-reject')).toBeNull();
    expect(man.getByTestId('detail-cho-phan-hoi').props.children).toBe(
      'Đang chờ Minh Anh phản hồi',
    );
  });

  it('dòng Phân công không nói "Chờ bạn" với người không phải người được giao', async () => {
    const man = await moMan(congViec());

    expect(man.queryByText('Chờ bạn phản hồi')).toBeNull();
    expect(man.getByText('Chờ Minh Anh phản hồi')).toBeTruthy();
  });

  it('người được giao vẫn thấy hai nút như cũ', async () => {
    const man = await moMan(congViec(), MINH_ANH.id);

    expect(man.getByTestId('detail-accept')).toBeTruthy();
    expect(man.getByTestId('detail-reject')).toBeTruthy();
    expect(man.getByText('Chờ bạn phản hồi')).toBeTruthy();
  });
});

describe('việc tự giao cho mình', () => {
  const tuGiao = () =>
    congViec({
      assigneeId: LEADER,
      assignee: { id: LEADER, email: 'l@f.edu.vn', fullName: 'Lê Huân' },
      assignmentStatus: 'ACCEPTED',
      status: 'TODO',
    });

  it('có nút Bắt đầu làm, bấm vào thì chuyển sang Đang làm', async () => {
    mockedDoiTrangThai.mockResolvedValue({ ...tuGiao(), status: 'IN_PROGRESS' });
    const man = await moMan(tuGiao());

    await waitFor(() => man.getByTestId('detail-start'));
    await fireEvent.press(man.getByTestId('detail-start'));

    await waitFor(() => expect(mockedDoiTrangThai).toHaveBeenCalledWith('t1', 'IN_PROGRESS'));
  });

  it('báo lỗi máy chủ ngay trên màn khi không bắt đầu được', async () => {
    mockedDoiTrangThai.mockRejectedValue(new Error('Chỉ leader dự án mới được tạo, phân công hoặc xóa task'));
    const man = await moMan(tuGiao());

    await waitFor(() => man.getByTestId('detail-start'));
    await fireEvent.press(man.getByTestId('detail-start'));

    await waitFor(() =>
      expect(man.getByText('Chỉ leader dự án mới được tạo, phân công hoặc xóa task')).toBeTruthy(),
    );
  });

  it('không có nút đó khi việc là của người khác', async () => {
    const man = await moMan(congViec({ assignmentStatus: 'ACCEPTED' }));
    expect(man.queryByTestId('detail-start')).toBeNull();
  });
});

describe('leader chấm bài', () => {
  const choDuyet = () =>
    congViec({ status: 'REVIEW', assignmentStatus: 'ACCEPTED', submissions: [BAI_NOP] });

  it('chạm vào tệp đã nộp thì mở đúng đường dẫn tuyệt đối trên máy chủ', async () => {
    const man = await moMan(choDuyet());

    await fireEvent.press(man.getByTestId('submission-file-s1'));

    await waitFor(() =>
      expect(mockedMoTrinhDuyet).toHaveBeenCalledWith(
        'https://api.wedo.test/uploads/task-submissions/9f3a-slide.pdf',
      ),
    );
  });

  it('nói rõ khi máy không mở được tệp', async () => {
    mockedMoTrinhDuyet.mockRejectedValue(new Error('no browser'));
    const man = await moMan(choDuyet());

    await fireEvent.press(man.getByTestId('submission-file-s1'));

    await waitFor(() => expect(man.getByText(/Không mở được tệp/)).toBeTruthy());
  });

  /*
    Duyệt là chuyển việc sang Xong và báo cả dự án, điện thoại không có nút hoàn
    tác. Một cú chạm nhầm không được làm việc đó.
  */
  it('hỏi lại trước khi duyệt, chỉ duyệt khi người dùng xác nhận', async () => {
    const hoi = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockedDuyet.mockResolvedValue({ ...choDuyet(), status: 'DONE' });
    const man = await moMan(choDuyet());

    await waitFor(() => man.getByTestId('review-approve'));
    await fireEvent.press(man.getByTestId('review-approve'));

    expect(hoi).toHaveBeenCalledTimes(1);
    expect(mockedDuyet).not.toHaveBeenCalled();

    const nut = (hoi.mock.calls[0][2] ?? []).find((b) => b.text === 'Duyệt');
    nut?.onPress?.();

    await waitFor(() => expect(mockedDuyet).toHaveBeenCalledWith('t1'));
    hoi.mockRestore();
  });
});

/*
  Mỗi tệp nộp là một bài nộp thật. Tệp thứ hai hỏng thì tệp đầu vẫn đã lên —
  màn phải đọc lại công việc để hiện nó, không thì người làm tưởng chưa nộp gì
  và nộp lại, thành hai bản.
*/
describe('nộp nhiều tệp hỏng giữa chừng', () => {
  it('đọc lại công việc để hiện tệp đã lên, và nói rõ đã nộp bao nhiêu', async () => {
    const dangLam = congViec({
      assigneeId: MINH_ANH.id,
      assignmentStatus: 'ACCEPTED',
      status: 'IN_PROGRESS',
    });
    (chonTaiLieu as jest.Mock).mockResolvedValue([
      { uri: 'file:///a.pdf', name: 'a.pdf' },
      { uri: 'file:///b.pdf', name: 'b.pdf' },
    ]);
    (uploadSubmissions as jest.Mock).mockRejectedValue(
      new LoiGuiDoDang([{ ...dangLam, submissions: [BAI_NOP] }], 2, new Error('Mất mạng')),
    );
    const man = await moMan(dangLam, MINH_ANH.id);
    const soLanDoc = mockedGetTask.mock.calls.length;

    await fireEvent.press(man.getByTestId('submission-pick'));

    await waitFor(() => expect(man.getByText(/Đã gửi 1\/2 tệp/)).toBeTruthy());
    await waitFor(() => expect(mockedGetTask.mock.calls.length).toBeGreaterThan(soLanDoc));
  });
});
