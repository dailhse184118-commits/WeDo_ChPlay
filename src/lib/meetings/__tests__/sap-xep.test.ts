import type { CuocHop, TrangThaiHop } from '../../api/meetings';
import { chiaHaiNhom, choVaoPhong, khoangGio, tenTrangThai } from '../sap-xep';

const BAY_GIO = new Date('2026-09-22T13:00:00.000Z');

function hop(
  id: string,
  startTime: string,
  extra: Partial<CuocHop> = {},
): CuocHop {
  return {
    id,
    title: `Họp ${id}`,
    startTime,
    status: 'SCHEDULED',
    workspaceId: 'w-1',
    projectId: 'p-1',
    ...extra,
  };
}

describe('chiaHaiNhom', () => {
  it('xếp họp tương lai vào sắp tới, họp quá khứ vào đã qua', () => {
    const { sapToi, daQua } = chiaHaiNhom(
      [
        hop('a', '2026-09-23T02:00:00.000Z'),
        hop('b', '2026-09-20T02:00:00.000Z'),
      ],
      BAY_GIO,
    );

    expect(sapToi.map((h) => h.id)).toEqual(['a']);
    expect(daQua.map((h) => h.id)).toEqual(['b']);
  });

  /*
    Cuộc họp bắt đầu lúc 20:00 mà 20:05 đã rơi xuống "đã qua" thì đúng lúc người
    ta cần bấm vào để vào lại phòng là lúc nó biến khỏi đầu danh sách.
  */
  it('họp vừa bắt đầu vẫn nằm ở sắp tới khi chưa khai giờ kết thúc', () => {
    const vuaBatDau = new Date(BAY_GIO.getTime() - 5 * 60_000).toISOString();
    const { sapToi } = chiaHaiNhom([hop('a', vuaBatDau)], BAY_GIO);
    expect(sapToi.map((h) => h.id)).toEqual(['a']);
  });

  it('quá 90 phút mà không có giờ kết thúc thì coi là đã qua', () => {
    const lauRoi = new Date(BAY_GIO.getTime() - 91 * 60_000).toISOString();
    const { daQua } = chiaHaiNhom([hop('a', lauRoi)], BAY_GIO);
    expect(daQua.map((h) => h.id)).toEqual(['a']);
  });

  it('có giờ kết thúc thì lấy giờ kết thúc làm mốc, không phải 90 phút', () => {
    const batDau = new Date(BAY_GIO.getTime() - 10 * 60_000).toISOString();
    const ketThuc = new Date(BAY_GIO.getTime() - 1 * 60_000).toISOString();
    const { daQua } = chiaHaiNhom([hop('a', batDau, { endTime: ketThuc })], BAY_GIO);
    expect(daQua.map((h) => h.id)).toEqual(['a']);
  });

  /*
    Huỷ thì không còn là thứ phải chuẩn bị, nhưng cũng KHÔNG được giấu hẳn —
    người ta cần thấy cuộc họp mình đang chờ đã bị huỷ.
  */
  it('họp đã huỷ nằm ở đã qua dù giờ còn ở tương lai, và không biến mất', () => {
    const tuongLai = '2026-09-25T02:00:00.000Z';
    const { sapToi, daQua } = chiaHaiNhom(
      [hop('a', tuongLai, { status: 'CANCELLED' })],
      BAY_GIO,
    );
    expect(sapToi).toHaveLength(0);
    expect(daQua.map((h) => h.id)).toEqual(['a']);
  });

  it('họp đã xong nằm ở đã qua dù giờ còn ở tương lai', () => {
    const { daQua } = chiaHaiNhom(
      [hop('a', '2026-09-25T02:00:00.000Z', { status: 'COMPLETED' })],
      BAY_GIO,
    );
    expect(daQua.map((h) => h.id)).toEqual(['a']);
  });

  it('sắp tới xếp gần nhất trước, đã qua xếp mới nhất trước', () => {
    const { sapToi, daQua } = chiaHaiNhom(
      [
        hop('xa', '2026-09-30T02:00:00.000Z'),
        hop('gan', '2026-09-23T02:00:00.000Z'),
        hop('cu', '2026-09-01T02:00:00.000Z'),
        hop('vuaRoi', '2026-09-20T02:00:00.000Z'),
      ],
      BAY_GIO,
    );

    expect(sapToi.map((h) => h.id)).toEqual(['gan', 'xa']);
    expect(daQua.map((h) => h.id)).toEqual(['vuaRoi', 'cu']);
  });

  it('không làm gì với danh sách rỗng', () => {
    expect(chiaHaiNhom([], BAY_GIO)).toEqual({ sapToi: [], daQua: [] });
  });
});

describe('choVaoPhong', () => {
  it.each<[TrangThaiHop, boolean]>([
    ['SCHEDULED', true],
    ['IN_PROGRESS', true],
    ['COMPLETED', false],
    ['CANCELLED', false],
  ])('trạng thái %s → %s', (status, mongDoi) => {
    expect(choVaoPhong(hop('a', BAY_GIO.toISOString(), { status }))).toBe(mongDoi);
  });
});

describe('tenTrangThai', () => {
  it('dịch đủ bốn trạng thái sang tiếng Việt', () => {
    expect(tenTrangThai('SCHEDULED')).toBe('Đã lên lịch');
    expect(tenTrangThai('IN_PROGRESS')).toBe('Đang họp');
    expect(tenTrangThai('COMPLETED')).toBe('Đã xong');
    expect(tenTrangThai('CANCELLED')).toBe('Đã huỷ');
  });

  /* Máy chủ thêm trạng thái mới thì thẻ vẫn phải đọc được, không ra `undefined`. */
  it('trạng thái lạ thì lùi về mặc định thay vì để trống', () => {
    expect(tenTrangThai('CHUA_CO' as TrangThaiHop)).toBe('Đã lên lịch');
  });
});

describe('khoangGio', () => {
  it('hiện khoảng khi có giờ kết thúc', () => {
    const chuoi = khoangGio(
      hop('a', '2026-09-22T13:00:00.000Z', { endTime: '2026-09-22T14:30:00.000Z' }),
    );
    expect(chuoi).toMatch(/^\d{2}:\d{2} – \d{2}:\d{2}$/);
  });

  it('chỉ hiện giờ bắt đầu khi chưa có giờ kết thúc', () => {
    expect(khoangGio(hop('a', '2026-09-22T13:00:00.000Z'))).toMatch(/^\d{2}:\d{2}$/);
  });

  /*
    Đây là lý do hàm này dùng `toLocaleTimeString` chứ không cắt chuỗi ISO: cắt
    tay ra sẽ luôn là giờ UTC, lệch bảy tiếng so với giờ người dùng ở Việt Nam.
  */
  it('đổi sang giờ máy, không phải giờ UTC', () => {
    const chuoi = khoangGio(hop('a', '2026-09-22T13:00:00.000Z'));
    const gioMay = new Date('2026-09-22T13:00:00.000Z').getHours();
    expect(chuoi).toBe(`${String(gioMay).padStart(2, '0')}:00`);
  });
});
