import React from 'react';
import { Alert, Platform } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ManChatDuAn from '../../../app/(tabs)/chat/[projectId]';
import ManDanhSachChat from '../../../app/(tabs)/chat/index';
import ManBanBe from '../../../app/(tabs)/chat/friends';
import ManTinNhanRieng from '../../../app/(tabs)/chat/dm/[conversationId]';
import { PhieuBaoCao } from '../../moderation/PhieuBaoCao';
import { TaskSuggestionSheet } from '../TaskSuggestionSheet';
import { MoiVaoNhomSheet } from '../MoiVaoNhomSheet';
import { NhapMaMoiSheet } from '../NhapMaMoiSheet';
import { MessageBubble } from '../MessageBubble';
import { ConversationRow } from '../ConversationRow';
import { ProjectRow } from '../ProjectRow';
import { MessageComposer } from '../MessageComposer';
import { getProjectMessages, markProjectRead, requestTaskSuggestion } from '../../../lib/api/chat';
import { getDirectMessages, listConversations, markConversationRead } from '../../../lib/api/direct-chat';
import { datDongYAI } from '../../../lib/api/account';
import { ApiError } from '../../../lib/api/client';
import { getEntitlements } from '../../../lib/api/entitlements';
import { listFriends, searchUsers } from '../../../lib/api/friends';
import { layLoiMoi, xemTruocLoiMoi } from '../../../lib/api/loi-moi';
import { MA_QUA_NHIEU_BAO_CAO, listBlocks, reportContent } from '../../../lib/api/moderation';
import { listProjects } from '../../../lib/api/projects';
import { LoiGuiDoDang, cauGuiDoDang } from '../../../lib/api/chat-files';
import { useAuth } from '../../../lib/auth/auth-context';
import { docHanChotAI } from '../../../lib/chat/create-task-from-message';
import { typingLabel } from '../../../lib/chat/typing-state';
import { cauLoiMoi, hienThiHanMoi, noiDungChiaSe } from '../../../lib/loi-moi';
import { duongBoChan, lyDoBaoCao, noiDungXacNhanChan } from '../../../lib/moderation/noi-dung';
import { useSocket } from '../../../lib/socket/socket-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { chuVietConSot } from '../../../i18n/chu-viet-con-sot';
import { datNgonNguChoKiemThu } from '../../../i18n/ngon-ngu';
import { renderScreen } from '../../../test-utils/render';
import type { ChatMessage, DirectConversation, DirectMessage } from '../../../lib/types';

/*
  Khu vực Trò chuyện, Bạn bè và Báo cáo/Chặn ở tiếng Anh: không còn chữ tiếng
  Việt nào hiện ra, trừ nội dung tin nhắn và tên người (dữ liệu của người dùng).

  Đặt ở components/ chứ không cạnh màn hình: mọi tệp dưới `src/app/(tabs)/` đều
  thành một tab.
*/

let mockThamSo: { projectId?: string; conversationId?: string; ten?: string } = { projectId: 'p1' };
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockThamSo,
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: jest.fn() }),
  useFocusEffect: (hieuUng: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(hieuUng, [hieuUng]);
  },
}));
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native');
  return { __esModule: true, default: { View }, useAnimatedStyle: () => ({}) };
});
jest.mock('../../../lib/api/chat', () => ({
  ...jest.requireActual('../../../lib/api/chat'),
  getProjectHistory: jest.fn(async () => ({ items: [], nextCursor: null })),
  getProjectMessages: jest.fn(),
  getProjectUnreadCount: jest.fn(async () => ({ count: 0 })),
  markProjectRead: jest.fn(),
  requestTaskSuggestion: jest.fn(),
  sendProjectFiles: jest.fn(),
  sendProjectMessage: jest.fn(),
}));
jest.mock('../../../lib/api/direct-chat', () => ({
  ...jest.requireActual('../../../lib/api/direct-chat'),
  getDirectHistory: jest.fn(),
  getDirectMessages: jest.fn(),
  listConversations: jest.fn(),
  markConversationRead: jest.fn(),
  startConversation: jest.fn(),
}));
jest.mock('../../../lib/api/friends', () => ({
  ...jest.requireActual('../../../lib/api/friends'),
  listFriends: jest.fn(),
  searchUsers: jest.fn(),
  sendFriendRequest: jest.fn(),
  respondToRequest: jest.fn(),
}));
jest.mock('../../../lib/api/loi-moi', () => ({
  layLoiMoi: jest.fn(),
  taoLoiMoi: jest.fn(),
  tatLoiMoi: jest.fn(),
  xemTruocLoiMoi: jest.fn(),
  thamGiaLoiMoi: jest.fn(),
}));
jest.mock('../../../lib/api/moderation', () => ({
  ...jest.requireActual('../../../lib/api/moderation'),
  listBlocks: jest.fn(),
  blockUser: jest.fn(),
  reportContent: jest.fn(),
}));
jest.mock('../../../lib/api/projects');
jest.mock('../../../lib/api/workspaces');
jest.mock('../../../lib/api/account', () => ({ datDongYAI: jest.fn() }));
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
jest.mock('../../../lib/use-debounced-value', () => ({ useDebouncedValue: (gia: unknown) => gia }));
jest.mock('../../../lib/version/use-phien-ban', () => ({
  usePhienBan: () => ({ muc: 'moi-nhat', latest: '', notes: '' }),
}));

