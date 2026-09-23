import { laThongBaoCuocHop, meetingIdTuActionUrl } from '../cuoc-hop';

describe('laThongBaoCuocHop', () => {
  it('nhận thông báo mới có kèm id', () => {
    expect(laThongBaoCuocHop('#/meeting?meetingId=m-1')).toBe(true);
  });

  /* Thông báo tạo trước 23/09/2026 không kèm id — vẫn phải nhận ra. */
  it('nhận thông báo cũ chỉ có #/meeting', () => {
    expect(laThongBaoCuocHop('#/meeting')).toBe(true);
  });

  it('không nhận nhầm đường dẫn chỉ trùng phần đầu', () => {
    expect(laThongBaoCuocHop('#/meetings')).toBe(false);
    expect(laThongBaoCuocHop('#/meeting-room')).toBe(false);
    expect(laThongBaoCuocHop('#/upgrade')).toBe(false);
  });

  it('không nhận khi không có actionUrl', () => {
    expect(laThongBaoCuocHop(null)).toBe(false);
    expect(laThongBaoCuocHop(undefined)).toBe(false);
    expect(laThongBaoCuocHop('')).toBe(false);
  });
});

describe('meetingIdTuActionUrl', () => {
  it('lấy id cuộc họp', () => {
    expect(meetingIdTuActionUrl('#/meeting?meetingId=3f2a-9c')).toBe('3f2a-9c');
  });

  it('lấy được id dù có thêm tham số khác', () => {
    expect(meetingIdTuActionUrl('#/meeting?ref=push&meetingId=m-1')).toBe('m-1');
  });

  it('trả null cho thông báo cũ không kèm id — mở danh sách thay vì đoán', () => {
    expect(meetingIdTuActionUrl('#/meeting')).toBeNull();
    expect(meetingIdTuActionUrl('#/meeting?meetingId=')).toBeNull();
  });

  it('trả null cho thứ không phải thông báo cuộc họp', () => {
    expect(meetingIdTuActionUrl('#/upgrade?meetingId=m-1')).toBeNull();
    expect(meetingIdTuActionUrl(null)).toBeNull();
  });
});
