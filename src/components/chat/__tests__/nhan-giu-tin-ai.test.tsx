import React from 'react';
import { Alert, Platform, type AlertButton } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ManChatDuAn from '../../../app/(tabs)/chat/[projectId]';
import { datDongYAI } from '../../../lib/api/account';
import {
  getProjectHistory,
  getProjectMessages,
  markProjectRead,
  requestTaskSuggestion,
  sendProjectMessage,
} from '../../../lib/api/chat';
import { getEntitlements } from '../../../lib/api/entitlements';
import { listProjects } from '../../../lib/api/projects';
import { useAuth } from '../../../lib/auth/auth-context';
import { useSocket } from '../../../lib/socket/socket-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import type { ChatMessage } from '../../../lib/types';

/*
  Nhấn giữ một tin trong chat dự án trên Android.

  Từ khi gộp nhánh ios (10/2026), nhấn giữ mở bảng thao tác (AI, báo cáo, chặn
  — Guideline 1.2); mục "Tạo công việc bằng AI" mới gửi tin cho AI. Các luật
  dưới đây áp cho mục đó.

  Trước đây nhấn giữ là gửi tin cho AI ngay, với MỌI người: thành viên thường
  mở bảng gợi ý rồi ăn 403 ("Chỉ Leader dự án mới được dùng AI…"), không ai được
  hỏi đồng ý trước khi tin nhắn đi tới nhà cung cấp AI, và tin còn đang gửi bị
  gửi lên bằng mã tạm.

  Đặt ở đây chứ không cạnh màn hình: mọi tệp dưới `src/app/` đều thành một
  đường dẫn của Expo Router.
*/

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ projectId: 'p1' }),
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: jest.fn() }),
  useFocusEffect: (hieuUng: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(() => hieuUng(), [hieuUng]);
  },
}));
jest.mock('../../../lib/api/chat', () => ({
  ...jest.requireActual('../../../lib/api/chat'),
  getProjectHistory: jest.fn(),
  getProjectMessages: jest.fn(),
  markProjectRead: jest.fn(),
  requestTaskSuggestion: jest.fn(),
  sendProjectFiles: jest.fn(),
  sendProjectMessage: jest.fn(),
}));
jest.mock('../../../lib/api/account', () => ({ datDongYAI: jest.fn() }));
jest.mock('../../../lib/api/projects');
jest.mock('../../../lib/api/entitlements', () => ({
  MA_HET_LUOT_AI: 'AI_QUOTA_EXCEEDED',
  getEntitlements: jest.fn(),
}));
jest.mock('../../../lib/api/moderation', () => ({
  ...jest.requireActual('../../../lib/api/moderation'),
  listBlocks: jest.fn(async () => []),
  blockUser: jest.fn(),
  reportContent: jest.fn(),
}));
jest.mock('../../../lib/auth/auth-context');
jest.mock('../../../lib/socket/socket-context');
jest.mock('../../../lib/workspace/workspace-context');
jest.mock('../../../lib/chat/use-header-tep', () => ({ useHeaderTep: () => undefined }));
jest.mock('../../../lib/images/pick-images', () => ({ chonAnh: jest.fn(), chupAnh: jest.fn() }));
jest.mock('../../../lib/observability/sentry', () => ({ baoLoi: jest.fn(), moTaTep: jest.fn() }));

/* Bong bóng tối giản: giữ đúng hợp đồng "thiếu onLongPress là nhấn giữ không làm gì". */
jest.mock('../MessageBubble', () => {
  const { Pressable: P, Text: T } = jest.requireActual('react-native');
  return {
    MessageBubble: ({
      message,
      onLongPress,
    }: {
      message: { id: string; content: string };
      onLongPress?: () => void;
    }) => (
      <P testID={`message-${message.id}`} onLongPress={() => onLongPress?.()}>
        <T>{message.content}</T>
      </P>
    ),
  };
});
let mockSoanTin: { onChangeText: (v: string) => void; onSend: () => void } | null = null;
jest.mock('../MessageComposer', () => ({
  MessageComposer: (props: never) => {
    mockSoanTin = props;
    return null;
  },
}));
jest.mock('../ImageViewer', () => ({ ImageViewer: () => null }));
jest.mock('../TaskSuggestionSheet', () => ({ TaskSuggestionSheet: () => null }));
jest.mock('../EmptyChat', () => {
  const { Text: T } = jest.requireActual('react-native');
  return { EmptyChat: ({ body }: { body: string }) => <T>{body}</T> };
});
jest.mock('../../ui/GradientHeader', () => {
  const { Text: T } = jest.requireActual('react-native');
  return { GradientHeader: ({ title }: { title: string }) => <T>{title}</T> };
});