const mockedTin = getProjectMessages as jest.MockedFunction<typeof getProjectMessages>;
const mockedDaDoc = markProjectRead as jest.MockedFunction<typeof markProjectRead>;
const mockedGoiY = requestTaskSuggestion as jest.MockedFunction<typeof requestTaskSuggestion>;
const mockedHanMuc = getEntitlements as jest.MockedFunction<typeof getEntitlements>;
const mockedDongYAI = datDongYAI as jest.MockedFunction<typeof datDongYAI>;
const mockedDanhSachChan = listBlocks as jest.MockedFunction<typeof listBlocks>;
const mockedBaoCao = reportContent as jest.MockedFunction<typeof reportContent>;
const mockedDuAn = listProjects as jest.MockedFunction<typeof listProjects>;
const mockedBanBe = listFriends as jest.MockedFunction<typeof listFriends>;
const mockedTim = searchUsers as jest.MockedFunction<typeof searchUsers>;
const mockedHoiThoai = listConversations as jest.MockedFunction<typeof listConversations>;
const mockedTinRieng = getDirectMessages as jest.MockedFunction<typeof getDirectMessages>;
const mockedDaDocRieng = markConversationRead as jest.MockedFunction<typeof markConversationRead>;
const mockedLayLoiMoi = layLoiMoi as jest.MockedFunction<typeof layLoiMoi>;
const mockedXemTruoc = xemTruocLoiMoi as jest.MockedFunction<typeof xemTruocLoiMoi>;
const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedSocket = useSocket as jest.MockedFunction<typeof useSocket>;
const mockedWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;

/** Tên người và tên dự án trong dữ liệu mẫu là tiếng Việt — dữ liệu của người dùng, không dịch. */
const BO_QUA = ['Tuấn', 'Đại', 'Lan', 'Bảo', 'Nhóm EXE', 'Lê Hữu Đại', 'Lớp', 'Bạn học'];

const TRANG_THAI_DAY_DU = { friends: [], incoming: [], outgoing: [] };

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
  { id: 'pm1', role: 'LEADER', user: { id: 'u1', email: '', fullName: 'Đại' } },
  { id: 'pm2', role: 'MEMBER', user: { id: 'u2', email: '', fullName: 'Tuấn' } },
];

let queryClient: QueryClient;
let hopThoai: jest.SpyInstance;
let heDieuHanh: { restore: () => void } | null = null;

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

const cay = (man: { toJSON: () => unknown }) => {
  const goc = man.toJSON();
  return JSON.stringify((Array.isArray(goc) ? goc : [goc]).flatMap((n) => gomChu(n)));
};

beforeEach(() => {
  jest.clearAllMocks();
  datNgonNguChoKiemThu('en');
  // Bảng trượt của Android: bấm được bằng testID.
  heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
  hopThoai = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  mockedAuth.mockReturnValue({
    user: { id: 'u1', fullName: 'Lê Hữu Đại' },
    capNhatHoSo: jest.fn(),
  } as never);
  mockedSocket.mockReturnValue({
    socket: null,
    connected: true,
    onlineUserIds: new Set(['u2']),
  } as never);
  mockedWorkspace.mockReturnValue({
    active: { id: 'w1', name: 'Lớp', ownerId: 'chu-khac' },
    workspaces: [],
    switchTo: jest.fn(),
    refresh: jest.fn(),
  } as never);
  mockedDuAn.mockResolvedValue([
    { id: 'p1', name: 'Nhóm EXE', workspaceId: 'w1', members: THANH_VIEN, _count: { members: 2, tasks: 1 } },
  ] as never);
  mockedHanMuc.mockReturnValue(new Promise(() => undefined) as never);
  mockedDaDoc.mockResolvedValue({ ok: true } as never);
  mockedDaDocRieng.mockResolvedValue({ ok: true } as never);
  mockedDanhSachChan.mockResolvedValue([]);
  mockedBanBe.mockResolvedValue(TRANG_THAI_DAY_DU);
  mockedTim.mockResolvedValue([]);
  mockedHoiThoai.mockResolvedValue([]);
  mockedTin.mockResolvedValue([
    tin('m1', 'Tin của tôi', 'u1', 'Đại', 1),
    tin('m2', 'Tuấn nói bậy', 'u2', 'Tuấn', 2),
  ]);
});

