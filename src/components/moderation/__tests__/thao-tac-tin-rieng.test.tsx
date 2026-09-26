import React from 'react';
import { Alert, Platform } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ManTinNhanRieng from '../../../app/(tabs)/chat/dm/[conversationId]';
import { ApiError } from '../../../lib/api/client';
import {
  getDirectMessages,
  listConversations,
  markConversationRead,
  sendDirectMessage,
} from '../../../lib/api/direct-chat';
import { blockUser, listBlocks, reportContent } from '../../../lib/api/moderation';
import { useAuth } from '../../../lib/auth/auth-context';
import type { DirectConversation, DirectMessage } from '../../../lib/types';

/*
  Báo cáo và chặn trong tin nhắn riêng: nhấn giữ một tin, hoặc nút ba chấm trên
  tiêu đề. Không có mục AI — đó là tính năng của chat dự án.

  Đặt ở đây chứ không cạnh màn hình: Expo Router biến mọi tệp dưới `src/app/`
  thành một đường dẫn, kể cả tệp kiểm thử.
*/

const mockRouter = { back: jest.fn(), push: jest.fn(), replace: jest.fn(), canGoBack: () => true };
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ conversationId: 'c1', ten: 'Tuấn' }),
  useRouter: () => mockRouter,
  useFocusEffect: (hieuUng: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(hieuUng, [hieuUng]);
  },
}));

/*
  Reanimated cần mô-đun native không có trong Jest. Màn này chỉ dùng nó để đệm
  khung theo bàn phím — thay bằng View thường là đủ.
*/
jest.mock('react-native-reanimated', () => {
  const { View: V } = jest.requireActual('react-native');
  return { __esModule: true, default: { View: V }, useAnimatedStyle: () => ({}) };
});

jest.mock('../../../lib/api/direct-chat', () => ({
  getDirectMessages: jest.fn(),
  listConversations: jest.fn(),
  markConversationRead: jest.fn(),
  sendDirectMessage: jest.fn(),
  sendDirectFiles: jest.fn(),
}));
jest.mock('../../../lib/api/moderation', () => ({
  ...jest.requireActual('../../../lib/api/moderation'),
  listBlocks: jest.fn(),
  blockUser: jest.fn(),
  reportContent: jest.fn(),
}));
jest.mock('../../../lib/auth/auth-context');
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
/* Ô soạn tối giản: một ô chữ và một nút Gửi. */
jest.mock('../../../components/chat/MessageComposer', () => {
  const { Pressable: P, TextInput: TI } = jest.requireActual('react-native');
  return {
    MessageComposer: ({
      value,
      onChangeText,
      onSend,
    }: {
      value: string;
      onChangeText: (v: string) => void;
      onSend: () => void;
    }) => (
      <>
        <TI testID="o-soan" value={value} onChangeText={onChangeText} />
        <P testID="nut-gui" onPress={onSend} />
      </>
    ),
  };
});
jest.mock('../../../components/chat/ImageViewer', () => ({ ImageViewer: () => null }));
jest.mock('../../../components/ui/GradientHeader', () => {
  const { Text: T, View: V } = jest.requireActual('react-native');
  return {
    GradientHeader: ({ title, right }: { title: string; right?: React.ReactNode }) => (
      <V>
        <T>{title}</T>
        {right}
      </V>
    ),
  };
});

const mockedTin = getDirectMessages as jest.MockedFunction<typeof getDirectMessages>;
const mockedHoiThoai = listConversations as jest.MockedFunction<typeof listConversations>;
const mockedDaDoc = markConversationRead as jest.MockedFunction<typeof markConversationRead>;
const mockedGui = sendDirectMessage as jest.MockedFunction<typeof sendDirectMessage>;
const mockedDanhSachChan = listBlocks as jest.MockedFunction<typeof listBlocks>;
const mockedChan = blockUser as jest.MockedFunction<typeof blockUser>;
const mockedBaoCao = reportContent as jest.MockedFunction<typeof reportContent>;
const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const TOI = { id: 'u1', email: '', fullName: 'Đại' };
const TUAN = { id: 'u2', email: '', fullName: 'Tuấn' };

function tin(id: string, noiDung: string, nguoiGui: typeof TOI, phut: number): DirectMessage {
  const luc = new Date(Date.UTC(2026, 8, 26, 10, phut)).toISOString();
  return {
    id,
    conversationId: 'c1',
    senderId: nguoiGui.id,
    sender: nguoiGui,
    content: noiDung,
    createdAt: luc,
    updatedAt: luc,
  };
}

const HOI_THOAI: DirectConversation = {
  id: 'c1',
  pairKey: 'u1:u2',
  createdAt: '',
  updatedAt: '',
  unreadCount: 0,
  participants: [
    { id: 'pa', userId: 'u1', user: TOI },
    { id: 'pb', userId: 'u2', user: TUAN },
  ],
};

let queryClient: QueryClient;
let heDieuHanh: { restore: () => void } | null = null;
let hopThoai: jest.SpyInstance;

function dung() {
  return (
    <QueryClientProvider client={queryClient}>
      <ManTinNhanRieng />
    </QueryClientProvider>
  );
}

async function moMan() {
  const man = await render(dung());
  await waitFor(() => expect(man.getByText('Tuấn nhắn bậy')).toBeTruthy());
  // Đợi danh sách hội thoại về: nút ba chấm cần biết người kia là ai.
  await waitFor(() => expect(man.getByTestId('dm-thao-tac')).toBeTruthy());
  return man;
}

