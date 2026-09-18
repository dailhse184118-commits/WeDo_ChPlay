import * as ImagePicker from 'expo-image-picker';

import { chupAnh, chonAnh, GIOI_HAN_ANH, GIOI_HAN_DUNG_LUONG_ANH } from '../pick-images';

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

const mocked = ImagePicker as jest.Mocked<typeof ImagePicker>;

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

describe('chupAnh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as never);
  });

  it('xin quyền máy ảnh trước khi mở', async () => {
    mocked.launchCameraAsync.mockResolvedValue({ canceled: true, assets: null } as never);

    await chupAnh();

    expect(mocked.requestCameraPermissionsAsync).toHaveBeenCalled();
  });

  /*
    Người dùng từ chối quyền thì phải nói rõ vì sao không mở được. Trả mảng rỗng
    lặng lẽ cho ra một nút bấm mãi không có phản ứng gì.
  */
  it('báo lỗi rõ ràng khi bị từ chối quyền', async () => {
    mocked.requestCameraPermissionsAsync.mockResolvedValue({ granted: false } as never);

    await expect(chupAnh()).rejects.toThrow(/máy ảnh/i);
    expect(mocked.launchCameraAsync).not.toHaveBeenCalled();
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

  it('coi như JPEG khi máy ảnh không trả kiểu', async () => {
    mocked.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [anh({ mimeType: undefined })],
    } as never);

    const ket = await chupAnh();

    expect(ket[0].mimeType).toBe('image/jpeg');
  });
});

describe('chonAnh', () => {
  beforeEach(() => jest.clearAllMocks());

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