afterEach(() => {
  mockThamSo = { projectId: 'p1' };
  hopThoai.mockRestore();
  heDieuHanh?.restore();
  heDieuHanh = null;
  queryClient.clear();
});

function boc(man: React.ReactElement) {
  return <QueryClientProvider client={queryClient}>{man}</QueryClientProvider>;
}

describe('danh sách trò chuyện ở tiếng Anh', () => {
  it('tab Projects và tab Messages (trống) không còn chữ tiếng Việt', async () => {
    mockedDuAn.mockResolvedValue([]);
    const man = await renderScreen(boc(<ManDanhSachChat />));
    await waitFor(() => man.getByText('No projects yet'));
    expect(man.getByText('Hi Đại')).toBeTruthy();
    expect(man.getByText('Projects')).toBeTruthy();
    expect(man.getByText('Enter invite code')).toBeTruthy();
    expect(chuVietConSot(cay(man), BO_QUA)).toEqual([]);

    await fireEvent.press(man.getByTestId('segment-tin-nhan'));
    await waitFor(() => man.getByText('No conversations yet'));
    expect(man.getByText('New message')).toBeTruthy();
    expect(chuVietConSot(cay(man), BO_QUA)).toEqual([]);
  });

  it('có dự án: dòng dự án ghi số thành viên và số việc bằng tiếng Anh, có huy hiệu lời mời bạn', async () => {
    mockedBanBe.mockResolvedValue({
      friends: [],
      incoming: [{ id: 'f1' } as never],
      outgoing: [],
    });
    const man = await renderScreen(boc(<ManDanhSachChat />));
    await waitFor(() => man.getByText('Nhóm EXE'));
    expect(man.getByText('2 members · 1 task')).toBeTruthy();
    await waitFor(() => expect(man.getByLabelText('Friends, 1 pending request')).toBeTruthy());
    expect(chuVietConSot(cay(man), BO_QUA)).toEqual([]);
  });
});

