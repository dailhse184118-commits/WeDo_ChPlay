import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ManTinNhanRieng from '../dm/[conversationId]';
import { LoiGuiDoDang } from '../../../../lib/api/chat-files';
import {
  getDirectHistory,
  getDirectMessages,
  markConversationRead,
  sendDirectFiles,
} from '../../../../lib/api/direct-chat';
import { useAuth } from '../../../../lib/auth/auth-context';
import { chonAnh } from '../../../../lib/images/pick-images';
import { useSocket } from '../../../../lib/socket/socket-context';
import type { DirectMessage } from '../../../../lib/types';

/*
  Màn tin nhắn riêng là một tab ẩn, sống suốt phiên. Kiểm thử dựng màn MỘT lần
  rồi cho nó rời đi và quay lại — đúng như trên điện thoại.
*/
type DangKyFocus = { chay: () => void | (() => void); don: void | (() => void) };
const mockDangKy = new Set<DangKyFocus>();
let mockDangFocus = true;
const mockRouter = { back: jest.fn(), push: jest.fn(), replace: jest.fn(), canGoBack: () => true };
let mockThamSo: { conversationId: string; ten?: string } = { conversationId: 'c1', ten: 'Bảo' };
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockThamSo,
  useRouter: () => mockRouter,
  useFocusEffect: (hieuUng: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(() => {
      const dangKy: DangKyFocus = { chay: hieuUng, don: mockDangFocus ? hieuUng() : undefined };
      mockDangKy.add(dangKy);
      return () => {
        if (typeof dangKy.don === 'function') dangKy.don();
        mockDangKy.delete(dangKy);
      };
    }, [hieuUng]);
  },
}));

/* Trang "đầy" rút còn 3 tin thay cho 40 thật, như kiểm thử chat dự án. */
jest.mock('../../../../lib/api/direct-chat', () => ({
  ...jest.requireActual('../../../../lib/api/direct-chat'),
  SO_TIN_RIENG_MOI_NHAT: 3,
  getDirectHistory: jest.fn(),
  getDirectMessages: jest.fn(),
  markConversationRead: jest.fn(),
  sendDirectFiles: jest.fn(),
  sendDirectMessage: jest.fn(),
}));
/* Reanimated cần mô-đun native; ở đây chỉ cần một View thường và kiểu rỗng. */
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native');
  return { __esModule: true, default: { View }, useAnimatedStyle: () => ({}) };
});
jest.mock('../../../../lib/auth/auth-context');
jest.mock('../../../../lib/socket/socket-context');
jest.mock('../../../../lib/chat/use-header-tep', () => ({ useHeaderTep: () => undefined }));
jest.mock('../../../../lib/images/pick-images', () => ({ chonAnh: jest.fn(), chupAnh: jest.fn() }));
jest.mock('../../../../lib/observability/sentry', () => ({ baoLoi: jest.fn(), moTaTep: jest.fn() }));
jest.mock('../../../../components/chat/MessageBubble', () => {
  const { Text: T } = jest.requireActual('react-native');
  return {
    MessageBubble: ({ message }: { message: { content: string; deletedAt?: string | null } }) => (
      <T>{message.deletedAt ? 'đã thu hồi' : message.content}</T>
    ),
  };
});
let mockSoanTin: {
  value: string;
  anhDaChon: unknown[];
  onChangeText: (v: string) => void;
  onSend: () => void;
  onChonAnh: () => void;
} | null = null;
jest.mock('../../../../components/chat/MessageComposer', () => ({
  MessageComposer: (props: never) => {
    mockSoanTin = props;
    return null;
  },
}));
jest.mock('../../../../components/chat/ImageViewer', () => ({ ImageViewer: () => null }));
jest.mock('../../../../components/chat/EmptyChat', () => {
  const { Text: T } = jest.requireActual('react-native');
  return { EmptyChat: () => <T>trống</T> };
});
jest.mock('../../../../components/ui/GradientHeader', () => {
  const { Text: T } = jest.requireActual('react-native');
  return { GradientHeader: ({ title }: { title: string }) => <T>{title}</T> };
});

