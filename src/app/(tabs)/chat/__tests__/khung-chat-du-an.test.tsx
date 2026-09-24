import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ManChatDuAn from '../[projectId]';
import {
  getProjectHistory,
  getProjectMessages,
  markProjectRead,
  sendProjectMessage,
} from '../../../../lib/api/chat';
import { listProjects } from '../../../../lib/api/projects';
import { getEntitlements } from '../../../../lib/api/entitlements';
import { useAuth } from '../../../../lib/auth/auth-context';
import { useSocket } from '../../../../lib/socket/socket-context';
import { useWorkspace } from '../../../../lib/workspace/workspace-context';
import type { ChatMessage } from '../../../../lib/types';

/*
  Tái hiện lỗi người thử nghiệm báo 23/09/2026 trên máy thật:
  - tin mới tới (có cả thông báo đẩy) mà khung chat không hiện;
  - bấm vào dự án đang có huy hiệu: không thấy tin; quay ra huy hiệu vẫn còn;
    bấm lần nữa mới thấy; quay ra huy hiệu VẪN còn.

  Gốc rễ: màn chat là một tab ẩn, sống suốt phiên. Nên kiểm thử dựng màn MỘT lần
  rồi cho nó rời đi và quay lại — đúng như trên điện thoại.
*/

let mockHieuUng: (() => void | (() => void)) | null = null;
let mockDon: void | (() => void) = undefined;
let mockDangFocus = true;
let mockThamSo: { projectId: string } = { projectId: 'p1' };
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockThamSo,
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: jest.fn() }),
  useFocusEffect: (hieuUng: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(() => {
      mockHieuUng = hieuUng;
      if (mockDangFocus) mockDon = hieuUng();
      return () => {
        if (typeof mockDon === 'function') mockDon();
        mockDon = undefined;
      };
    }, [hieuUng]);
  },
}));

/*
  Trang "đầy" rút còn 3 tin thay cho 40 thật: FlatList chỉ dựng một cửa sổ khoảng
  10 tin, danh sách 80 tin trong kiểm thử không bao giờ chạm "cuối" để gọi
  onEndReached. Logic nối liền không phụ thuộc con số cụ thể.
*/
jest.mock('../../../../lib/api/chat', () => ({
  ...jest.requireActual('../../../../lib/api/chat'),
  SO_TIN_MOI_NHAT: 3,
  getProjectHistory: jest.fn(),
  getProjectMessages: jest.fn(),
  markProjectRead: jest.fn(),
  requestTaskSuggestion: jest.fn(),
  sendProjectFiles: jest.fn(),
  sendProjectMessage: jest.fn(),
}));
jest.mock('../../../../lib/api/projects');
jest.mock('../../../../lib/api/entitlements', () => ({
  MA_HET_LUOT_AI: 'AI_QUOTA_EXCEEDED',
  getEntitlements: jest.fn(),
}));
jest.mock('../../../../lib/auth/auth-context');
jest.mock('../../../../lib/socket/socket-context');
jest.mock('../../../../lib/workspace/workspace-context');
jest.mock('../../../../lib/chat/use-header-tep', () => ({ useHeaderTep: () => undefined }));
jest.mock('../../../../lib/images/pick-images', () => ({ chonAnh: jest.fn(), chupAnh: jest.fn() }));
jest.mock('../../../../lib/observability/sentry', () => ({ baoLoi: jest.fn(), moTaTep: jest.fn() }));

/* Thành phần giao diện nặng thay bằng bản tối giản — kiểm thử này soi LOGIC nạp tin. */
jest.mock('../../../../components/chat/MessageBubble', () => {
  const { Text: T } = jest.requireActual('react-native');
  return { MessageBubble: ({ message }: { message: { content: string } }) => <T>{message.content}</T> };
});
/* Giữ lại props của ô soạn tin để kiểm thử gõ và gửi như người dùng. */
let mockSoanTin: {
  value: string;
  sending: boolean;
  onChangeText: (v: string) => void;
  onSend: () => void;
} | null = null;
jest.mock('../../../../components/chat/MessageComposer', () => ({
  MessageComposer: (props: never) => {
    mockSoanTin = props;
    return null;
  },
}));
jest.mock('../../../../components/chat/ImageViewer', () => ({ ImageViewer: () => null }));
jest.mock('../../../../components/chat/TaskSuggestionSheet', () => ({ TaskSuggestionSheet: () => null }));
jest.mock('../../../../components/chat/EmptyChat', () => {
  const { Text: T } = jest.requireActual('react-native');
  return { EmptyChat: () => <T>trống</T> };
});
jest.mock('../../../../components/ui/GradientHeader', () => {
  const { Text: T } = jest.requireActual('react-native');
  return { GradientHeader: ({ title }: { title: string }) => <T>{title}</T> };
});