describe('khung chat dự án ở tiếng Anh', () => {
  async function moMan() {
    const man = await renderScreen(boc(<ManChatDuAn />));
    await waitFor(() => expect(man.getByText('Tuấn nói bậy')).toBeTruthy());
    await waitFor(() => expect(man.getByText('Nhóm EXE')).toBeTruthy());
    return man;
  }

  it('khung chat, ô soạn tin không còn chữ tiếng Việt', async () => {
    const man = await moMan();
    expect(man.getByPlaceholderText('Type a message…')).toBeTruthy();
    expect(man.getByLabelText('Write a message')).toBeTruthy();
    expect(chuVietConSot(cay(man), [...BO_QUA, 'Tin của tôi', 'Tuấn nói bậy'])).toEqual([]);
  });

  it('khung trống Leader và thành viên đều có chữ tiếng Anh', async () => {
    mockedTin.mockResolvedValue([]);
    const man = await renderScreen(boc(<ManChatDuAn />));
    await waitFor(() => man.getByText('No messages yet'));
    await waitFor(() => man.getByText('Nhóm EXE'));
    expect(man.getByText(/Send the first message\. Press and hold any message/)).toBeTruthy();
    expect(chuVietConSot(cay(man), BO_QUA)).toEqual([]);
  });

  it('nhấn giữ: bảng thao tác, phiếu báo cáo, hộp thoại chặn và xin đồng ý AI đều bằng tiếng Anh', async () => {
    const man = await moMan();

    await fireEvent(man.getByTestId('message-m2'), 'longPress');
    expect(man.getByText('Create task with AI')).toBeTruthy();
    expect(man.getByText('Report message')).toBeTruthy();
    expect(man.getByText('Block this person')).toBeTruthy();
    expect(man.getByText('Cancel')).toBeTruthy();
    expect(chuVietConSot(cay(man), [...BO_QUA, 'Tuấn nói bậy', 'Tin của tôi'])).toEqual([]);

    // Xin đồng ý dùng AI: nói rõ gửi gì, cho ai.
    await fireEvent.press(man.getByTestId('thao-tac-ai'));
    const [tieuDe, noiDung, nut] = hopThoai.mock.calls[0];
    expect(tieuDe).toBe('Use AI to suggest tasks?');
    expect(noiDung).toContain('third-party AI provider');
    expect(noiDung).toContain('Google Gemini, Azure OpenAI or OpenAI');
    expect(noiDung).toContain('does not send anyone’s email or phone number');
    expect(chuVietConSot(`${tieuDe} ${noiDung}`)).toEqual([]);
    expect((nut as { text: string }[]).map((n) => n.text)).toEqual(['No, thanks', 'Agree']);

    // Chặn: câu hỏi và đường dẫn bỏ chặn dùng đúng tên ở tab Tài khoản.
    hopThoai.mockClear();
    await fireEvent(man.getByTestId('message-m2'), 'longPress');
    await fireEvent.press(man.getByTestId('thao-tac-chan'));
    const [tieuDeChan, noiDungChan, nutChan] = hopThoai.mock.calls[0];
    expect(tieuDeChan).toBe('Block Tuấn?');
    expect(noiDungChan).toContain('Account → Blocked people');
    expect(chuVietConSot(noiDungChan)).toEqual([]);
    expect((nutChan as { text: string }[]).map((n) => n.text)).toEqual(['Cancel', 'Block']);

    // Báo cáo
    await fireEvent(man.getByTestId('message-m2'), 'longPress');
    await fireEvent.press(man.getByTestId('thao-tac-bao-cao'));
    expect(man.getByText('Why are you reporting this message?')).toBeTruthy();
    expect(chuVietConSot(cay(man), [...BO_QUA, 'Tuấn nói bậy', 'Tin của tôi'])).toEqual([]);
  });

  it('hết lượt AI: băng hạn mức đổi ngôn ngữ ngay khi đổi ngôn ngữ (không giữ câu cũ trong state)', async () => {
    mockedHanMuc.mockResolvedValue({
      usage: { aiDetections: { used: 10, limit: 10, remaining: 0, pending: 0, periodEnd: '2026-10-31T23:59:00.000Z' } },
    } as never);
    const man = await moMan();
    await waitFor(() => expect(man.getByText(/You’ve used all 10 AI credits/)).toBeTruthy());

    await act(async () => {
      datNgonNguChoKiemThu('vi');
    });
    expect(man.getByText(/Đã dùng hết 10 lượt AI/)).toBeTruthy();
    expect(man.queryByText(/You’ve used all/)).toBeNull();
  });

  it('phiếu AI báo lỗi hết lượt theo ngôn ngữ lúc vẽ', async () => {
    mockedAuth.mockReturnValue({
      user: { id: 'u1', fullName: 'Lê Hữu Đại', aiConsentAt: '2026-09-20T10:00:00.000Z' },
      capNhatHoSo: jest.fn(),
    } as never);
    const so = { used: 10, limit: 10, remaining: 0, pending: 0, periodEnd: '2026-10-31T23:59:00.000Z' };
    mockedHanMuc.mockResolvedValue({ usage: { aiDetections: so } } as never);
    mockedGoiY.mockRejectedValue(new ApiError('Bạn đã dùng hết lượt AI.', 429, 'AI_QUOTA_EXCEEDED'));
    const man = await moMan();
    await waitFor(() => expect(mockedHanMuc).toHaveBeenCalled());

    await fireEvent(man.getByTestId('message-m2'), 'longPress');
    await fireEvent.press(man.getByTestId('thao-tac-ai'));

    await waitFor(() => expect(man.getAllByText(/You’ve used all 10 AI credits/).length).toBeGreaterThan(0));
    expect(chuVietConSot(cay(man), [...BO_QUA, 'Tuấn nói bậy', 'Tin của tôi'])).toEqual([]);
  });
});