const mockedTin = getProjectMessages as jest.MockedFunction<typeof getProjectMessages>;
const mockedLichSu = getProjectHistory as jest.MockedFunction<typeof getProjectHistory>;
const mockedDaDoc = markProjectRead as jest.MockedFunction<typeof markProjectRead>;
const mockedGui = sendProjectMessage as jest.MockedFunction<typeof sendProjectMessage>;
const mockedGoiY = requestTaskSuggestion as jest.MockedFunction<typeof requestTaskSuggestion>;
const mockedDongY = datDongYAI as jest.MockedFunction<typeof datDongYAI>;
const mockedDuAn = listProjects as jest.MockedFunction<typeof listProjects>;
const mockedHanMuc = getEntitlements as jest.MockedFunction<typeof getEntitlements>;
const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedSocket = useSocket as jest.MockedFunction<typeof useSocket>;
const mockedWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;

const TOI = { id: 'u1', email: 'u1@wedo.vn', fullName: 'Lê Hữu Đại' };
const BAN = { id: 'u2', email: 'u2@wedo.vn', fullName: 'Trần Minh' };

function tin(id: string, noiDung: string): ChatMessage {
  const luc = new Date(Date.UTC(2026, 8, 30, 10, 0)).toISOString();
  return {
    id,
    content: noiDung,
    workspaceId: 'w1',
    projectId: 'p1',
    authorId: 'u2',
    createdAt: luc,
    updatedAt: luc,
  };
}

function duAn(vaiTroCuaToi: 'LEADER' | 'MEMBER') {
  return [
    {
      id: 'p1',
      name: 'Closed Testing WeDo',
      members: [
        { role: vaiTroCuaToi, user: TOI },
        { role: vaiTroCuaToi === 'LEADER' ? 'MEMBER' : 'LEADER', user: BAN },
      ],
    },
  ];
}

function dangNhap(aiConsentAt: string | null) {
  mockedAuth.mockReturnValue({ user: { ...TOI, aiConsentAt }, capNhatHoSo: jest.fn() } as never);
}

let queryClient: QueryClient;
let nutHopThoai: AlertButton[] = [];
let heDieuHanh: jest.ReplaceProperty<typeof Platform.OS> | undefined;

function dung() {
  return (
    <QueryClientProvider client={queryClient}>
      <ManChatDuAn />
    </QueryClientProvider>
  );
}

/* Nhấn giữ tin m1 rồi chọn "Tạo công việc bằng AI" trên bảng thao tác (Android). */
async function nhanGiuRoiChonAI(man: Awaited<ReturnType<typeof render>>) {
  await fireEvent(man.getByTestId('message-m1'), 'longPress');
  await fireEvent.press(man.getByTestId('thao-tac-ai'));
}

async function moVaChoTin(tinNhan: ChatMessage[] = [tin('m1', 'Mai nộp báo cáo nhé')]) {
  mockedTin.mockResolvedValue(tinNhan);
  const man = await render(dung());
  // Danh sách dự án (vai trò) phải về trước khi nhấn giữ — giống người dùng thật.
  await waitFor(() => expect(man.getByText('Closed Testing WeDo')).toBeTruthy());
  return man;
}

beforeEach(() => {
  jest.clearAllMocks();
  heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
  nutHopThoai = [];
  mockSoanTin = null;
  jest.spyOn(Alert, 'alert').mockImplementation((_tieuDe, _noiDung, nut) => {
    nutHopThoai = nut ?? [];
  });
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  dangNhap('2026-09-20T10:00:00.000Z');
  mockedSocket.mockReturnValue({
    socket: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
    connected: true,
    onlineUserIds: new Set(),
  } as never);
  mockedWorkspace.mockReturnValue({ active: { id: 'w1', ownerId: 'u9' } } as never);
  mockedHanMuc.mockReturnValue(new Promise(() => undefined) as never);
  mockedDaDoc.mockResolvedValue({ ok: true } as never);
  mockedLichSu.mockResolvedValue({ items: [], nextCursor: null } as never);
  mockedGoiY.mockResolvedValue({ hasTask: true, title: 'Nộp báo cáo', confidence: 'high' } as never);
});

afterEach(() => {
  heDieuHanh?.restore();
  heDieuHanh = undefined;
  jest.restoreAllMocks();
  queryClient.clear();
});

