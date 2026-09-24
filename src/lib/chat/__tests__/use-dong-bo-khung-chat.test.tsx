import React from 'react';
import { AppState, Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { useDongBoKhungChat } from '../use-dong-bo-khung-chat';
import { nenHienThongBao, quenManDangMo } from '../../notifications/man-dang-mo';

/*
  Giả lập focus/blur của bộ điều hướng bằng tay: màn chat là một tab ẩn KHÔNG
  bao giờ bị gỡ, nên cả vòng đời của nó là focus → blur → focus lại trên CÙNG
  một lần render — đúng thứ kiểm thử phải tái hiện.
*/
let mockHieuUng: (() => void | (() => void)) | null = null;
let mockDon: void | (() => void) = undefined;
let mockDangFocus = true;
jest.mock('expo-router', () => ({
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

type XuLy = (...args: never[]) => void;
function socketGia() {
  const xuLy: Record<string, XuLy> = {};
  return {
    xuLy,
    on: jest.fn((ten: string, fn: XuLy) => {
      xuLy[ten] = fn;
    }),
    off: jest.fn((ten: string) => {
      delete xuLy[ten];
    }),
  };
}

let doiTrangThai: (trangThai: string) => void = () => undefined;
let spyAppState: jest.SpyInstance;

function Man(props: {
  khoa: string | null;
  socket: ReturnType<typeof socketGia> | null;
  napLai: () => void;
  onRoi?: () => void;
  bao?: (dangXem: () => boolean) => void;
  baoMo?: (dangMo: () => boolean) => void;
}) {
  const { dangXem, dangMo } = useDongBoKhungChat({
    khoaManDangMo: props.khoa,
    socket: props.socket as never,
    napLai: props.napLai,
    onRoi: props.onRoi,
  });
  props.bao?.(dangXem);
  props.baoMo?.(dangMo);
  return <Text>man</Text>;
}

beforeEach(() => {
  mockDangFocus = true;
  mockHieuUng = null;
  mockDon = undefined;
  quenManDangMo();
  spyAppState = jest.spyOn(AppState, 'addEventListener').mockImplementation((_, fn) => {
    doiTrangThai = fn as (trangThai: string) => void;
    return { remove: jest.fn() } as never;
  });
});

/*
  Bản 14 của thư viện kiểm thử: `act` cũng bất đồng bộ như `render`. Gọi mà
  không `await` thì từ ca thứ hai trở đi `render` không dựng gì cả, cũng không
  báo lỗi — mọi kiểm thử sau đỏ vì một lý do sai.
*/
afterEach(() => {
  spyAppState.mockRestore();
  jest.useRealTimers();
});

/* Nạp khi mở app lên được hoãn một nhịp — xem ca "mở app bằng thông báo của chỗ khác". */
async function choNapKhiMoApp() {
  await act(async () => {
    jest.advanceTimersByTime(1_000);
  });
}

describe('useDongBoKhungChat', () => {
  /*
    Lỗi gốc 23/09/2026: bấm lại đúng dự án đang mở dở chỉ đưa màn cũ lên trước,
    không nạp gì — tin mới không hiện, máy chủ không được báo đã đọc.
  */
  it('nạp lại MỖI lần màn được đưa lên, không chỉ lần gắn đầu tiên', async () => {
    const napLai = jest.fn();
    await render(<Man khoa="du-an:p1" socket={null} napLai={napLai} />);
    expect(napLai).toHaveBeenCalledTimes(1);

    await roiMan();
    await quayLaiMan();

    expect(napLai).toHaveBeenCalledTimes(2);
  });

  /*
    Android cắt kết nối khi app nằm nền; tin gửi lúc đó máy chủ KHÔNG phát lại.
    Không nạp bù thì mở app lên vẫn thiếu đúng những tin vừa được báo đẩy.
  */
  it('app trở lại tiền cảnh trong lúc đang xem thì nạp bù', async () => {
    const napLai = jest.fn();
    await render(<Man khoa="du-an:p1" socket={null} napLai={napLai} />);
    napLai.mockClear();
    jest.useFakeTimers();

    await act(async () => doiTrangThai('background'));
    await act(async () => doiTrangThai('active'));
    await choNapKhiMoApp();

    expect(napLai).toHaveBeenCalledTimes(1);
  });

  /*
    Để app đang mở khung chat p1, bấm Home, rồi mở lại bằng thông báo của một
    việc khác. Android báo "đã mở app" TRƯỚC khi lệnh chuyển màn kịp chạy, lúc
    p1 vẫn đang được focus. Nạp ngay là GET /chat của p1, và máy chủ ghi p1 là
    đã đọc, trong khi người dùng chưa hề thấy những tin đó.
  */
  it('mở app bằng thông báo của chỗ khác: không nạp (không đánh dấu đọc) khung chat cũ', async () => {
    const napLai = jest.fn();
    await render(<Man khoa="du-an:p1" socket={null} napLai={napLai} />);
    napLai.mockClear();
    jest.useFakeTimers();

    await act(async () => doiTrangThai('background'));
    await act(async () => doiTrangThai('active'));
    await roiMan();
    await choNapKhiMoApp();

    expect(napLai).not.toHaveBeenCalled();
  });

  it('socket nối lại trong lúc đang xem thì nạp bù', async () => {
    const napLai = jest.fn();
    const socket = socketGia();
    await render(<Man khoa="du-an:p1" socket={socket} napLai={napLai} />);
    napLai.mockClear();

    await act(async () => socket.xuLy.connect());

    expect(napLai).toHaveBeenCalledTimes(1);
  });

  /*
    Nạp lại khung chat là GET /chat — máy chủ coi đó là "đã đọc". Màn đã rời
    mà vẫn nạp khi socket nối lại hay app mở lên là xoá huy hiệu chưa đọc cho
    những tin người dùng chưa hề thấy.
  */
  it('không nạp khi màn đã rời đi rồi app mới mở lại', async () => {
    const napLai = jest.fn();
    await render(<Man khoa="du-an:p1" socket={null} napLai={napLai} />);
    await roiMan();
    napLai.mockClear();
    jest.useFakeTimers();

    // Phải đi qua nền thật: đi thẳng tới 'active' thì trình xử lý thoát sớm, ca
    // kiểm thử xanh bất kể có chặn theo focus hay không.
    await act(async () => doiTrangThai('background'));
    await act(async () => doiTrangThai('active'));
    await choNapKhiMoApp();

    expect(napLai).not.toHaveBeenCalled();
  });

  it('không nạp khi màn đã rời đi rồi socket mới nối lại', async () => {
    const napLai = jest.fn();
    const socket = socketGia();
    await render(<Man khoa="du-an:p1" socket={socket} napLai={napLai} />);
    await roiMan();
    napLai.mockClear();

    await act(async () => socket.xuLy.connect());

    expect(napLai).not.toHaveBeenCalled();
  });

  /* Đang ở màn này nhưng app nằm nền: không ai nhìn, không được coi là đã đọc. */
  it('socket nối lại lúc app nằm nền thì chưa nạp; mở app lên mới nạp', async () => {
    const napLai = jest.fn();
    const socket = socketGia();
    await render(<Man khoa="du-an:p1" socket={socket} napLai={napLai} />);
    napLai.mockClear();
    jest.useFakeTimers();

    await act(async () => doiTrangThai('background'));
    await act(async () => socket.xuLy.connect());
    expect(napLai).not.toHaveBeenCalled();

    await act(async () => doiTrangThai('active'));
    await choNapKhiMoApp();
    expect(napLai).toHaveBeenCalledTimes(1);
  });

  /* Màn cần biết lúc người dùng rời đi để báo đã đọc những tin vừa hiện trước mắt họ. */
  it('gọi onRoi đúng lúc rời màn', async () => {
    const onRoi = jest.fn();
    await render(<Man khoa="du-an:p1" socket={null} napLai={jest.fn()} onRoi={onRoi} />);
    expect(onRoi).not.toHaveBeenCalled();

    await roiMan();
    expect(onRoi).toHaveBeenCalledTimes(1);
  });

  it('chặn banner của đúng khung chat đang xem, rời màn thì trả lại', async () => {
    await render(<Man khoa="du-an:p1" socket={null} napLai={jest.fn()} />);
    expect(nenHienThongBao({ type: 'PROJECT_MESSAGE', projectId: 'p1' })).toBe(false);

    await roiMan();
    expect(nenHienThongBao({ type: 'PROJECT_MESSAGE', projectId: 'p1' })).toBe(true);
  });

  it('"đang xem" chỉ đúng khi màn được focus VÀ app ở tiền cảnh', async () => {
    let dangXem: () => boolean = () => false;
    await render(
      <Man khoa="du-an:p1" socket={null} napLai={jest.fn()} bao={(f) => (dangXem = f)} />,
    );
    expect(dangXem()).toBe(true);

    await act(async () => doiTrangThai('background'));
    expect(dangXem()).toBe(false);

    await act(async () => doiTrangThai('active'));
    await roiMan();
    expect(dangXem()).toBe(false);
  });

  it('gỡ lắng nghe socket khi màn bị gỡ, không để đăng ký chồng', async () => {
    const socket = socketGia();
    const man = await render(<Man khoa="du-an:p1" socket={socket} napLai={jest.fn()} />);
    await man.unmount();

    expect(socket.off).toHaveBeenCalledWith('connect', expect.any(Function));
  });

  /*
    Mở app lại: socket thường nối lại chỉ vài trăm mili-giây sau 'active' — TRƯỚC
    khi lệnh chuyển màn từ thông báo kịp chạy. Nạp ngay theo 'connect' là vượt qua
    nhịp hoãn ở nhánh AppState. Đang có nhịp hoãn thì để nhịp đó lo.
  */
  it('socket nối lại trong lúc đang hoãn nạp sau khi mở app: không nạp ngay, chỉ nạp một lần', async () => {
    const napLai = jest.fn();
    const socket = socketGia();
    await render(<Man khoa="du-an:p1" socket={socket} napLai={napLai} />);
    napLai.mockClear();
    jest.useFakeTimers();

    await act(async () => doiTrangThai('background'));
    await act(async () => doiTrangThai('active'));
    await act(async () => socket.xuLy.connect());
    expect(napLai).not.toHaveBeenCalled();

    await choNapKhiMoApp();
    expect(napLai).toHaveBeenCalledTimes(1);
  });

  /* App vào nền lúc đang xem cũng là thôi nhìn màn — chốt việc treo ngay lúc đó. */
  it('app vào nền lúc đang xem thì gọi onRoi', async () => {
    const onRoi = jest.fn();
    await render(<Man khoa="du-an:p1" socket={null} napLai={jest.fn()} onRoi={onRoi} />);

    await act(async () => doiTrangThai('background'));
    expect(onRoi).toHaveBeenCalledTimes(1);
  });

  it('"đang mở" theo focus, không phụ thuộc app ở tiền cảnh', async () => {
    let dangMo: () => boolean = () => false;
    await render(
      <Man khoa="du-an:p1" socket={null} napLai={jest.fn()} baoMo={(f) => (dangMo = f)} />,
    );
    expect(dangMo()).toBe(true);
    await act(async () => doiTrangThai('background'));
    expect(dangMo()).toBe(true);
    await roiMan();
    expect(dangMo()).toBe(false);
  });
});