describe('màn Friends ở tiếng Anh', () => {
  it('danh sách, lời mời, lời mời đã gửi và ô tìm kiếm', async () => {
    const nguoi = (id: string, fullName: string) => ({ id, fullName, email: `${id}@wedo.vn` });
    const quanHe = (id: string, requesterId: string, addresseeId: string, status: string) => ({
      id,
      pairKey: `${requesterId}:${addresseeId}`,
      requesterId,
      addresseeId,
      status,
      createdAt: '',
      updatedAt: '',
      requester: nguoi(requesterId, requesterId === 'u1' ? 'Đại' : `Bạn ${requesterId}`),
      addressee: nguoi(addresseeId, addresseeId === 'u1' ? 'Đại' : `Bạn ${addresseeId}`),
    });
    mockedBanBe.mockResolvedValue({
      friends: [quanHe('f1', 'u1', 'u2', 'ACCEPTED')],
      incoming: [quanHe('f2', 'u3', 'u1', 'PENDING')],
      outgoing: [quanHe('f3', 'u1', 'u4', 'PENDING')],
    } as never);
    const man = await renderScreen(boc(<ManBanBe />));
    await waitFor(() => man.getByText('Friends (1)'));
    expect(man.getByText('Requests waiting for you (1)')).toBeTruthy();
    expect(man.getByText('Sent, pending (1)')).toBeTruthy();
    expect(man.getByText('Message')).toBeTruthy();
    expect(man.getByText('Accept')).toBeTruthy();
    expect(man.getByText('Decline')).toBeTruthy();
    expect(man.getByText('Request sent')).toBeTruthy();
    expect(chuVietConSot(cay(man), [...BO_QUA, 'Bạn u'])).toEqual([]);

    await fireEvent.changeText(man.getByTestId('tim-nguoi'), 'Vy');
    expect(man.getByText('Type at least 3 characters to search.')).toBeTruthy();
    await fireEvent.changeText(man.getByTestId('tim-nguoi'), 'Vyxyz');
    await waitFor(() => man.getByText('No one matches “Vyxyz”. Try their full email or phone number.'));
    expect(chuVietConSot(cay(man), [...BO_QUA, 'Bạn u'])).toEqual([]);
  });

  it('chưa có bạn: câu hướng dẫn tiếng Anh và tên màn khớp với màn Người đã chặn', async () => {
    const man = await renderScreen(boc(<ManBanBe />));
    await waitFor(() => man.getByText('Friends (0)'));
    expect(man.getByText(/No friends yet\./)).toBeTruthy();
    expect(chuVietConSot(cay(man), BO_QUA)).toEqual([]);
  });
});

describe('tin nhắn riêng ở tiếng Anh', () => {
  const DM: DirectMessage = {
    id: 'd1',
    conversationId: 'c1',
    senderId: 'u2',
    content: 'Chào Đại',
    createdAt: new Date(Date.UTC(2026, 8, 30, 10, 1)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 8, 30, 10, 1)).toISOString(),
    sender: { id: 'u2', email: '', fullName: 'Bảo' },
  };

  it('khung trống, bảng thao tác và lỗi tải', async () => {
    mockThamSo = { conversationId: 'c1', ten: 'Bảo' };
    mockedTinRieng.mockResolvedValue([]);
    mockedHoiThoai.mockResolvedValue([]);
    const man = await renderScreen(boc(<ManTinNhanRieng />));
    await waitFor(() => man.getByText('No messages yet'));
    expect(man.getByText('Say hi to start the conversation.')).toBeTruthy();
    expect(chuVietConSot(cay(man), BO_QUA)).toEqual([]);
  });

  it('nhấn giữ tin của người kia: báo cáo và chặn bằng tiếng Anh', async () => {
    mockThamSo = { conversationId: 'c1', ten: 'Bảo' };
    mockedTinRieng.mockResolvedValue([DM]);
    const man = await renderScreen(boc(<ManTinNhanRieng />));
    await waitFor(() => man.getByText('Chào Đại'));
    await fireEvent(man.getByTestId('message-d1'), 'longPress');
    expect(man.getByText('Report message')).toBeTruthy();
    expect(man.getByText('Block this person')).toBeTruthy();
    expect(chuVietConSot(cay(man), [...BO_QUA, 'Chào Đại'])).toEqual([]);
  });

  it('lỗi tải tin nhắn hiện câu tiếng Anh', async () => {
    mockThamSo = { conversationId: 'c1', ten: 'Bảo' };
    mockedTinRieng.mockRejectedValue(new ApiError('Máy chủ đang bận.', 500));
    const man = await renderScreen(boc(<ManTinNhanRieng />));
    await waitFor(() => expect(man.queryByText('Máy chủ đang bận.')).toBeNull());
    await waitFor(() => man.getByText('Couldn’t load messages.'));
  });
});