const mockedTin = getDirectMessages as jest.MockedFunction<typeof getDirectMessages>;
const mockedLichSu = getDirectHistory as jest.MockedFunction<typeof getDirectHistory>;
const mockedDaDoc = markConversationRead as jest.MockedFunction<typeof markConversationRead>;
const mockedGuiAnh = sendDirectFiles as jest.MockedFunction<typeof sendDirectFiles>;
const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedSocket = useSocket as jest.MockedFunction<typeof useSocket>;

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

function tin(id: string, noiDung: string, phut: number, conversationId = 'c1'): DirectMessage {
  const luc = new Date(Date.UTC(2026, 8, 30, 10, phut)).toISOString();
  return { id, conversationId, senderId: 'u-bao', content: noiDung, createdAt: luc, updatedAt: luc };
}

let socket: ReturnType<typeof socketGia>;
let queryClient: QueryClient;

function dung() {
  return (
    <QueryClientProvider client={queryClient}>
      <ManTinNhanRieng />
    </QueryClientProvider>
  );
}

async function roiMan() {
  await act(async () => {
    mockDangFocus = false;
    for (const dangKy of mockDangKy) {
      if (typeof dangKy.don === 'function') dangKy.don();
      dangKy.don = undefined;
    }
  });
}

async function quayLaiMan() {
  await act(async () => {
    mockDangFocus = true;
    for (const dangKy of mockDangKy) dangKy.don = dangKy.chay();
  });
}

/* `cao` khác nhau cho mỗi lần cuộn: FlatList chỉ báo "tới cuối" một lần cho mỗi cỡ nội dung. */
async function cuonLenDinh(man: Awaited<ReturnType<typeof render>>, cao = 500) {
  const khung = man.getByTestId('khung-tin-rieng');
  await fireEvent(khung, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 100, height: 100 } } });
  await fireEvent(khung, 'contentSizeChange', 100, cao);
  await fireEvent.scroll(khung, {
    nativeEvent: {
      contentOffset: { x: 0, y: cao },
      contentSize: { width: 100, height: cao },
      layoutMeasurement: { width: 100, height: 100 },
    },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockDangKy.clear();
  mockDangFocus = true;
  mockSoanTin = null;
  mockThamSo = { conversationId: 'c1', ten: 'Bảo' };
  socket = socketGia();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mockedAuth.mockReturnValue({ user: { id: 'u-toi' } } as never);
  mockedSocket.mockReturnValue({ socket, connected: true, onlineUserIds: new Set() } as never);
  mockedDaDoc.mockResolvedValue({ ok: true });
  mockedLichSu.mockResolvedValue({ items: [], nextCursor: null });
});

afterEach(() => queryClient.clear());

/*
  Máy chủ coi GET /messages là "đã đọc". Trước đây màn ẩn vẫn nạp lại mỗi khi
  có tin riêng mới: huy hiệu biến mất và người gửi thấy "Đã xem" trong khi người
  dùng đang ở tab khác.
*/
describe('đọc tin chỉ khi đang nhìn', () => {
  it('rời màn rồi có tin mới: không GET, không báo đã đọc; quay lại mới nạp', async () => {
    mockedTin.mockResolvedValue([tin('m1', 'Chào', 1)]);
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('Chào')).toBeTruthy());
    await waitFor(() => expect(mockedDaDoc).toHaveBeenCalledTimes(1));
    const soLanGet = mockedTin.mock.calls.length;

    await roiMan();
    // Đúng thứ `useRealtimeSync` làm khi có sự kiện message:direct.
    mockedTin.mockResolvedValue([tin('m1', 'Chào', 1), tin('m2', 'Tối nay họp nhé', 2)]);
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['direct-messages'] });
    });

    expect(mockedTin).toHaveBeenCalledTimes(soLanGet);
    expect(mockedDaDoc).toHaveBeenCalledTimes(1);

    await quayLaiMan();
    await waitFor(() => expect(man.getByText('Tối nay họp nhé')).toBeTruthy());
    // Đang nhìn lại rồi thì báo đã đọc là đúng.
    await waitFor(() => expect(mockedDaDoc.mock.calls.length).toBeGreaterThan(1));
  });

  it('đang xem mà có tin mới thì nạp và báo đã đọc như cũ', async () => {
    mockedTin.mockResolvedValue([tin('m1', 'Chào', 1)]);
    const man = await render(dung());
    await waitFor(() => expect(mockedDaDoc).toHaveBeenCalledTimes(1));

    mockedTin.mockResolvedValue([tin('m1', 'Chào', 1), tin('m2', 'Tối nay họp nhé', 2)]);
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['direct-messages'] });
    });

    await waitFor(() => expect(man.getByText('Tối nay họp nhé')).toBeTruthy());
    await waitFor(() => expect(mockedDaDoc).toHaveBeenCalledTimes(2));
  });
});