const mockedTin = getProjectMessages as jest.MockedFunction<typeof getProjectMessages>;
const mockedLichSu = getProjectHistory as jest.MockedFunction<typeof getProjectHistory>;
const mockedDaDoc = markProjectRead as jest.MockedFunction<typeof markProjectRead>;
const mockedGui = sendProjectMessage as jest.MockedFunction<typeof sendProjectMessage>;
const mockedDuAn = listProjects as jest.MockedFunction<typeof listProjects>;
const mockedHanMuc = getEntitlements as jest.MockedFunction<typeof getEntitlements>;
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

function tin(id: string, noiDung: string, phut: number, projectId = 'p1', authorId = 'u2'): ChatMessage {
  const luc = new Date(Date.UTC(2026, 8, 23, 10, phut)).toISOString();
  return {
    id,
    content: noiDung,
    workspaceId: 'w1',
    projectId,
    authorId,
    createdAt: luc,
    updatedAt: luc,
  };
}

let socket: ReturnType<typeof socketGia>;
let queryClient: QueryClient;

function dung() {
  return (
    <QueryClientProvider client={queryClient}>
      <ManChatDuAn />
    </QueryClientProvider>
  );
}

/** Một trang đầy (3 tin — xem `SO_TIN_MOI_NHAT` giả lập ở trên), mã `<tiền tố><số>`, phút tăng dần. */
function trangDay(tienTo: string, phutDau: number, soDau = 0) {
  return Array.from({ length: 3 }, (_, i) =>
    tin(`${tienTo}${soDau + i}`, `${tienTo}-${soDau + i}`, phutDau + i),
  );
}