describe('phiếu báo cáo ở tiếng Anh', () => {
  it('báo cáo người: tiêu đề, lý do, ô ghi chú và lỗi quá nhiều báo cáo', async () => {
    mockedBaoCao.mockRejectedValue(new ApiError('Quá nhiều', 429, MA_QUA_NHIEU_BAO_CAO));
    const man = await renderScreen(
      boc(
        <PhieuBaoCao
          doiTuong={{ targetType: 'USER', targetId: 'u9', tenNguoi: 'Tuấn' }}
          onDong={jest.fn()}
        />,
      ),
    );
    expect(man.getByText('Report Tuấn')).toBeTruthy();
    expect(man.getByText('Why are you reporting this person?')).toBeTruthy();
    for (const nhan of [
      'Spam or ads',
      'Harassment or bullying',
      'Hate or discrimination',
      'Sexual content',
      'Violence or threats',
      'Another reason',
    ]) {
      expect(man.getByText(nhan)).toBeTruthy();
    }
    expect(man.getByText('Extra notes (optional)')).toBeTruthy();
    expect(man.getByPlaceholderText('Briefly describe what concerns you')).toBeTruthy();
    expect(chuVietConSot(cay(man), BO_QUA)).toEqual([]);

    await fireEvent.press(man.getByTestId('ly-do-SPAM'));
    await fireEvent.press(man.getByTestId('bao-cao-gui'));
    await waitFor(() =>
      man.getByText('You’ve sent a lot of reports in the past 24 hours. Please try again later.'),
    );
    expect(chuVietConSot(cay(man), BO_QUA)).toEqual([]);
  });

  it('đã gửi: lời cảm ơn tiếng Anh', async () => {
    mockedBaoCao.mockResolvedValue({ id: 'r1', status: 'OPEN' });
    const man = await renderScreen(
      boc(<PhieuBaoCao doiTuong={{ targetType: 'PROJECT_MESSAGE', targetId: 'm1' }} onDong={jest.fn()} />),
    );
    await fireEvent.press(man.getByTestId('ly-do-SPAM'));
    await fireEvent.press(man.getByTestId('bao-cao-gui'));
    await waitFor(() => man.getByText('Report sent. WeDo will review it within 24 hours.'));
    expect(chuVietConSot(cay(man))).toEqual([]);
  });

  it('thứ tự và nhãn lý do khớp mã máy chủ ở cả hai ngôn ngữ', () => {
    expect(lyDoBaoCao('en').map((x) => x.ma)).toEqual(lyDoBaoCao('vi').map((x) => x.ma));
    expect(lyDoBaoCao('vi')[0].nhan).toBe('Spam, quảng cáo');
  });
});

describe('phiếu đề xuất công việc ở tiếng Anh', () => {
  const doiNguoi = [
    { id: 'u1', email: '', fullName: 'Đại' },
    { id: 'u2', email: '', fullName: 'Tuấn' },
  ];

  it('phiếu có đề xuất: nhãn, độ tin cậy và lỗi ngày giờ bằng tiếng Anh, đổi theo ngôn ngữ', async () => {
    const man = await renderScreen(
      <TaskSuggestionSheet
        visible
        members={doiNguoi}
        currentUserId="u1"
        sourceMessage="Nộp báo cáo"
        suggestion={{ hasTask: true, title: 'Nộp báo cáo', confidence: 'medium', dueDate: 'mai' }}
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );
    expect(man.getByText('Suggested task')).toBeTruthy();
    expect(man.getByText('Medium confidence')).toBeTruthy();
    expect(man.getByText('You')).toBeTruthy();
    expect(man.getByText('Unassigned')).toBeTruthy();
    await fireEvent.press(man.getByTestId('suggestion-confirm'));
    expect(man.getByText('The due date isn’t valid. Use day/month/year, for example 30/09/2026.')).toBeTruthy();
    expect(chuVietConSot(cay(man), [...BO_QUA, 'Nộp báo cáo'])).toEqual([]);

    // Lỗi giữ dạng mã nên đổi ngôn ngữ thì băng đỏ đổi theo.
    await act(async () => {
      datNgonNguChoKiemThu('vi');
    });
    expect(man.getByText('Ngày hết hạn chưa đúng. Viết theo dạng ngày/tháng/năm, ví dụ 30/09/2026.')).toBeTruthy();
  });

  it('đang đọc và không có việc', async () => {
    const dang = await renderScreen(
      <TaskSuggestionSheet visible loading members={[]} onConfirm={jest.fn()} onDismiss={jest.fn()} />,
    );
    expect(dang.getByText('AI is reading the message…')).toBeTruthy();
    expect(chuVietConSot(cay(dang))).toEqual([]);

    const khong = await renderScreen(
      <TaskSuggestionSheet
        visible
        members={[]}
        suggestion={{ hasTask: false, title: '', confidence: 'low' }}
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );
    expect(khong.getByText('This message doesn’t seem to contain a task')).toBeTruthy();
    expect(chuVietConSot(cay(khong))).toEqual([]);
  });
});

