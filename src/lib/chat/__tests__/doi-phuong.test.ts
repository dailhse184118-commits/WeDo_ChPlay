import { doiPhuong } from '../doi-phuong';
import type { DirectConversation, UserSummary } from '../../types';

function nguoi(id: string, ten: string): UserSummary {
  return { id, email: `${id}@wedo.vn`, fullName: ten };
}

function hoiThoai(users: UserSummary[]): DirectConversation {
  return {
    id: 'c1',
    pairKey: users
      .map((u) => u.id)
      .sort()
      .join(':'),
    createdAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z',
    unreadCount: 0,
    participants: users.map((user) => ({ id: `p-${user.id}`, userId: user.id, user })),
  };
}

describe('doiPhuong', () => {
  const toi = nguoi('u1', 'Đại');
  const ban = nguoi('u2', 'Tuấn');

  it('trả về người còn lại', () => {
    expect(doiPhuong(hoiThoai([toi, ban]), 'u1')).toEqual(ban);
  });

  it('không phụ thuộc thứ tự người tham gia', () => {
    expect(doiPhuong(hoiThoai([ban, toi]), 'u1')).toEqual(ban);
  });

  it('trả về null khi mình không có trong hội thoại', () => {
    expect(doiPhuong(hoiThoai([toi, ban]), 'u9')).toBeNull();
  });

  it('trả về null khi hội thoại thiếu người tham gia', () => {
    expect(doiPhuong(hoiThoai([toi]), 'u1')).toBeNull();
  });
});
