import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator } from 'expo-image-manipulator';

import {
  CAU_CHUA_CO_QUYEN_MAY_ANH,
  canDoiSangJpeg,
  chupAnh,
  chonAnh,
  GIOI_HAN_ANH,
  GIOI_HAN_DUNG_LUONG_ANH,
} from '../pick-images';

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  UIImagePickerPreferredAssetRepresentationMode: { Compatible: 'compatible' },
}));

const saveAsync = jest.fn();
const renderAsync = jest.fn();

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' },
}));

const mocked = ImagePicker as jest.Mocked<typeof ImagePicker>;
const manipulate = ImageManipulator.manipulate as jest.MockedFunction<
  typeof ImageManipulator.manipulate
>;

let heDieuHanh: jest.ReplaceProperty<typeof Platform.OS> | undefined;

function anh(phan: Partial<ImagePicker.ImagePickerAsset> = {}) {
  return {
    uri: 'file:///tmp/a.jpg',
    width: 100,
    height: 100,
    mimeType: 'image/jpeg',
    fileName: 'a.jpg',
    fileSize: 1024,
    ...phan,
  } as ImagePicker.ImagePickerAsset;
}

beforeEach(() => {
  jest.clearAllMocks();
  saveAsync.mockResolvedValue({ uri: 'file:///cache/da-nen.jpg', width: 100, height: 100 });
  renderAsync.mockResolvedValue({ saveAsync });
  manipulate.mockReturnValue({ renderAsync } as never);
  heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
});

afterEach(() => {
  heDieuHanh?.restore();
  heDieuHanh = undefined;
});

describe('chupAnh', () => {
  let hopThoai: jest.SpyInstance;

  beforeEach(() => {
    mocked.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as never);
    hopThoai = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    hopThoai.mockRestore();
  });

  it('xin quyền máy ảnh trước khi mở', async () => {
    mocked.launchCameraAsync.mockResolvedValue({ canceled: true, assets: null } as never);

    await chupAnh();

    expect(mocked.requestCameraPermissionsAsync).toHaveBeenCalled();
  });

  /*
    Người dùng từ chối quyền thì phải nói rõ vì sao không mở được, và chỉ lối
    bật lại. "Cài đặt > Ứng dụng > WeDo > Quyền" chỉ có trên Android — iPhone
    không có đường đó, nên câu phải trung tính kèm nút mở thẳng Cài đặt.
  */
  it('bị từ chối quyền: nói rõ, không chỉ đường kiểu Android, có nút Mở Cài đặt', async () => {
    mocked.requestCameraPermissionsAsync.mockResolvedValue({ granted: false } as never);
    const moCaiDat = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);

    await expect(chupAnh()).resolves.toEqual([]);

    expect(mocked.launchCameraAsync).not.toHaveBeenCalled();
    expect(hopThoai).toHaveBeenCalledTimes(1);
    const [, loiNhan, nut] = hopThoai.mock.calls[0] as [
      string,
      string,
      Array<{ text: string; onPress?: () => void }>,
    ];
    expect(loiNhan).toBe(CAU_CHUA_CO_QUYEN_MAY_ANH);
    expect(loiNhan).toMatch(/máy ảnh/i);
    expect(loiNhan).not.toMatch(/Ứng dụng >|Quyền/);

    nut.find((n) => n.text === 'Mở Cài đặt')?.onPress?.();
    expect(moCaiDat).toHaveBeenCalledTimes(1);
    moCaiDat.mockRestore();
  });

  it('huỷ chụp thì trả mảng rỗng, không phải lỗi', async () => {
    mocked.launchCameraAsync.mockResolvedValue({ canceled: true, assets: null } as never);

    await expect(chupAnh()).resolves.toEqual([]);
  });

  it('trả tệp đã đủ trường để gửi lên', async () => {
    mocked.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [anh()] } as never);

    await expect(chupAnh()).resolves.toEqual([
      { uri: 'file:///tmp/a.jpg', name: 'a.jpg', mimeType: 'image/jpeg' },
    ]);
    expect(manipulate).not.toHaveBeenCalled();
  });

  /*
    Máy ảnh Android hay trả tên rỗng. Multer phía máy chủ đòi mỗi phần phải có
    tên tệp, thiếu là 400.
  */
  it('tự đặt tên khi máy ảnh không trả tên', async () => {
    mocked.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [anh({ fileName: null })],
    } as never);

    const ket = await chupAnh();

    expect(ket[0].name).toBe('anh.jpg');
  });

  it('Android: coi như JPEG khi máy ảnh không trả kiểu, không nén lại', async () => {
    mocked.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [anh({ mimeType: undefined })],
    } as never);

    const ket = await chupAnh();

    expect(ket[0].mimeType).toBe('image/jpeg');
    expect(manipulate).not.toHaveBeenCalled();
  });
});

