import React from 'react';
import { Alert, Platform } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ManChatDuAn from '../../../app/(tabs)/chat/[projectId]';
import { getProjectMessages, markProjectRead, requestTaskSuggestion } from '../../../lib/api/chat';
import { getEntitlements } from '../../../lib/api/entitlements';
import { blockUser, listBlocks, reportContent } from '../../../lib/api/moderation';
import { listProjects } from '../../../lib/api/projects';
import { useAuth } from '../../../lib/auth/auth-context';
import { useSocket } from '../../../lib/socket/socket-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import type { ChatMessage } from '../../../lib/types';

/*
  Nhấn giữ một tin trong chat dự án: Báo cáo, Chặn, và (chỉ cho Leader) tạo công
  việc bằng AI — Guideline 1.2 của Apple.

  Đặt ở đây chứ không cạnh màn hình: Expo Router biến mọi tệp dưới `src/app/`
  thành một đường dẫn, kể cả tệp kiểm thử.
*/

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ projectId: 'p1' }),
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: jest.fn() }),
  // Màn đang được xem: chạy hiệu ứng ngay.
  useFocusEffect: (hieuUng: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(hieuUng, [hieuUng]);
  },
}));

jest.mock('../../../lib/api/chat', () => ({
  ...jest.requireActual('../../../lib/api/chat'),
  getProjectHistory: jest.fn(async () => ({ items: [], nextCursor: null })),
  getProjectMessages: jest.fn(),
  markProjectRead: jest.fn(),
  requestTaskSuggestion: jest.fn(),
  sendProjectFiles: jest.fn(),
  sendProjectMessage: jest.fn(),
}));
jest.mock('../../../lib/api/moderation', () => ({
  ...jest.requireActual('../../../lib/api/moderation'),
  listBlocks: jest.fn(),
  blockUser: jest.fn(),
  reportContent: jest.fn(),
}));
jest.mock('../../../lib/api/projects');
jest.mock('../../../lib/api/entitlements', () => ({
  MA_HET_LUOT_AI: 'AI_QUOTA_EXCEEDED',
  getEntitlements: jest.fn(),
}));
jest.mock('../../../lib/auth/auth-context');
jest.mock('../../../lib/socket/socket-context');
jest.mock('../../../lib/workspace/workspace-context');
jest.mock('../../../lib/chat/use-header-tep', () => ({ useHeaderTep: () => undefined }));
jest.mock('../../../lib/images/pick-images', () => ({ chonAnh: jest.fn(), chupAnh: jest.fn() }));
jest.mock('../../../lib/observability/sentry', () => ({ baoLoi: jest.fn(), moTaTep: jest.fn() }));

/* Bong bóng tối giản nhưng vẫn nhấn giữ được, như trên máy. */
jest.mock('../../../components/chat/MessageBubble', () => {
  const { Pressable: P, Text: T } = jest.requireActual('react-native');
  return {
    MessageBubble: ({
      message,
      onLongPress,
    }: {
      message: { id: string; content: string };
      onLongPress: () => void;
    }) => (
      <P testID={`tin-${message.id}`} onLongPress={onLongPress}>
        <T>{message.content}</T>
      </P>
    ),
  };
});
jest.mock('../../../components/chat/MessageComposer', () => ({ MessageComposer: () => null }));
jest.mock('../../../components/chat/ImageViewer', () => ({ ImageViewer: () => null }));
jest.mock('../../../components/chat/TaskSuggestionSheet', () => {
  const { Text: T } = jest.requireActual('react-native');
  return {
    TaskSuggestionSheet: ({ visible }: { visible: boolean }) =>
      visible ? <T>phiếu đề xuất AI</T> : null,
  };
});
jest.mock('../../../components/ui/GradientHeader', () => {
  const { Text: T } = jest.requireActual('react-native');
  return { GradientHeader: ({ title }: { title: string }) => <T>{title}</T> };
});

const mockedTin = getProjectMessages as jest.MockedFunction<typeof getProjectMessages>;
const mockedDaDoc = markProjectRead as jest.MockedFunction<typeof markProjectRead>;
const mockedGoiY = requestTaskSuggestion as jest.MockedFunction<typeof requestTaskSuggestion>;
const mockedHanMuc = getEntitlements as jest.MockedFunction<typeof getEntitlements>;
const mockedDanhSachChan = listBlocks as jest.MockedFunction<typeof listBlocks>;
const mockedChan = blockUser as jest.MockedFunction<typeof blockUser>;
const mockedBaoCao = reportContent as jest.MockedFunction<typeof reportContent>;
const mockedDuAn = listProjects as jest.MockedFunction<typeof listProjects>;
const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedSocket = useSocket as jest.MockedFunction<typeof useSocket>;
const mockedWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;

type XuLy = (...args: never[]) => void;
function socketGia() {
  const xuLy: Record<string, XuLy> = {};
  return {
    xuLy,
    on: jest.fn((ten: string, fn: XuLy) => {
      xuLy[ten] = fn;
    }),
    off: jest.fn((ten: string, fn: XuLy) => {
      if (xuLy[ten] === fn) delete xuLy[ten];
    }),
    emit: jest.fn(),
  };
}

