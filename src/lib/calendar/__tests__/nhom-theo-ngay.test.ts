import type { MucLich } from '../../api/calendar';
import { gioTrongNgay, nhanLoai, nhanNgay, nhomTheoNgay } from '../nhom-theo-ngay';

const HOM_NAY = new Date(2026, 7, 16, 10, 0);

const muc = (ghiDe: Partial<MucLich> = {}): MucLich => ({
  id: 'm-1',
  kind: 'EVENT',
  title: 'Họp nhóm',
  startTime: new Date(2026, 7, 16, 14, 30).toISOString(),
  endTime: new Date(2026, 7, 16, 15, 30).toISOString(),
  workspaceId: 'w-1',
  ...ghiDe,
});

describe('nhanNgay', () => {
  it('gọi tên hai ngày người dùng nhìn nhiều nhất', () => {
    expect(nhanNgay(new Date(2026, 7, 16), HOM_NAY)).toBe('Hôm nay');
    expect(nhanNgay(new Date(2026, 7, 17), HOM_NAY)).toBe('Ngày mai');
    expect(nhanNgay(new Date(2026, 7, 15), HOM_NAY)).toBe('Hôm qua');
  });

  it('kèm thứ cho ngày xa hơn', () => {
    // Sinh viên xếp lịch theo thứ chứ ít khi theo ngày dương.
    expect(nhanNgay(new Date(2026, 7, 21), HOM_NAY)).toBe('Thứ sáu, 21/8');
  });

  it('không nhầm "hôm nay" khi giờ trong ngày lệch nhau', () => {
    // Cùng ngày nhưng một cái lúc rạng sáng, một cái lúc tối.
    expect(nhanNgay(new Date(2026, 7, 16, 23, 30), new Date(2026, 7, 16, 0, 10))).toBe(
      'Hôm nay',
    );
  });
});

describe('nhomTheoNgay', () => {
  it('gom các mục cùng ngày vào một nhóm', () => {
    const ds = nhomTheoNgay(
      [
        muc({ id: 'a', startTime: new Date(2026, 7, 16, 9, 0).toISOString() }),
        muc({ id: 'b', startTime: new Date(2026, 7, 16, 15, 0).toISOString() }),
      ],
      HOM_NAY,
    );

    expect(ds).toHaveLength(1);
    expect(ds[0].muc.map((m) => m.id)).toEqual(['a', 'b']);
    expect(ds[0].nhan).toBe('Hôm nay');
  });

  it('không tạo nhóm rỗng cho ngày không có gì', () => {
    /*
      Danh sách lịch trình chỉ nên hiện ngày có việc. Ngày trống mà vẫn hiện thì
      người dùng phải cuộn qua một đống tiêu đề vô nghĩa.
    */
    const ds = nhomTheoNgay(
      [
        muc({ id: 'a', startTime: new Date(2026, 7, 16, 9, 0).toISOString() }),
        muc({ id: 'b', startTime: new Date(2026, 7, 20, 9, 0).toISOString() }),
      ],
      HOM_NAY,
    );

    expect(ds).toHaveLength(2);
    expect(ds.map((n) => n.nhan)).toEqual(['Hôm nay', 'Thứ năm, 20/8']);
  });

  it('sắp các nhóm theo thứ tự thời gian', () => {
    const ds = nhomTheoNgay(
      [
        muc({ id: 'sau', startTime: new Date(2026, 7, 20, 9, 0).toISOString() }),
        muc({ id: 'truoc', startTime: new Date(2026, 7, 16, 9, 0).toISOString() }),
      ],
      HOM_NAY,
    );

    expect(ds[0].muc[0].id).toBe('truoc');
  });

  it('bỏ qua mục có thời gian hỏng thay vì làm vỡ cả danh sách', () => {
    const ds = nhomTheoNgay(
      [muc({ id: 'hong', startTime: 'linh tinh' }), muc({ id: 'tot' })],
      HOM_NAY,
    );

    expect(ds).toHaveLength(1);
    expect(ds[0].muc[0].id).toBe('tot');
  });

  it('trả danh sách rỗng khi không có gì', () => {
    expect(nhomTheoNgay([], HOM_NAY)).toEqual([]);
  });
});

describe('nhanLoai', () => {
  it('đặt tên tiếng Việt cho từng loại', () => {
    expect(nhanLoai('MEETING')).toBe('Họp');
    expect(nhanLoai('TASK_DEADLINE')).toBe('Hạn chót');
    expect(nhanLoai('EVENT')).toBe('Sự kiện');
  });
});

describe('gioTrongNgay', () => {
  it('đệm số 0 cho phút', () => {
    expect(gioTrongNgay(new Date(2026, 7, 16, 9, 5).toISOString())).toBe('9:05');
  });

  it('trả rỗng khi thời gian hỏng', () => {
    expect(gioTrongNgay('linh tinh')).toBe('');
  });
});