/* Trước đây chỉ có 40 tin gần nhất, cuộn lên là hết. */
describe('xem tin cũ hơn', () => {
  it('cuộn lên tải trang cũ theo mã tin cũ nhất, gộp không trùng', async () => {
    mockedTin.mockResolvedValue([tin('m3', 'ba', 3), tin('m4', 'bốn', 4), tin('m5', 'năm', 5)]);
    mockedLichSu.mockResolvedValueOnce({
      items: [tin('m1', 'một', 1), tin('m2', 'hai', 2), tin('m3', 'ba', 3)],
      nextCursor: 'm1',
    });
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('năm')).toBeTruthy());

    await cuonLenDinh(man);

    await waitFor(() => expect(man.getByText('một')).toBeTruthy());
    expect(mockedLichSu).toHaveBeenCalledWith('c1', 'm3');
    expect(man.getAllByText('ba')).toHaveLength(1);
    // Đọc lịch sử không phải là "đọc": không gọi lại GET /messages.
    expect(mockedTin).toHaveBeenCalledTimes(1);
  });

  it('trang mới nhất chưa đầy thì không có gì cũ hơn để tải', async () => {
    mockedTin.mockResolvedValue([tin('m1', 'một', 1)]);
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('một')).toBeTruthy());

    await cuonLenDinh(man);

    expect(mockedLichSu).not.toHaveBeenCalled();
  });

  it('tin cũ đã tải bị thu hồi thì thôi hiện nội dung cũ', async () => {
    mockedTin.mockResolvedValue([tin('m3', 'ba', 3), tin('m4', 'bốn', 4), tin('m5', 'năm', 5)]);
    mockedLichSu.mockResolvedValueOnce({ items: [tin('m1', 'bí mật', 1)], nextCursor: null });
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('năm')).toBeTruthy());
    await cuonLenDinh(man);
    await waitFor(() => expect(man.getByText('bí mật')).toBeTruthy());

    await act(async () =>
      socket.xuLy['message:direct:recalled']({
        ...tin('m1', '', 1),
        deletedAt: '2026-09-30T11:00:00.000Z',
      } as never),
    );

    expect(man.queryByText('bí mật')).toBeNull();
  });
});

describe('gửi nhiều ảnh hỏng giữa chừng', () => {
  it('bỏ ảnh đã tới khỏi ô soạn, giữ phần chưa gửi, nói rõ đã gửi bao nhiêu', async () => {
    const ANH = [1, 2, 3].map((i) => ({ uri: `file:///a${i}.jpg`, name: `a${i}.jpg` }));
    (chonAnh as jest.Mock).mockResolvedValue(ANH);
    mockedGuiAnh.mockRejectedValue(
      new LoiGuiDoDang([tin('a1', 'ảnh một', 9)], 3, new Error('Mất mạng.')),
    );
    mockedTin.mockResolvedValue([tin('m1', 'Chào', 1)]);
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('Chào')).toBeTruthy());

    await act(async () => mockSoanTin?.onChangeText('chú thích'));
    await act(async () => mockSoanTin?.onChonAnh());
    await waitFor(() => expect(mockSoanTin?.anhDaChon).toHaveLength(3));
    await act(async () => mockSoanTin?.onSend());

    await waitFor(() => expect(mockSoanTin?.anhDaChon).toEqual([ANH[1], ANH[2]]));
    expect(mockSoanTin?.value).toBe('');
    expect(man.getByText(/Đã gửi 1\/3 ảnh/)).toBeTruthy();
  });
});
