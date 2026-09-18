import { nguoiKiaTrongTinhBan, trangThaiKetBan } from '../quan-he';
import type { Friendship, NguoiTimDuoc, UserSummary } from '../../types';

function nguoi(id: string, ten: string): UserSummary {
  return { id, email: `${id}@wedo.vn`, fullName: ten };
}

const TOI = nguoi('u1', 'Đại');
const BAN = nguoi('u2', 'Tuấn');

function tinhBan(overrides: Partial<Friendship> = {}): Friendship {
  return {
    id: 'f1',
    pairKey: 'u1:u2',
    requesterId: 'u1',
    addresseeId: 'u2',
    status: 'ACCEPTED',
    createdAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z',
    requester: TOI,
    addressee: BAN,
    ...overrides,
  };
}

describe('nguoiKiaTrongTinhBan', () => {
  it('mình là người gửi thì trả về người nhận', () => {
    expect(nguoiKiaTrongTinhBan(tinhBan(), 'u1')).toEqual(BAN);
  });

  it('mình là người nhận thì trả về người gửi', () => {
    expect(nguoiKiaTrongTinhBan(tinhBan(), 'u2')).toEqual(TOI);
  });

  it('trả null khi mình không thuộc quan hệ này', () => {
    expect(nguoiKiaTrongTinhBan(tinhBan(), 'u9')).toBeNull();
  });

  it('trả null khi máy chủ không kèm hồ sơ người kia', () => {
    expect(nguoiKiaTrongTinhBan(tinhBan({ addressee: undefined }), 'u1')).toBeNull();
  });
});

describe('trangThaiKetBan', () => {
  function timDuoc(friendship?: Friendship | null): NguoiTimDuoc {
    return { ...BAN, friendship };
  }

  it('chưa có quan hệ nào', () => {
    expect(trangThaiKetBan(timDuoc(null), 'u1')).toBe('chua-gi-ca');
    expect(trangThaiKetBan(timDuoc(undefined), 'u1')).toBe('chua-gi-ca');
  });

  it('đã là bạn', () => {
    expect(trangThaiKetBan(timDuoc(tinhBan({ status: 'ACCEPTED' })), 'u1')).toBe('la-ban');
  });

  /*
    Hai nhánh này dễ lẫn nhất, và lẫn thì giao diện hiện sai hẳn: người đang chờ
    mình duyệt lại thấy nút "Đã gửi lời mời" mờ đi, nên không ai duyệt được cho
    ai. Phải phân biệt theo việc AI là người gửi.
  */
  it('mình gửi, đang chờ người kia duyệt', () => {
    const f = tinhBan({ status: 'PENDING', requesterId: 'u1', addresseeId: 'u2' });
    expect(trangThaiKetBan(timDuoc(f), 'u1')).toBe('da-gui-loi-moi');
  });

  it('người kia gửi, đang chờ mình duyệt', () => {
    const f = tinhBan({ status: 'PENDING', requesterId: 'u2', addresseeId: 'u1' });
    expect(trangThaiKetBan(timDuoc(f), 'u1')).toBe('cho-minh-duyet');
  });

  /*
    Từ chối rồi vẫn phải cho gửi lại. Máy chủ dùng `upsert` nên lời mời mới ghi
    đè lên bản ghi cũ — chặn ở giao diện là chặn nhầm.
  */
  it('đã từ chối thì coi như chưa có gì, gửi lại được', () => {
    expect(trangThaiKetBan(timDuoc(tinhBan({ status: 'REJECTED' })), 'u1')).toBe('chua-gi-ca');
  });
});
