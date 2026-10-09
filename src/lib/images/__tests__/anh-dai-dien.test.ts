import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator } from 'expo-image-manipulator';

import { CANH_ANH_DAI_DIEN, chonAnhDaiDien } from '../anh-dai-dien';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

const saveAsync = jest.fn();
const renderAsync = jest.fn();
const resize = jest.fn();

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' },
}));

const chon = ImagePicker.launchImageLibraryAsync as jest.MockedFunction<
  typeof ImagePicker.launchImageLibraryAsync
>;
const manipulate = ImageManipulator.manipulate as jest.MockedFunction<
  typeof ImageManipulator.manipulate
>;

beforeEach(() => {
  jest.clearAllMocks();
  resize.mockReturnValue(undefined);
  saveAsync.mockResolvedValue({ uri: 'file:///nho.jpg', base64: 'AAAA' });
  renderAsync.mockResolvedValue({ saveAsync });
  manipulate.mockReturnValue({ resize, renderAsync } as never);

  chon.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///goc.jpg' }],
  } as never);
});

describe('chonAnhDaiDien', () => {
  it('huỷ chọn thì trả null, không phải lỗi', async () => {
    chon.mockResolvedValue({ canceled: true, assets: null } as never);

    await expect(chonAnhDaiDien()).resolves.toBeNull();
  });

  it('cắt vuông ngay trong trình chọn', async () => {
    await chonAnhDaiDien();

    expect(chon.mock.calls[0][0]).toMatchObject({
      allowsEditing: true,
      aspect: [1, 1],
    });
  });

  /*
    Đây là lý do tồn tại của cả hàm này.

    Máy chủ lưu ảnh đại diện dưới dạng chuỗi base64 nhét thẳng vào `avatarUrl`,
    và `avatarUrl` được trả kèm MỖI tin nhắn. Ảnh gốc 12MP cắt vuông vẫn còn
    khoảng 3000x3000 — nhân bốn mươi tin là hàng chục MB mỗi lần mở hội thoại.

    Thu về 256px cho ra chừng hai chục KB, đủ nét cho một vòng tròn 40dp.
  */
  it('thu ảnh về đúng cạnh đã định trước khi mã hoá', async () => {
    await chonAnhDaiDien();

    expect(manipulate).toHaveBeenCalledWith('file:///goc.jpg');
    expect(resize).toHaveBeenCalledWith({ width: CANH_ANH_DAI_DIEN, height: CANH_ANH_DAI_DIEN });
  });

  it('trả về data URL để PATCH thẳng vào avatarUrl', async () => {
    await expect(chonAnhDaiDien()).resolves.toBe('data:image/jpeg;base64,AAAA');
  });

  /*
    Ảnh thư viện iPhone là HEIC — web và Android không hiện được. Ảnh đại diện
    luôn đi qua bước dựng lại rồi lưu JPEG, nên HEIC cũng ra JPEG.
  */
  it('ảnh HEIC của iPhone cũng ra JPEG', async () => {
    chon.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///IMG_0001.HEIC', mimeType: 'image/heic', fileName: 'IMG_0001.HEIC' }],
    } as never);

    await expect(chonAnhDaiDien()).resolves.toMatch(/^data:image\/jpeg;base64,/);
    expect(manipulate).toHaveBeenCalledWith('file:///IMG_0001.HEIC');
    expect(saveAsync).toHaveBeenCalledWith(expect.objectContaining({ format: 'jpeg' }));
  });

  it('lưu dạng JPEG kèm base64', async () => {
    await chonAnhDaiDien();

    expect(saveAsync).toHaveBeenCalledWith(
      expect.objectContaining({ base64: true, format: 'jpeg' }),
    );
  });

  /*
    Thiếu base64 thì dựng ra chuỗi "data:image/jpeg;base64,undefined" — một
    giá trị trông hợp lệ mà không bao giờ dựng được thành ảnh.
  */
  it('ném lỗi rõ ràng khi không mã hoá được', async () => {
    saveAsync.mockResolvedValue({ uri: 'file:///nho.jpg' });

    await expect(chonAnhDaiDien()).rejects.toThrow(/ảnh/i);
  });
});
