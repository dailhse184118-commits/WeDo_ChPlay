import React from 'react';
import { Linking } from 'react-native';
import { act, fireEvent } from '@testing-library/react-native';
import { useCameraPermissions } from 'expo-camera';

import { QuetMaQr } from '../QuetMaQr';
import { chuVietConSot } from '../../../i18n/chu-viet-con-sot';
import { datNgonNguChoKiemThu } from '../../../i18n/ngon-ngu';
import { renderScreen } from '../../../test-utils/render';

// expo-camera được mock chung trong jest.setup.js: CameraView là View giữ props.
const quyenMock = jest.mocked(useCameraPermissions);

function datQuyen(quyen: { granted: boolean; canAskAgain: boolean; status: string } | null) {
  const xin = jest.fn(async () => quyen as never);
  quyenMock.mockReturnValue([quyen as never, xin, jest.fn()]);
  return xin;
}

function dung(onMa = jest.fn(), onDong = jest.fn()) {
  return renderScreen(<QuetMaQr visible onMa={onMa} onDong={onDong} />);
}

async function quet(man: Awaited<ReturnType<typeof dung>>, data: string) {
  const mayAnh = man.getByTestId('may-anh-quet-qr');
  await act(async () => {
    mayAnh.props.onBarcodeScanned({ data, type: 'qr' });
  });
}

const cay = (man: { toJSON: () => unknown }) => JSON.stringify(man.toJSON());

beforeEach(() => {
  jest.clearAllMocks();
  datQuyen({ granted: true, canAskAgain: true, status: 'granted' });
});


it('chỉ đọc mã QR, máy ảnh sau', async () => {
  const man = await dung();

  const mayAnh = man.getByTestId('may-anh-quet-qr');
  expect(mayAnh.props.barcodeScannerSettings).toEqual({ barcodeTypes: ['qr'] });
  expect(mayAnh.props.facing).toBe('back');
  expect(man.getByText('Đưa mã QR mời vào khung để quét.')).toBeTruthy();
});

it('quét được link mời: trả mã đã chuẩn hoá ra ngoài', async () => {
  const onMa = jest.fn();
  const man = await dung(onMa);

  await quet(man, 'https://wedofpt.com.vn/#/moi/7k3m9qxa');

  expect(onMa).toHaveBeenCalledWith('7K3M9QXA');
  expect(man.queryByTestId('loi-quet-qr')).toBeNull();
});

it('QR không phải lời mời: báo lỗi, không gọi onMa, vẫn quét tiếp được', async () => {
  const onMa = jest.fn();
  const man = await dung(onMa);

  await quet(man, 'https://example.com/menu');

  expect(onMa).not.toHaveBeenCalled();
  expect(man.getByTestId('loi-quet-qr').props.children).toBe('Mã QR này không phải lời mời WeDo.');

  await quet(man, '7K3M-9QXA');
  expect(onMa).toHaveBeenCalledWith('7K3M9QXA');
});

it('máy ảnh báo cùng một mã hai lần liên tiếp: chỉ xử lý một lần', async () => {
  const onMa = jest.fn();
  const man = await dung(onMa);
  const mayAnh = man.getByTestId('may-anh-quet-qr');

  await act(async () => {
    mayAnh.props.onBarcodeScanned({ data: 'https://wedofpt.com.vn/#/moi/7K3M9QXA', type: 'qr' });
    mayAnh.props.onBarcodeScanned({ data: 'https://wedofpt.com.vn/#/moi/ABCD2345', type: 'qr' });
  });

  expect(onMa).toHaveBeenCalledTimes(1);
  expect(onMa).toHaveBeenCalledWith('7K3M9QXA');
});

it('chưa hỏi quyền bao giờ: tự hỏi khi mở', async () => {
  const xin = datQuyen({ granted: false, canAskAgain: true, status: 'undetermined' });

  const man = await dung();

  expect(xin).toHaveBeenCalledTimes(1);
  expect(man.queryByTestId('may-anh-quet-qr')).toBeNull();
  expect(man.getByTestId('nut-cho-phep-may-anh')).toBeTruthy();
});

it('đã bị từ chối hẳn: giải thích và có nút mở Cài đặt, không hỏi lại', async () => {
  const xin = datQuyen({ granted: false, canAskAgain: false, status: 'denied' });
  const moCaiDat = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);

  const man = await dung();

  expect(xin).not.toHaveBeenCalled();
  expect(man.queryByTestId('may-anh-quet-qr')).toBeNull();
  expect(man.getByTestId('giai-thich-quyen-may-anh').props.children).toBe(
    'Quyền máy ảnh của WeDo đang tắt. Mở Cài đặt để bật lại rồi quét tiếp.',
  );

  await fireEvent.press(man.getByTestId('nut-mo-cai-dat'));
  expect(moCaiDat).toHaveBeenCalledTimes(1);
  moCaiDat.mockRestore();
});

it('nút Đóng gọi onDong', async () => {
  const onDong = jest.fn();
  const man = await dung(jest.fn(), onDong);

  await fireEvent.press(man.getByTestId('nut-dong-quet-qr'));

  expect(onDong).toHaveBeenCalledTimes(1);
});

it('không mở thì không bật máy ảnh', async () => {
  const man = await renderScreen(<QuetMaQr visible={false} onMa={jest.fn()} onDong={jest.fn()} />);

  expect(man.queryByTestId('may-anh-quet-qr')).toBeNull();
});

describe('tiếng Anh', () => {
  beforeEach(() => datNgonNguChoKiemThu('en'));

  it('màn quét và câu báo QR lạ không còn chữ tiếng Việt', async () => {
    const man = await dung();

    await quet(man, 'WIFI:S:Cafe;T:WPA;P:12345678;;');

    expect(man.getByText('Scan QR code')).toBeTruthy();
    expect(man.getByText('Fit the invite QR code inside the frame.')).toBeTruthy();
    expect(man.getByTestId('loi-quet-qr').props.children).toBe('This QR code isn’t a WeDo invite.');
    expect(man.getByLabelText('Close')).toBeTruthy();
    expect(chuVietConSot(cay(man))).toEqual([]);
  });

  it('bị từ chối quyền: câu giải thích và nút Cài đặt bằng tiếng Anh', async () => {
    datQuyen({ granted: false, canAskAgain: false, status: 'denied' });

    const man = await dung();

    expect(man.getByText('Open Settings')).toBeTruthy();
    expect(
      man.getByText('Camera access for WeDo is turned off. Open Settings to turn it back on, then scan again.'),
    ).toBeTruthy();
    expect(chuVietConSot(cay(man))).toEqual([]);
  });
});