describe('chonAnh', () => {
  /*
    Bộ chọn ảnh của Android không cần xin quyền kho ảnh. Xin thêm là tự rước
    quyền READ_MEDIA_IMAGES, thứ Google bắt khai báo riêng khi lên CH Play.
  */
  it('không xin quyền kho ảnh', async () => {
    mocked.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null } as never);

    await chonAnh();

    expect(mocked.requestCameraPermissionsAsync).not.toHaveBeenCalled();
  });

  it('cho chọn nhiều, chặn đúng ở giới hạn máy chủ nhận', async () => {
    mocked.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null } as never);

    await chonAnh();

    const tuyChon = mocked.launchImageLibraryAsync.mock.calls[0][0];
    expect(tuyChon).toMatchObject({
      allowsMultipleSelection: true,
      selectionLimit: GIOI_HAN_ANH,
    });
  });

  it('nhờ bộ chọn ảnh iOS trả dạng tương thích thay vì HEIC', async () => {
    mocked.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null } as never);

    await chonAnh();

    expect(mocked.launchImageLibraryAsync.mock.calls[0][0]).toMatchObject({
      preferredAssetRepresentationMode: 'compatible',
    });
  });

  it('ném lỗi khi có ảnh nặng quá mức máy chủ nhận', async () => {
    mocked.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [anh({ fileSize: GIOI_HAN_DUNG_LUONG_ANH + 1, fileName: 'to-qua.png' })],
    } as never);

    await expect(chonAnh()).rejects.toThrow(/to-qua\.png/);
  });

  it('trả nhiều tệp khi chọn nhiều', async () => {
    mocked.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [anh(), anh({ uri: 'file:///tmp/b.png', fileName: 'b.png', mimeType: 'image/png' })],
    } as never);

    await expect(chonAnh()).resolves.toHaveLength(2);
  });
});

/*
  iPhone lưu ảnh dạng HEIC. Máy chủ chỉ nhận jpeg, png, webp, gif — và web lẫn
  Android cũng không hiện được HEIC. Gửi nguyên là 400 "File không hợp lệ".
*/
describe('ảnh HEIC', () => {
  const HEIC = anh({
    uri: 'file:///tmp/IMG_0001.HEIC',
    fileName: 'IMG_0001.HEIC',
    mimeType: 'image/heic',
  });

  it('iPhone: nén HEIC sang JPEG, đổi đuôi .jpg và kiểu image/jpeg', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    mocked.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [HEIC] } as never);

    const ket = await chonAnh();

    expect(manipulate).toHaveBeenCalledWith('file:///tmp/IMG_0001.HEIC');
    expect(saveAsync).toHaveBeenCalledWith(expect.objectContaining({ format: 'jpeg' }));
    expect(ket).toEqual([
      { uri: 'file:///cache/da-nen.jpg', name: 'IMG_0001.jpg', mimeType: 'image/jpeg' },
    ]);
  });

  it('nhận ra HEIF qua đuôi tên dù thiếu kiểu, trên cả Android', async () => {
    mocked.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [anh({ uri: 'file:///tmp/x.heif', fileName: 'x.heif', mimeType: undefined })],
    } as never);

    const ket = await chonAnh();

    expect(ket[0]).toEqual({
      uri: 'file:///cache/da-nen.jpg',
      name: 'x.jpg',
      mimeType: 'image/jpeg',
    });
  });

  it('iPhone: ảnh thiếu kiểu cũng nén lại, không đoán bừa là JPEG', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    mocked.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [anh({ uri: 'file:///tmp/cam', fileName: null, mimeType: undefined })],
    } as never);
    mocked.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as never);

    const ket = await chupAnh();

    expect(manipulate).toHaveBeenCalledWith('file:///tmp/cam');
    expect(ket[0]).toEqual({
      uri: 'file:///cache/da-nen.jpg',
      name: 'anh.jpg',
      mimeType: 'image/jpeg',
    });
  });

  it('iPhone: JPEG và PNG gửi nguyên, không nén lần hai', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    mocked.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [anh(), anh({ uri: 'file:///tmp/b.png', fileName: 'b.png', mimeType: 'image/png' })],
    } as never);

    const ket = await chonAnh();

    expect(manipulate).not.toHaveBeenCalled();
    expect(ket.map((t) => t.mimeType)).toEqual(['image/jpeg', 'image/png']);
  });

  it('Android: webp gửi nguyên như trước', () => {
    expect(canDoiSangJpeg(anh({ mimeType: 'image/webp', fileName: 'a.webp' }))).toBe(false);
  });

  it('nén hỏng thì báo rõ ảnh nào, không gửi nguyên HEIC', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    renderAsync.mockRejectedValue(new Error('decode failed'));
    mocked.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [HEIC] } as never);

    await expect(chonAnh()).rejects.toThrow(/IMG_0001\.HEIC/);
  });
});