beforeEach(() => {
  jest.clearAllMocks();
  // Bảng trượt của Android: bấm được bằng testID. Bản iOS có kiểm thử riêng.
  heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
  hopThoai = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  mockedAuth.mockReturnValue({ user: TOI } as never);
  mockedHoiThoai.mockResolvedValue([HOI_THOAI]);
  mockedDaDoc.mockResolvedValue({ ok: true });
  mockedDanhSachChan.mockResolvedValue([]);
  mockedTin.mockResolvedValue([
    tin('d1', 'Chào Tuấn', TOI, 1),
    tin('d2', 'Tuấn nhắn bậy', TUAN, 2),
  ]);
});

afterEach(() => {
  hopThoai.mockRestore();
  heDieuHanh?.restore();
  heDieuHanh = null;
  queryClient.clear();
});

describe('báo cáo và chặn trong tin nhắn riêng', () => {
  it('nhấn giữ tin của người kia: có Báo cáo và Chặn, không có mục AI', async () => {
    const man = await moMan();

    await fireEvent(man.getByTestId('tin-d2'), 'longPress');

    expect(man.getByText('Báo cáo tin nhắn')).toBeTruthy();
    expect(man.getByText('Chặn người này')).toBeTruthy();
    expect(man.queryByText('Tạo công việc bằng AI')).toBeNull();
  });

  it('nhấn giữ tin của chính mình: không mở bảng', async () => {
    const man = await moMan();

    await fireEvent(man.getByTestId('tin-d1'), 'longPress');

    expect(man.queryByTestId('bang-thao-tac')).toBeNull();
  });

  it('báo cáo một tin: gửi đúng loại DIRECT_MESSAGE và mã tin', async () => {
    mockedBaoCao.mockResolvedValue({ id: 'r1', status: 'OPEN' });
    const man = await moMan();

    await fireEvent(man.getByTestId('tin-d2'), 'longPress');
    await fireEvent.press(man.getByTestId('thao-tac-bao-cao'));
    await fireEvent.press(man.getByTestId('ly-do-SPAM'));
    await fireEvent.press(man.getByTestId('bao-cao-gui'));

    await waitFor(() =>
      expect(man.getByText('Đã gửi báo cáo. WeDo sẽ xem xét trong vòng 24 giờ.')).toBeTruthy(),
    );
    expect(mockedBaoCao.mock.calls[0][0]).toEqual(
      expect.objectContaining({ targetType: 'DIRECT_MESSAGE', targetId: 'd2', reason: 'SPAM' }),
    );
  });

  it('nút ba chấm: báo cáo chính người kia', async () => {
    mockedBaoCao.mockResolvedValue({ id: 'r2', status: 'OPEN' });
    const man = await moMan();

    await fireEvent.press(man.getByTestId('dm-thao-tac'));
    await fireEvent.press(man.getByTestId('thao-tac-bao-cao-nguoi'));

    expect(man.getByText('Báo cáo Tuấn')).toBeTruthy();
    await fireEvent.press(man.getByTestId('ly-do-HARASSMENT'));
    await fireEvent.press(man.getByTestId('bao-cao-gui'));

    await waitFor(() => expect(mockedBaoCao).toHaveBeenCalledTimes(1));
    expect(mockedBaoCao.mock.calls[0][0]).toEqual(
      expect.objectContaining({ targetType: 'USER', targetId: 'u2', reason: 'HARASSMENT' }),
    );
  });

  it('chặn từ nút ba chấm: hỏi đúng câu, đồng ý thì tin người kia biến mất và rời hội thoại', async () => {
    mockedChan.mockResolvedValue({ ok: true });
    const man = await moMan();

    await fireEvent.press(man.getByTestId('dm-thao-tac'));
    await fireEvent.press(man.getByTestId('thao-tac-chan'));

    const [tieuDe, , nut] = hopThoai.mock.calls[0] as [
      string,
      string,
      Array<{ text: string; onPress?: () => void }>,
    ];
    expect(tieuDe).toBe('Chặn Tuấn?');
    expect(mockedChan).not.toHaveBeenCalled();

    mockedDanhSachChan.mockResolvedValue([
      { userId: 'u2', fullName: 'Tuấn', avatarUrl: null, blockedAt: '2026-09-26T10:00:00.000Z' },
    ]);
    await act(async () => nut.find((n) => n.text === 'Chặn')?.onPress?.());

    await waitFor(() => expect(man.queryByText('Tuấn nhắn bậy')).toBeNull());
    expect(mockedChan.mock.calls[0][0]).toBe('u2');
    expect(man.getByText('Chào Tuấn')).toBeTruthy();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('người đã chặn từ trước: tin của họ không hiện', async () => {
    mockedDanhSachChan.mockResolvedValue([
      { userId: 'u2', fullName: 'Tuấn', avatarUrl: null, blockedAt: '2026-09-25T10:00:00.000Z' },
    ]);
    const man = await render(dung());

    await waitFor(() => expect(man.getByText('Chào Tuấn')).toBeTruthy());
    await waitFor(() => expect(man.queryByText('Tuấn nhắn bậy')).toBeNull());
  });

  /* Không phải lỗi mạng: hiện nguyên câu của máy chủ để người dùng khỏi gửi lại mãi. */
  it('gửi bị từ chối vì đã chặn nhau: hiện nguyên câu của máy chủ', async () => {
    mockedGui.mockRejectedValue(
      new ApiError('Bạn không thể nhắn tin cho người này.', 403, 'BLOCKED'),
    );
    const man = await moMan();

    await fireEvent.changeText(man.getByTestId('o-soan'), 'alo');
    await fireEvent.press(man.getByTestId('nut-gui'));

    await waitFor(() =>
      expect(man.getByText('Bạn không thể nhắn tin cho người này.')).toBeTruthy(),
    );
    expect(mockedGui).toHaveBeenCalledWith('c1', 'alo');
  });
});
