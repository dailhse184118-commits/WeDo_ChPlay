import { duongDanTepDinhKem, laAnh } from '../tep-dinh-kem';
import type { ChatAttachment } from '../../types';

function tep(phan: Partial<ChatAttachment> = {}): ChatAttachment {
  return {
    id: 'a1',
    originalName: 'anh.jpg',
    mimeType: 'image/jpeg',
    size: 1024,
    url: '/chat/attachments/a1',
    ...phan,
  };
}

describe('laAnh', () => {
  it('nhận mọi kiểu ảnh máy chủ cho phép', () => {
    ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].forEach((kieu) => {
      expect(laAnh(tep({ mimeType: kieu }))).toBe(true);
    });
  });

  it('không nhận tài liệu', () => {
    expect(laAnh(tep({ mimeType: 'application/pdf' }))).toBe(false);
  });

  /*
    Vài nguồn trên Android trả kiểu rỗng. Đoán theo đuôi tên tệp còn hơn dựng
    một thẻ tài liệu cho thứ rõ ràng là ảnh.
  */
  it('đoán theo đuôi tên khi thiếu kiểu', () => {
    expect(laAnh(tep({ mimeType: null, originalName: 'IMG_0042.JPG' }))).toBe(true);
    expect(laAnh(tep({ mimeType: '', originalName: 'bao-cao.docx' }))).toBe(false);
  });
});

describe('duongDanTepDinhKem', () => {
  it('ghép đường dẫn tương đối vào gốc máy chủ', () => {
    expect(duongDanTepDinhKem(tep(), 'https://api.wedo.vn')).toBe(
      'https://api.wedo.vn/chat/attachments/a1',
    );
  });

  it('cắt dấu gạch thừa ở cuối gốc', () => {
    expect(duongDanTepDinhKem(tep(), 'https://api.wedo.vn/')).toBe(
      'https://api.wedo.vn/chat/attachments/a1',
    );
  });

  /*
    Ảnh đại diện lấy từ Google là URL tuyệt đối. Ghép thêm gốc máy chủ WeDo vào
    đó cho ra một đường dẫn không tồn tại.
  */
  it('để nguyên đường dẫn đã tuyệt đối', () => {
    const ngoai = tep({ url: 'https://lh3.googleusercontent.com/abc' });

    expect(duongDanTepDinhKem(ngoai, 'https://api.wedo.vn')).toBe(
      'https://lh3.googleusercontent.com/abc',
    );
  });
});