describe('mã mời ở tiếng Anh', () => {
  it('nhập mã mời: xem trước và lỗi', async () => {
    mockedXemTruoc.mockRejectedValueOnce(new ApiError('Không tìm thấy', 404, 'INVITE_NOT_FOUND'));
    const man = await renderScreen(<NhapMaMoiSheet visible onDismiss={jest.fn()} onDaThamGia={jest.fn()} />);
    expect(man.getByText('Enter invite code')).toBeTruthy();
    await fireEvent.changeText(man.getByTestId('o-ma-moi'), '7K3M9QXA');
    await fireEvent.press(man.getByTestId('nut-xem-loi-moi'));
    await waitFor(() => man.getByText('That invite code isn’t valid or can’t be used anymore.'));
    expect(chuVietConSot(cay(man))).toEqual([]);

    mockedXemTruoc.mockResolvedValueOnce({
      projectName: 'Nhóm EXE',
      workspaceName: 'Lớp',
      leaderName: 'Đại',
      memberCount: 1,
      expiresAt: '2026-10-31T10:05:00.000Z',
    });
    await fireEvent.changeText(man.getByTestId('o-ma-moi'), '7K3M9QXB');
    await fireEvent.press(man.getByTestId('nut-xem-loi-moi'));
    await waitFor(() => man.getByText('Workspace Lớp · Leader Đại · 1 member'));
    expect(man.getByText('Join')).toBeTruthy();
    expect(chuVietConSot(cay(man), BO_QUA)).toEqual([]);
  });

  it('mời vào nhóm: hạn và số người tham gia bằng tiếng Anh', async () => {
    mockedLayLoiMoi.mockResolvedValue({
      code: '7K3M9QXA',
      url: 'https://wedofpt.com.vn/#/moi/7K3M9QXA',
      expiresAt: '2026-10-31T10:05:00.000Z',
      useCount: 2,
    });
    const man = await renderScreen(
      <MoiVaoNhomSheet visible projectId="p1" projectName="Nhóm EXE" onDismiss={jest.fn()} />,
    );
    await waitFor(() => man.getByText(/^Expires Oct 31, 2026.* · 2 people joined$/));
    expect(man.getByText('Invite to team')).toBeTruthy();
    expect(man.getByText('Share invite link')).toBeTruthy();
    expect(man.getByText('Create new link')).toBeTruthy();
    expect(man.getByText('Turn off link')).toBeTruthy();
    expect(chuVietConSot(cay(man), BO_QUA)).toEqual([]);

    await fireEvent.press(man.getByTestId('nut-tat-link'));
    expect(hopThoai.mock.calls[0][0]).toBe('Turn off the invite link?');
    expect(chuVietConSot(JSON.stringify(hopThoai.mock.calls[0]))).toEqual([]);
  });
});

describe('dòng và ô soạn tin ở tiếng Anh', () => {
  it('dòng hội thoại đang hoạt động, ô soạn tin có nhãn bỏ ảnh', async () => {
    const hoiThoai = {
      id: 'c1',
      pairKey: 'u1:u2',
      createdAt: '',
      updatedAt: '',
      unreadCount: 0,
      participants: [
        { id: 'pa1', userId: 'u1', user: { id: 'u1', email: '', fullName: 'Đại' } },
        { id: 'pa2', userId: 'u2', user: { id: 'u2', email: 'bao@wedo.vn', fullName: 'Bảo' } },
      ],
    } as DirectConversation;
    const man = await renderScreen(
      <ConversationRow conversation={hoiThoai} currentUserId="u1" online onPress={jest.fn()} />,
    );
    expect(man.getByText('Active now')).toBeTruthy();

    const soan = await renderScreen(
      <MessageComposer
        value=""
        onChangeText={jest.fn()}
        onSend={jest.fn()}
        anhDaChon={[{ uri: 'file:///a.jpg', name: 'a.jpg', mimeType: 'image/jpeg' }]}
        onChup={jest.fn()}
        onChonAnh={jest.fn()}
        onBoAnh={jest.fn()}
      />,
    );
    expect(soan.getByLabelText('Remove photo 1')).toBeTruthy();
    expect(soan.getByLabelText('Take photo')).toBeTruthy();
    expect(soan.getByLabelText('Choose photo from device')).toBeTruthy();
    expect(chuVietConSot(cay(soan))).toEqual([]);

    const hang = await renderScreen(
      <ProjectRow
        project={{ id: 'p', name: 'Nhóm EXE', workspaceId: 'w', status: 'ACTIVE', createdAt: '', updatedAt: '' } as never}
        unreadCount={0}
        onPress={jest.fn()}
      />,
    );
    expect(hang.getByText('Project chat')).toBeTruthy();
  });
});

