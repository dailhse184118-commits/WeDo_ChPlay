import * as DocumentPicker from 'expo-document-picker';

import { GIOI_HAN_SO_TEP, GIOI_HAN_DUNG_LUONG, chonTaiLieu } from '../pick-documents';

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));

const mockedPicker = DocumentPicker as jest.Mocked<typeof DocumentPicker>;

function tep(ghiDe: Partial<DocumentPicker.DocumentPickerAsset> = {}) {
  return {
    uri: 'file:///bao-cao.pdf',
    name: 'bao-cao.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    ...ghiDe,
  } as DocumentPicker.DocumentPickerAsset;
}

describe('chonTaiLieu', () => {
  beforeEach(() => mockedPicker.getDocumentAsync.mockReset());

  it('trả danh sách tệp đã chọn', async () => {
    mockedPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [tep(), tep({ uri: 'file:///anh.png', name: 'anh.png', mimeType: 'image/png' })],
    } as never);

    await expect(chonTaiLieu()).resolves.toEqual([
      { uri: 'file:///bao-cao.pdf', name: 'bao-cao.pdf', mimeType: 'application/pdf' },
      { uri: 'file:///anh.png', name: 'anh.png', mimeType: 'image/png' },
    ]);
  });

  it('cho chọn nhiều tệp một lần và chép về bộ nhớ tạm', async () => {
    /*
      Trên Android, uri kiểu content:// chỉ đọc được trong lúc hộp thoại còn
      mở. Không chép ra thì lúc gửi lên là tệp đã hết quyền truy cập.
    */
    mockedPicker.getDocumentAsync.mockResolvedValue({ canceled: true, assets: null } as never);

    await chonTaiLieu();

    expect(mockedPicker.getDocumentAsync).toHaveBeenCalledWith(
      expect.objectContaining({ multiple: true, copyToCacheDirectory: true }),
    );
  });

  it('trả mảng rỗng khi người dùng bấm huỷ', async () => {
    mockedPicker.getDocumentAsync.mockResolvedValue({ canceled: true, assets: null } as never);
    await expect(chonTaiLieu()).resolves.toEqual([]);
  });

  it('đặt tên thay thế khi máy không đọc được tên tệp', async () => {
    // Vai nguon tren Android tra name rong; may chu can mot originalName co nghia.
    mockedPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [tep({ name: '' })],
    } as never);

    const ketQua = await chonTaiLieu();
    expect(ketQua[0].name).toBe('tai-lieu');
  });

  it('từ chối khi chọn quá số tệp máy chủ nhận', async () => {
    mockedPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: Array.from({ length: GIOI_HAN_SO_TEP + 1 }, () => tep()),
    } as never);

    await expect(chonTaiLieu()).rejects.toThrow(`tối đa ${GIOI_HAN_SO_TEP} tệp`);
  });

  it('từ chối tệp nặng hơn giới hạn của máy chủ, kèm tên tệp', async () => {
    /*
      Máy chủ chặn ở 20MB. Để nó tự chối thì người dùng đã ngồi đợi tải hết tệp
      qua mạng di động rồi mới biết là hỏng.
    */
    mockedPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [tep({ name: 'video.mp4', size: GIOI_HAN_DUNG_LUONG + 1 })],
    } as never);

    await expect(chonTaiLieu()).rejects.toThrow('video.mp4');
  });
});
