import type { HanMucAI } from '../../api/entitlements';
import { NGUONG_SAP_HET, ngayNapLai, trangThaiHanMuc } from '../han-muc';

const han = (ghiDe: Partial<HanMucAI> = {}): HanMucAI => ({
  used: 0,
  limit: 10,
  remaining: 10,
  periodEnd: '2026-08-31T23:59:59.000Z',
  pending: 0,
  ...ghiDe,
});

describe('trangThaiHanMuc', () => {
  it('im lặng khi còn dư dả', () => {
    const t = trangThaiHanMuc(han({ remaining: 8 }));

    // Nhắc quá sớm thì thành phiền và người dùng học cách phớt lờ.
    expect(t.muc).toBe('du');
    expect(t.loiNhan).toBeNull();
  });

  it('bắt đầu nhắc đúng ở ngưỡng', () => {
    expect(trangThaiHanMuc(han({ remaining: NGUONG_SAP_HET })).muc).toBe('sap-het');
    expect(trangThaiHanMuc(han({ remaining: NGUONG_SAP_HET + 1 })).muc).toBe('du');
  });

  it('nói rõ còn bao nhiêu lượt khi sắp hết', () => {
    expect(trangThaiHanMuc(han({ remaining: 2 })).loiNhan).toBe(
      'Còn 2 lượt AI trong tháng này.',
    );
  });

  it('kèm mốc nạp lại khi đã hết', () => {
    /*
      "Hết lượt" mà không kèm thời điểm thì người dùng không biết nên chờ hay
      nên bỏ cuộc, và sẽ bấm lại nhiều lần vô ích.

      Chờ `1/9` chứ không phải `31/8`: máy chủ trả mốc cuối kỳ theo UTC, mà
      `31/08 23:59Z` là 06:59 sáng 01/09 giờ Việt Nam. Người dùng cần ngày HỌ
      có lượt mới.
    */
    const t = trangThaiHanMuc(han({ remaining: 0, used: 10 }));

    expect(t.muc).toBe('het');
    expect(t.loiNhan).toContain('1/9');
  });

  it('nêu đường thoát thủ công khi đã hết', () => {
    // Người dùng phải hiểu mình không bị chặn hoàn toàn: tính năng cốt lõi vẫn
    // dùng được, chỉ mất phần AI đọc hộ tin nhắn.
    expect(trangThaiHanMuc(han({ remaining: 0 })).loiNhan).toContain('thủ công');
  });

  it('coi số âm là hết, không hiện số âm cho người dùng', () => {
    // Máy chủ đã chặn ở 0 nhưng phòng trường hợp lệch do đơn đang giữ chỗ.
    const t = trangThaiHanMuc(han({ remaining: -2 }));

    expect(t.conLai).toBe(0);
    expect(t.muc).toBe('het');
  });
});

describe('ngayNapLai', () => {
  it('đọc theo giờ máy người dùng, không theo giờ máy chủ', () => {
    // Máy chạy test đặt múi giờ Việt Nam, nên 31/08 23:59Z ra 01/09.
    expect(ngayNapLai('2026-08-31T23:59:59.000Z')).toBe('1/9');
  });

  it('trả chuỗi rỗng khi mốc thời gian hỏng, không làm vỡ câu thông báo', () => {
    expect(ngayNapLai('linh tinh')).toBe('');
  });
});