describe('hàm thuần ở tiếng Anh', () => {
  it('giờ tin nhắn tiếng Anh theo giờ Việt Nam, dạng 2:05 PM', async () => {
    const man = await renderScreen(
      <MessageBubble message={{ id: 'g1', content: 'x', createdAt: '2026-10-09T07:05:00.000Z' }} isMine />,
    );
    // 07:05 UTC = 14:05 giờ Việt Nam
    expect(man.getByText(/^2:05.PM$/)).toBeTruthy();
  });

  it('dấu hiệu đang nhập', () => {
    expect(typingLabel([], 'en')).toBe('');
    expect(typingLabel(['An'], 'en')).toBe('An is typing…');
    expect(typingLabel(['An', 'Bình'], 'en')).toBe('An and Bình are typing…');
    expect(typingLabel(['An', 'Bình', 'Chi'], 'en')).toBe('3 people are typing…');
    expect(typingLabel(['An', 'Bình', 'Chi'], 'vi')).toBe('3 người đang nhập…');
  });

  it('gửi dở dang: nói rõ đã gửi bao nhiêu và còn lại bao nhiêu', () => {
    const loi = new LoiGuiDoDang(['a'], 3, new Error('boom'));
    expect(cauGuiDoDang(loi, 'en')).toBe('Sent 1 of 3 photos. Couldn’t send. Tap Send to send the remaining 2.');
    expect(cauGuiDoDang(loi, 'vi')).toBe('Đã gửi 1/3 ảnh. boom Bấm Gửi để gửi tiếp 2 ảnh còn lại.');
    expect(chuVietConSot(loi.message)).toEqual([]);
  });

  it('hạn chót AI: câu báo lỗi theo ngôn ngữ', () => {
    expect(docHanChotAI('mai', '09:00', 'en').loi).toBe(
      'The due date isn’t valid. Use day/month/year, for example 30/09/2026.',
    );
    expect(docHanChotAI('30/09/2026', 'tối', 'en').loi).toBe(
      'The time isn’t valid. Use hours:minutes, for example 08:00, 8:00 or 20:00.',
    );
    expect(docHanChotAI('mai', '09:00', 'vi').loi).toMatch(/Ngày hết hạn/);
  });

  it('mã mời: lỗi, nội dung chia sẻ và hạn', () => {
    expect(cauLoiMoi(new ApiError('x', 404, 'INVITE_EXPIRED'), 'en')).toBe(
      'This invite link has expired. Ask your Leader for a new one.',
    );
    expect(cauLoiMoi(new ApiError('x', 429), 'en')).toBe('You’ve tried too many times. Wait a minute and try again.');
    expect(cauLoiMoi(new Error('x'), 'en')).toBe('Something went wrong. Try again in a few minutes.');
    expect(noiDungChiaSe('Nhóm EXE', { url: 'https://x/y', code: '7K3M9QXA' }, 'en')).toBe(
      'Join the project Nhóm EXE on WeDo: https://x/y. Or enter the code 7K3M-9QXA in the app.',
    );
    expect(hienThiHanMoi('2026-10-31T10:05:00.000Z', 'vi')).toBe('17:05 31/10/2026');
    expect(hienThiHanMoi('2026-10-31T10:05:00.000Z', 'en')).toMatch(/^Oct 31, 2026/);
  });

  it('đường dẫn bỏ chặn lấy đúng tên ở tab Tài khoản và màn Người đã chặn', () => {
    expect(duongBoChan('vi')).toBe('Tài khoản → Người đã chặn');
    expect(duongBoChan('en')).toBe('Account → Blocked people');
    expect(noiDungXacNhanChan('en')).toContain('You can unblock them in Account → Blocked people.');
    expect(noiDungXacNhanChan('vi')).toBe(
      'Bạn sẽ không thấy tin nhắn của người này nữa, và hai người không thể nhắn tin riêng hay kết bạn với nhau. Bạn có thể bỏ chặn trong Tài khoản → Người đã chặn.',
    );
  });
});