describe('nhấn giữ tin trong chat dự án', () => {
  it('thành viên thường: không gọi AI, không hỏi gì', async () => {
    mockedDuAn.mockResolvedValue(duAn('MEMBER') as never);
    const man = await moVaChoTin();

    await fireEvent(man.getByTestId('message-m1'), 'longPress');

    // Bảng vẫn mở (Báo cáo, Chặn) nhưng không có mục AI.
    expect(man.getByTestId('thao-tac-bao-cao')).toBeTruthy();
    expect(man.queryByTestId('thao-tac-ai')).toBeNull();
    expect(mockedGoiY).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('Leader đã đồng ý dùng AI: gửi đúng tin đó cho AI', async () => {
    mockedDuAn.mockResolvedValue(duAn('LEADER') as never);
    const man = await moVaChoTin();

    await nhanGiuRoiChonAI(man);

    await waitFor(() => expect(mockedGoiY).toHaveBeenCalledTimes(1));
    expect(mockedGoiY.mock.calls[0][0]).toBe('p1');
    expect(mockedGoiY.mock.calls[0][1]).toBe('m1');
  });

  it('chủ không gian làm việc cũng được dùng, như máy chủ cho phép', async () => {
    mockedWorkspace.mockReturnValue({ active: { id: 'w1', ownerId: 'u1' } } as never);
    mockedDuAn.mockResolvedValue(duAn('MEMBER') as never);
    const man = await moVaChoTin();

    await nhanGiuRoiChonAI(man);

    await waitFor(() => expect(mockedGoiY).toHaveBeenCalledTimes(1));
  });

  it('Leader chưa đồng ý: hỏi trước, chưa gửi gì; đồng ý xong mới gửi', async () => {
    dangNhap(null);
    mockedDongY.mockResolvedValue({ aiConsentAt: '2026-10-01T00:00:00.000Z' });
    mockedDuAn.mockResolvedValue(duAn('LEADER') as never);
    const man = await moVaChoTin();

    await nhanGiuRoiChonAI(man);

    expect(Alert.alert).toHaveBeenCalledWith('Dùng AI để gợi ý công việc?', expect.any(String), expect.any(Array));
    expect(mockedGoiY).not.toHaveBeenCalled();

    await act(async () => nutHopThoai.find((nut) => nut.text === 'Đồng ý')?.onPress?.());

    await waitFor(() => expect(mockedGoiY).toHaveBeenCalledTimes(1));
    expect(mockedDongY).toHaveBeenCalledWith(true);
  });

  it('Leader từ chối: không gửi gì cho AI', async () => {
    dangNhap(null);
    mockedDuAn.mockResolvedValue(duAn('LEADER') as never);
    const man = await moVaChoTin();

    await nhanGiuRoiChonAI(man);
    await act(async () => nutHopThoai.find((nut) => nut.text === 'Không, cảm ơn')?.onPress?.());

    expect(mockedGoiY).not.toHaveBeenCalled();
    expect(mockedDongY).not.toHaveBeenCalled();
  });

  it('tin còn đang gửi (mã tạm trên máy) thì nhấn giữ không gửi gì lên', async () => {
    mockedDuAn.mockResolvedValue(duAn('LEADER') as never);
    mockedGui.mockReturnValue(new Promise(() => undefined) as never);
    const man = await moVaChoTin([]);

    await act(async () => mockSoanTin?.onChangeText('Tin mới'));
    await act(async () => mockSoanTin?.onSend());
    await waitFor(() => expect(man.getByText('Tin mới')).toBeTruthy());

    const bongBong = man.getAllByTestId(/^message-/);
    await fireEvent(bongBong[0], 'longPress');

    expect(mockedGoiY).not.toHaveBeenCalled();
  });

  it('khung chat trống: chỉ hứa AI với người dùng được nó', async () => {
    mockedDuAn.mockResolvedValue(duAn('MEMBER') as never);
    const thanhVien = await moVaChoTin([]);
    expect(thanhVien.getByText('Gửi tin nhắn đầu tiên cho cả nhóm.')).toBeTruthy();
    expect(thanhVien.queryByText(/AI/)).toBeNull();
    thanhVien.unmount();
    queryClient.clear();

    mockedDuAn.mockResolvedValue(duAn('LEADER') as never);
    const leader = await moVaChoTin([]);
    expect(
      leader.getByText('Gửi tin nhắn đầu tiên. Nhấn giữ một tin nhắn bất kỳ để nhờ AI biến nó thành công việc.'),
    ).toBeTruthy();
  });
});