/* `cao` khác nhau cho mỗi lần cuộn: FlatList chỉ báo "tới cuối" một lần cho mỗi cỡ nội dung. */
async function cuonLenDinh(man: Awaited<ReturnType<typeof render>>, cao = 500) {
  const khung = man.getByTestId('khung-tin');
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

async function roiMan() {
  await act(async () => {
    mockDangFocus = false;
    if (typeof mockDon === 'function') mockDon();
    mockDon = undefined;
  });
}

async function quayLaiMan() {
  await act(async () => {
    mockDangFocus = true;
    mockDon = mockHieuUng?.();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockDangFocus = true;
  mockHieuUng = null;
  mockDon = undefined;
  mockThamSo = { projectId: 'p1' };
  mockSoanTin = null;
  socket = socketGia();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // Giả như danh sách đang hiện huy hiệu 1 cho dự án này.
  queryClient.setQueryData(['chat-unread', 'p1'], { count: 1 });

  mockedAuth.mockReturnValue({ user: { id: 'u1', fullName: 'Lê Hữu Đại' } } as never);
  mockedSocket.mockReturnValue({ socket, connected: true, onlineUserIds: new Set() } as never);
  mockedWorkspace.mockReturnValue({ active: { id: 'w1' } } as never);
  mockedDuAn.mockResolvedValue([{ id: 'p1', name: 'Closed Testing WeDo', members: [] }] as never);
  mockedHanMuc.mockReturnValue(new Promise(() => undefined) as never);
  mockedDaDoc.mockResolvedValue({ ok: true } as never);
  mockedLichSu.mockResolvedValue({ items: [], nextCursor: null } as never);
});

afterEach(() => {
  jest.useRealTimers();
  // Xoá hẳn bộ nhớ đệm: hẹn giờ dọn rác của nó giữ Jest không thoát được.
  queryClient.clear();
});

describe('khung chat dự án', () => {
  it('mở ra thì hiện tin và đưa huy hiệu chưa đọc về 0', async () => {
    mockedTin.mockResolvedValue([tin('m1', 'Dạ', 1)]);
    const man = await render(dung());

    await waitFor(() => expect(man.getByText('Dạ')).toBeTruthy());
    // GET /chat đã tính là đọc trên máy chủ — huy hiệu phải khớp ngay.
    expect(queryClient.getQueryData(['chat-unread', 'p1'])).toEqual({ count: 0 });
  });

  it('quay lại ĐÚNG dự án đã mở dở thì nạp lại — tin tới lúc vắng mặt phải hiện', async () => {
    mockedTin.mockResolvedValueOnce([tin('m1', 'Dạ', 1)]);
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('Dạ')).toBeTruthy());

    await roiMan();
    queryClient.setQueryData(['chat-unread', 'p1'], { count: 1 });
    mockedTin.mockResolvedValueOnce([tin('m1', 'Dạ', 1), tin('m2', 'Abc', 37)]);
    await quayLaiMan();

    await waitFor(() => expect(man.getByText('Abc')).toBeTruthy());
    expect(mockedTin).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData(['chat-unread', 'p1'])).toEqual({ count: 0 });
  });

  it('tin tới qua socket lúc đang xem: hiện ra, báo đã đọc một lượt, huy hiệu về 0', async () => {
    mockedTin.mockResolvedValue([tin('m1', 'Dạ', 1)]);
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('Dạ')).toBeTruthy());
    queryClient.setQueryData(['chat-unread', 'p1'], { count: 2 });
    mockedDaDoc.mockClear();

    jest.useFakeTimers();
    await act(async () => socket.xuLy['message:project'](tin('m2', 'Abc', 37) as never));
    await act(async () => socket.xuLy['message:project'](tin('m3', 'Nữa', 38) as never));
    expect(man.getByText('Abc')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });

    // Hai tin liền nhau gom thành MỘT lượt báo đã đọc.
    expect(mockedDaDoc).toHaveBeenCalledTimes(1);
    expect(mockedDaDoc).toHaveBeenCalledWith('p1');
    expect(queryClient.getQueryData(['chat-unread', 'p1'])).toEqual({ count: 0 });
  });

  /*
    Màn đã rời (nhưng vẫn sống vì là tab) mà vẫn báo đã đọc là xoá huy hiệu của
    những tin người dùng chưa hề thấy.
  */
  it('tin tới khi đã rời màn thì KHÔNG báo đã đọc', async () => {
    mockedTin.mockResolvedValue([tin('m1', 'Dạ', 1)]);
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('Dạ')).toBeTruthy());
    await roiMan();
    mockedDaDoc.mockClear();

    jest.useFakeTimers();
    await act(async () => socket.xuLy['message:project'](tin('m2', 'Abc', 37) as never));
    await act(async () => {
      jest.advanceTimersByTime(5_000);
    });

    expect(mockedDaDoc).not.toHaveBeenCalled();
  });

  it('tin của chính mình tới qua socket thì không cần báo đã đọc', async () => {
    mockedTin.mockResolvedValue([tin('m1', 'Dạ', 1)]);
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('Dạ')).toBeTruthy());
    mockedDaDoc.mockClear();

    jest.useFakeTimers();
    await act(async () => socket.xuLy['message:project'](tin('m2', 'Của tôi', 37, 'p1', 'u1') as never));
    await act(async () => {
      jest.advanceTimersByTime(5_000);
    });

    expect(mockedDaDoc).not.toHaveBeenCalled();
  });

  /* Bản cũ THAY danh sách bằng kết quả nạp, xoá mất tin socket vừa tới giữa chừng. */
  it('tin tới qua socket trong lúc đang nạp không bị kết quả nạp ghi đè', async () => {
    let traVe: (danhSach: ChatMessage[]) => void = () => undefined;
    mockedTin.mockReturnValueOnce(new Promise((xong) => (traVe = xong)));
    const man = await render(dung());

    await act(async () => socket.xuLy['message:project'](tin('m2', 'Abc', 37) as never));
    await act(async () => traVe([tin('m1', 'Dạ', 1)]));

    await waitFor(() => expect(man.getByText('Dạ')).toBeTruthy());
    expect(man.getByText('Abc')).toBeTruthy();
  });

  /*
    Máy chủ dùng MÃ TIN làm mốc phân trang. Bản cũ gửi thời điểm tạo — không khớp
    tin nào, nên cuộn lên không bao giờ tải được tin cũ hơn 40 tin gần nhất.
  */
  it('cuộn lên tải tin cũ lấy mã của tin cũ nhất làm mốc', async () => {
    mockedTin.mockResolvedValue([tin('m1', 'Dạ', 1), tin('m2', 'Abc', 37)]);
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('Dạ')).toBeTruthy());

    // Cuộn tới mép trên (danh sách đảo ngược nên "cuối" là tin cũ nhất). FlatList
    // chỉ tính "gần cuối" khi đã biết cỡ khung và cỡ nội dung, như trên máy thật.
    const khung = man.getByTestId('khung-tin');
    await fireEvent(khung, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 100, height: 100 } } });
    await fireEvent(khung, 'contentSizeChange', 100, 500);
    await fireEvent.scroll(khung, {
      nativeEvent: {
        contentOffset: { x: 0, y: 500 },
        contentSize: { width: 100, height: 500 },
        layoutMeasurement: { width: 100, height: 100 },
      },
    });

    expect(mockedLichSu).toHaveBeenCalledWith('p1', 'm1');
  });

  it('đổi sang dự án khác thì không lẫn tin của dự án cũ', async () => {
    mockedTin.mockResolvedValueOnce([tin('m1', 'Tin dự án một', 1)]);
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('Tin dự án một')).toBeTruthy());

    mockThamSo = { projectId: 'p2' };
    mockedTin.mockResolvedValueOnce([tin('m9', 'Tin dự án hai', 2, 'p2')]);
    await man.rerender(dung());

    await waitFor(() => expect(man.getByText('Tin dự án hai')).toBeTruthy());
    expect(man.queryByText('Tin dự án một')).toBeNull();
  });

  /*
    Lỡ HƠN 40 tin lúc mất kết nối: GET /chat chỉ trả 40 tin mới nhất. Gộp thẳng
    vào danh sách cũ là để lại một khoảng trống không thấy được — tin cũ nhảy
    thẳng sang tin thứ 41 — và cuộn lên cũng không lấp được vì mốc phân trang
    vẫn nằm dưới đáy khoảng trống.
  */
  it('lỡ hơn 40 tin: không để khoảng trống, cuộn lên tải tiếp từ trang mới', async () => {
    mockedTin.mockResolvedValueOnce(trangDay('a', 0));
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('a-2')).toBeTruthy());

    await roiMan();
    // Nhiều tin mới trong lúc vắng mặt; máy chủ chỉ trả trang mới nhất b20..b22.
    mockedTin.mockResolvedValueOnce(trangDay('b', 100, 20));
    await quayLaiMan();
    await waitFor(() => expect(man.getByText('b-22')).toBeTruthy());

    // Khối cũ trước khoảng trống bị bỏ — không có cảnh a-2 nằm ngay trên b-20.
    expect(man.queryByText('a-2')).toBeNull();
    await cuonLenDinh(man);
    expect(mockedLichSu).toHaveBeenCalledWith('p1', 'b20');
  });

  /* Chỉ khi trang mới KHÔNG nối vào phần đang giữ mới cần làm lại phân trang. */
  it('nạp lại vẫn nối liền thì giữ nguyên mốc phân trang cũ', async () => {
    mockedTin.mockResolvedValueOnce(trangDay('a', 0));
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('a-2')).toBeTruthy());

    await roiMan();
    // Một tin mới: trang mới nhất là a1, a2, c0 — tin cũ nhất a1 đang có trong tay.
    mockedTin.mockResolvedValueOnce([...trangDay('a', 0).slice(1), tin('c0', 'c-0', 60)]);
    await quayLaiMan();
    await waitFor(() => expect(man.getByText('c-0')).toBeTruthy());

    expect(man.getByText('a-0')).toBeTruthy();
    // Thêm tin làm FlatList nới cửa sổ dựng theo nhịp; cuộn lại tới khi nó kịp dựng ô cuối.
    await waitFor(async () => {
      await cuonLenDinh(man);
      expect(mockedLichSu).toHaveBeenCalledWith('p1', 'a0');
    });
  });

  /*
    Gửi ở dự án A trên mạng chậm, quay ra mở dự án B trước khi gửi xong: tin
    của A không được hiện trong khung chat của B.
  */
  it('tin gửi ở dự án cũ xong muộn không lọt sang khung chat dự án mới', async () => {
    mockedTin.mockResolvedValueOnce([tin('m1', 'Tin P1', 1)]);
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('Tin P1')).toBeTruthy());

    let guiXong: (m: ChatMessage) => void = () => undefined;
    mockedGui.mockReturnValueOnce(new Promise((xong) => (guiXong = xong)));
    await act(async () => mockSoanTin!.onChangeText('xin chao'));
    await act(async () => mockSoanTin!.onSend());

    mockThamSo = { projectId: 'p2' };
    mockedTin.mockResolvedValueOnce([tin('m9', 'Tin P2', 2, 'p2')]);
    await man.rerender(dung());
    await waitFor(() => expect(man.getByText('Tin P2')).toBeTruthy());

    await act(async () => guiXong(tin('m2', 'xin chao', 3, 'p1', 'u1')));

    expect(man.queryByText('xin chao')).toBeNull();
  });

  /* Bản nháp và ảnh chưa gửi của dự án A không được nằm sẵn trong ô soạn tin của B. */
  it('đổi dự án thì ô soạn tin trống, không mang bản nháp sang', async () => {
    mockedTin.mockResolvedValueOnce([tin('m1', 'Tin P1', 1)]);
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('Tin P1')).toBeTruthy());
    await act(async () => mockSoanTin!.onChangeText('nhap cho P1'));
    expect(mockSoanTin!.value).toBe('nhap cho P1');

    mockThamSo = { projectId: 'p2' };
    mockedTin.mockResolvedValueOnce([tin('m9', 'Tin P2', 2, 'p2')]);
    await man.rerender(dung());
    await waitFor(() => expect(man.getByText('Tin P2')).toBeTruthy());

    expect(mockSoanTin!.value).toBe('');
  });

  /*
    Tin đã hiện trước mắt lúc người dùng đang xem thì là đã đọc — kể cả khi họ
    bấm Quay lại trước khi nhịp gom kịp gửi.
  */
  it('rời màn khi còn tin chờ báo đã đọc thì báo ngay, không bỏ', async () => {
    mockedTin.mockResolvedValue([tin('m1', 'Dạ', 1)]);
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('Dạ')).toBeTruthy());
    mockedDaDoc.mockClear();

    jest.useFakeTimers();
    await act(async () => socket.xuLy['message:project'](tin('m2', 'Abc', 37) as never));
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await roiMan();

    expect(mockedDaDoc).toHaveBeenCalledTimes(1);
    expect(mockedDaDoc).toHaveBeenCalledWith('p1');
  });

  /*
    Kết quả nạp về muộn, sau khi người dùng đã rời màn: vẫn đưa huy hiệu về 0,
    nhưng phải hỏi lại máy chủ — có thể đã có tin mới tới từ lúc đó mà người
    dùng chưa thấy.
  */
  it('nạp xong khi đã rời màn thì hỏi lại số chưa đọc thay vì tin chắc là 0', async () => {
    let traVe: (danhSach: ChatMessage[]) => void = () => undefined;
    mockedTin.mockReturnValueOnce(new Promise((xong) => (traVe = xong)));
    await render(dung());
    await roiMan();

    await act(async () => traVe([tin('m1', 'Dạ', 1)]));

    await waitFor(() =>
      expect(queryClient.getQueryState(['chat-unread', 'p1'])?.isInvalidated).toBe(true),
    );
  });

  /*
    Màn đã rời (vẫn sống vì là tab) thì KHÔNG gộp tin mới tới qua socket. Nếu gộp:
    lỡ một khoảng lúc app nằm nền, rồi tin mới cứ tới dồn vào màn ẩn — lúc mở lại,
    trang 40 tin mới nhất toàn là những tin đó, tin cũ nhất của trang "có trong
    tay", nên khoảng đã lỡ bị coi là liền mạch và mất luôn.
  */
  it('màn đã rời thì không gộp tin mới, để lần mở lại nhận ra khoảng đã lỡ', async () => {
    mockedTin.mockResolvedValueOnce(trangDay('a', 0));
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('a-2')).toBeTruthy());

    await roiMan();
    for (const t of trangDay('l', 200)) {
      await act(async () => socket.xuLy['message:project'](t as never));
    }
    mockedTin.mockResolvedValueOnce(trangDay('l', 200));
    await quayLaiMan();
    await waitFor(() => expect(man.getByText('l-2')).toBeTruthy());

    expect(man.queryByText('a-2')).toBeNull();
    await cuonLenDinh(man);
    expect(mockedLichSu).toHaveBeenCalledWith('p1', 'l0');
  });

  /*
    Gửi ở A xong muộn, trong lúc B đang tải ảnh lên: không được mở khoá nút Gửi
    của B giữa chừng — bấm lần nữa là ảnh lên nhóm hai lần.
  */
  it('gửi ở dự án cũ xong muộn không mở khoá nút Gửi của dự án mới', async () => {
    mockedTin.mockResolvedValueOnce([tin('m1', 'Tin P1', 1)]);
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('Tin P1')).toBeTruthy());

    let guiP1Xong: (m: ChatMessage) => void = () => undefined;
    mockedGui.mockReturnValueOnce(new Promise((xong) => (guiP1Xong = xong)));
    await act(async () => mockSoanTin!.onChangeText('xin chao'));
    await act(async () => mockSoanTin!.onSend());

    mockThamSo = { projectId: 'p2' };
    mockedTin.mockResolvedValueOnce([tin('m9', 'Tin P2', 2, 'p2')]);
    await man.rerender(dung());
    await waitFor(() => expect(man.getByText('Tin P2')).toBeTruthy());

    mockedGui.mockReturnValueOnce(new Promise(() => undefined));
    await act(async () => mockSoanTin!.onChangeText('tin P2'));
    await act(async () => mockSoanTin!.onSend());
    expect(mockSoanTin!.sending).toBe(true);

    await act(async () => guiP1Xong(tin('m2', 'xin chao', 3, 'p1', 'u1')));
    expect(mockSoanTin!.sending).toBe(true);
  });

  /*
    A → B → A trong lúc tin ở A đang gửi rồi hỏng: bong bóng "gửi lỗi" đã bị dọn
    cùng hai lần đổi dự án. Không báo thì nội dung người dùng gõ mất không dấu vết.
  */
  it('tin gửi hỏng sau khi đi A→B→A vẫn được báo, không mất im lặng', async () => {
    const spyAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockedTin.mockResolvedValue([tin('m1', 'Tin P1', 1)]);
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('Tin P1')).toBeTruthy());

    let guiHong: (loi: Error) => void = () => undefined;
    mockedGui.mockReturnValueOnce(new Promise((_, hong) => (guiHong = hong)));
    await act(async () => mockSoanTin!.onChangeText('noi dung quan trong'));
    await act(async () => mockSoanTin!.onSend());

    mockThamSo = { projectId: 'p2' };
    await man.rerender(dung());
    mockThamSo = { projectId: 'p1' };
    await man.rerender(dung());

    await act(async () => guiHong(new Error('mất mạng')));

    expect(spyAlert).toHaveBeenCalled();
    expect(String(spyAlert.mock.calls[0][1])).toContain('noi dung quan trong');
    spyAlert.mockRestore();
  });

  /*
    Đang cuộn lên tải trang cũ thì một lượt nạp lại phát hiện khoảng trống và
    phân trang lại từ trang mới. Trang cũ về sau phải bị bỏ — gộp vào là kéo mốc
    phân trang về dưới khoảng trống, khoảng đó lại mất.
  */
  it('trang cũ về muộn sau khi đã phân trang lại thì bị bỏ, mốc giữ theo trang mới', async () => {
    mockedTin.mockResolvedValueOnce(trangDay('a', 0));
    const man = await render(dung());
    await waitFor(() => expect(man.getByText('a-2')).toBeTruthy());

    let trangCuVe: (trang: unknown) => void = () => undefined;
    mockedLichSu.mockReturnValueOnce(new Promise((xong) => (trangCuVe = xong)) as never);
    await cuonLenDinh(man, 500);
    expect(mockedLichSu).toHaveBeenCalledWith('p1', 'a0');

    await roiMan();
    mockedTin.mockResolvedValueOnce(trangDay('b', 100, 20));
    await quayLaiMan();
    await waitFor(() => expect(man.getByText('b-22')).toBeTruthy());

    await act(async () =>
      trangCuVe({ items: [tin('z0', 'z-0', -10)], nextCursor: 'z0' }),
    );
    expect(man.queryByText('z-0')).toBeNull();

    mockedLichSu.mockResolvedValue({ items: [], nextCursor: null } as never);
    await waitFor(async () => {
      await cuonLenDinh(man, 700);
      expect(mockedLichSu).toHaveBeenLastCalledWith('p1', 'b20');
    });
  });
});