function tin(id: string, noiDung: string, authorId: string, tenTacGia: string, phut = 1): ChatMessage {
  const luc = new Date(Date.UTC(2026, 8, 26, 10, phut)).toISOString();
  return {
    id,
    content: noiDung,
    workspaceId: 'w1',
    projectId: 'p1',
    authorId,
    author: { id: authorId, email: '', fullName: tenTacGia },
    createdAt: luc,
    updatedAt: luc,
  };
}

const THANH_VIEN = [
  { id: 'pm1', role: 'MEMBER', user: { id: 'u1', email: '', fullName: 'Đại' } },
  { id: 'pm2', role: 'MEMBER', user: { id: 'u2', email: '', fullName: 'Tuấn' } },
  { id: 'pm3', role: 'MEMBER', user: { id: 'u3', email: '', fullName: 'Lan' } },
];

let socket: ReturnType<typeof socketGia>;
let queryClient: QueryClient;
let heDieuHanh: { restore: () => void } | null = null;
let hopThoai: jest.SpyInstance;

function dung() {
  return (
    <QueryClientProvider client={queryClient}>
      <ManChatDuAn />
    </QueryClientProvider>
  );
}

async function moMan() {
  const man = await render(dung());
  await waitFor(() => expect(man.getByText('Tuấn nói bậy')).toBeTruthy());
  /*
    Đợi cả dự án về (tên dự án lên tiêu đề): chưa có dự án thì chưa biết vai trò,
    và màn cố ý vẫn hiện mục AI — kiểm thử sẽ đo nhầm trạng thái đó.
  */
  await waitFor(() => expect(man.getByText('Nhóm EXE')).toBeTruthy());
  return man;
}

async function nhanGiu(man: Awaited<ReturnType<typeof render>>, id: string) {
  await fireEvent(man.getByTestId(`tin-${id}`), 'longPress');
}

beforeEach(() => {
  jest.clearAllMocks();
  // Bảng trượt của Android: bấm được bằng testID. Bản iOS có kiểm thử riêng.
  heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
  hopThoai = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  socket = socketGia();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  mockedAuth.mockReturnValue({ user: { id: 'u1', fullName: 'Đại' } } as never);
  mockedSocket.mockReturnValue({ socket, connected: true, onlineUserIds: new Set() } as never);
  mockedWorkspace.mockReturnValue({ active: { id: 'w1', ownerId: 'chu-khac' } } as never);
  mockedDuAn.mockResolvedValue([{ id: 'p1', name: 'Nhóm EXE', members: THANH_VIEN }] as never);
  mockedHanMuc.mockReturnValue(new Promise(() => undefined) as never);
  mockedDaDoc.mockResolvedValue({ ok: true } as never);
  mockedDanhSachChan.mockResolvedValue([]);
  mockedTin.mockResolvedValue([
    tin('m1', 'Tin của tôi', 'u1', 'Đại', 1),
    tin('m2', 'Tuấn nói bậy', 'u2', 'Tuấn', 2),
    tin('m3', 'Lan hỏi bài', 'u3', 'Lan', 3),
  ]);
});

afterEach(() => {
  hopThoai.mockRestore();
  heDieuHanh?.restore();
  heDieuHanh = null;
  queryClient.clear();
});

