import { nhomBanBe } from '../danh-sach';
import type { FriendsList, Friendship } from '../../types';

const TOI = 'u1';

function tinhBan(phan: Partial<Friendship>): Friendship {
  return {
    id: 'f1',
    pairKey: 'u1:u2',
    requesterId: 'u1',
    addresseeId: 'u2',
    status: 'ACCEPTED',
    createdAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z',
    requester: { id: 'u1', email: 'toi@wedo.vn', fullName: 'Tôi' },
    addressee: { id: 'u2', email: 'tuan@wedo.vn', fullName: 'Tuấn' },
    ...phan,
  };
}

function danhSach(phan: Partial<FriendsList> = {}): FriendsList {
  return { friends: [], incoming: [], outgoing: [], ...phan };
}

describe('nhomBanBe', () => {
  it('lấy đúng người kia dù mình ở vai nào', () => {
    const ketQua = nhomBanBe(
      danhSach({
        friends: [
          tinhBan({ id: 'f1' }),
          tinhBan({
            id: 'f2',
            requesterId: 'u3',
            addresseeId: 'u1',
            requester: { id: 'u3', email: 'lan@wedo.vn', fullName: 'Lan' },
            addressee: { id: 'u1', email: 'toi@wedo.vn', fullName: 'Tôi' },
          }),
        ],
      }),
      TOI,
    );

    expect(ketQua.banBe.map((dong) => dong.nguoi.fullName)).toEqual(['Tuấn', 'Lan']);
  });

  it('giữ id lời mời để còn duyệt được', () => {
    const ketQua = nhomBanBe(
      danhSach({
        incoming: [
          tinhBan({
            id: 'f9',
            status: 'PENDING',
            requesterId: 'u3',
            addresseeId: 'u1',
            requester: { id: 'u3', email: 'lan@wedo.vn', fullName: 'Lan' },
            addressee: { id: 'u1', email: 'toi@wedo.vn', fullName: 'Tôi' },
          }),
        ],
      }),
      TOI,
    );

    expect(ketQua.denMinh).toEqual([
      { tinhBanId: 'f9', nguoi: { id: 'u3', email: 'lan@wedo.vn', fullName: 'Lan' } },
    ]);
  });

  it('tách lời mời mình đã gửi', () => {
    const ketQua = nhomBanBe(
      danhSach({ outgoing: [tinhBan({ id: 'f5', status: 'PENDING' })] }),
      TOI,
    );

    expect(ketQua.daGui.map((dong) => dong.nguoi.fullName)).toEqual(['Tuấn']);
    expect(ketQua.denMinh).toEqual([]);
  });

  /*
    Máy chủ đôi khi trả bản ghi thiếu hồ sơ người kia — người đó vừa bị xoá,
    chẳng hạn. Một dòng hỏng chỉ được mất một dòng, không được làm sập cả màn.
  */
  it('bỏ qua dòng không xác định được người kia', () => {
    const ketQua = nhomBanBe(
      danhSach({
        friends: [
          tinhBan({ id: 'f1', addressee: undefined }),
          tinhBan({ id: 'f2' }),
        ],
      }),
      TOI,
    );

    expect(ketQua.banBe).toHaveLength(1);
    expect(ketQua.banBe[0].tinhBanId).toBe('f2');
  });

  it('bỏ qua dòng mình không thuộc quan hệ', () => {
    const ketQua = nhomBanBe(
      danhSach({
        friends: [tinhBan({ id: 'f7', requesterId: 'u8', addresseeId: 'u9' })],
      }),
      TOI,
    );

    expect(ketQua.banBe).toEqual([]);
  });
});