describe('nhấn giữ tin trong chat dự án', () => {
  it('thành viên thường: có Báo cáo và Chặn, không có mục AI', async () => {
    const man = await moMan();

    await nhanGiu(man, 'm2');

    expect(man.getByTestId('thao-tac-bao-cao')).toBeTruthy();
    expect(man.getByText('Báo cáo tin nhắn')).toBeTruthy();
    expect(man.getByText('Chặn người này')).toBeTruthy();
    expect(man.queryByText('Tạo công việc bằng AI')).toBeNull();
    // Nhấn giữ không còn gọi AI ngay như trước.
    expect(mockedGoiY).not.toHaveBeenCalled();
  });

  it('tin của chính mình và không phải Leader: không có gì để làm, không mở bảng', async () => {
    const man = await moMan();

    await nhanGiu(man, 'm1');

    expect(man.queryByTestId('bang-thao-tac')).toBeNull();
  });

  it('Leader: có mục AI, chọn thì gửi ĐÚNG tin đó cho AI', async () => {
    mockedDuAn.mockResolvedValue([
      {
        id: 'p1',
        name: 'Nhóm EXE',
        members: [{ id: 'pm1', role: 'LEADER', user: { id: 'u1', email: '', fullName: 'Đại' } }],
      },
    ] as never);
    mockedGoiY.mockResolvedValue({ hasTask: true, title: 'Nộp báo cáo', confidence: 'high' });
    const man = await moMan();

    await nhanGiu(man, 'm3');
    await fireEvent.press(man.getByTestId('thao-tac-ai'));

    await waitFor(() => expect(mockedGoiY).toHaveBeenCalledTimes(1));
    expect(mockedGoiY.mock.calls[0][0]).toBe('p1');
    expect(mockedGoiY.mock.calls[0][1]).toBe('m3');
    expect(man.getByText('phiếu đề xuất AI')).toBeTruthy();
  });

  it('Leader nhấn giữ tin của chính mình: chỉ có mục AI', async () => {
    mockedWorkspace.mockReturnValue({ active: { id: 'w1', ownerId: 'u1' } } as never);
    const man = await moMan();

    await nhanGiu(man, 'm1');

    expect(man.getByText('Tạo công việc bằng AI')).toBeTruthy();
    expect(man.queryByText('Báo cáo tin nhắn')).toBeNull();
    expect(man.queryByText('Chặn người này')).toBeNull();
  });

  it('Báo cáo tin nhắn: gửi lý do cho đúng tin, rồi cảm ơn', async () => {
    mockedBaoCao.mockResolvedValue({ id: 'r1', status: 'OPEN' });
    const man = await moMan();

    await nhanGiu(man, 'm2');
    await fireEvent.press(man.getByTestId('thao-tac-bao-cao'));
    await fireEvent.press(man.getByTestId('ly-do-HARASSMENT'));
    await fireEvent.press(man.getByTestId('bao-cao-gui'));

    await waitFor(() =>
      expect(man.getByText('Đã gửi báo cáo. WeDo sẽ xem xét trong vòng 24 giờ.')).toBeTruthy(),
    );
    expect(mockedBaoCao.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        targetType: 'PROJECT_MESSAGE',
        targetId: 'm2',
        reason: 'HARASSMENT',
      }),
    );
  });

  it('Chặn: hỏi đúng câu, đồng ý thì tin người đó biến mất — cả tin tới sau qua socket', async () => {
    mockedChan.mockResolvedValue({ ok: true });
    const man = await moMan();

    await nhanGiu(man, 'm2');
    await fireEvent.press(man.getByTestId('thao-tac-chan'));

    expect(hopThoai).toHaveBeenCalledTimes(1);
    const [tieuDe, noiDung, nut] = hopThoai.mock.calls[0] as [
      string,
      string,
      Array<{ text: string; onPress?: () => void }>,
    ];
    expect(tieuDe).toBe('Chặn Tuấn?');
    expect(noiDung).toBe(
      'Bạn sẽ không thấy tin nhắn của người này nữa, và hai người không thể nhắn tin riêng hay kết bạn với nhau. Bạn có thể bỏ chặn trong Tài khoản → Người đã chặn.',
    );
    expect(mockedChan).not.toHaveBeenCalled();

    // Sau khi chặn, máy chủ trả danh sách có Tuấn.
    mockedDanhSachChan.mockResolvedValue([
      { userId: 'u2', fullName: 'Tuấn', avatarUrl: null, blockedAt: '2026-09-26T10:00:00.000Z' },
    ]);
    await act(async () => nut.find((n) => n.text === 'Chặn')?.onPress?.());

    await waitFor(() => expect(man.queryByText('Tuấn nói bậy')).toBeNull());
    expect(mockedChan.mock.calls[0][0]).toBe('u2');
    expect(man.getByText('Lan hỏi bài')).toBeTruthy();

    // Socket không lọc hộ: tin mới của người đã chặn vẫn phải bị giấu.
    await act(async () => socket.xuLy['message:project'](tin('m4', 'Tuấn lại nói', 'u2', 'Tuấn', 4) as never));
    await act(async () => socket.xuLy['message:project'](tin('m5', 'Lan trả lời', 'u3', 'Lan', 5) as never));

    expect(man.getByText('Lan trả lời')).toBeTruthy();
    expect(man.queryByText('Tuấn lại nói')).toBeNull();
  });

  it('Huỷ ở hộp xác nhận thì không chặn ai', async () => {
    const man = await moMan();

    await nhanGiu(man, 'm2');
    await fireEvent.press(man.getByTestId('thao-tac-chan'));
    const nut = hopThoai.mock.calls[0][2] as Array<{ text: string; style?: string }>;

    expect(nut.map((n) => n.text)).toEqual(['Huỷ', 'Chặn']);
    expect(nut[0].style).toBe('cancel');
    expect(mockedChan).not.toHaveBeenCalled();
    expect(man.getByText('Tuấn nói bậy')).toBeTruthy();
  });

  it('người đã chặn từ trước: tin của họ không hiện ngay từ đầu', async () => {
    mockedDanhSachChan.mockResolvedValue([
      { userId: 'u2', fullName: 'Tuấn', avatarUrl: null, blockedAt: '2026-09-25T10:00:00.000Z' },
    ]);
    const man = await render(dung());

    await waitFor(() => expect(man.getByText('Lan hỏi bài')).toBeTruthy());
    await waitFor(() => expect(man.queryByText('Tuấn nói bậy')).toBeNull());
  });
});
