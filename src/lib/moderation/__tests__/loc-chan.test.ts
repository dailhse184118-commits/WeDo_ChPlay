import { locHoiThoaiNguoiDaChan, locTinNguoiDaChan, tapNguoiDaChan } from '../loc-chan';
import type { DirectConversation } from '../../types';

describe('tapNguoiDaChan', () => {
  it('gom id người đã chặn thành tập', () => {
    const tap = tapNguoiDaChan([
      { userId: 'u2', fullName: 'Tuấn', avatarUrl: null, blockedAt: '' },
      { userId: 'u3', fullName: 'Lan', avatarUrl: null, blockedAt: '' },
    ]);
    expect([...tap].sort()).toEqual(['u2', 'u3']);
  });

  it('chưa tải được danh sách thì là tập rỗng — không chặn nhầm ai', () => {
    expect(tapNguoiDaChan(undefined).size).toBe(0);
    expect(tapNguoiDaChan(null).size).toBe(0);
  });
});

describe('locTinNguoiDaChan', () => {
  const tin = [
    { id: 'm1', authorId: 'u1' },
    { id: 'm2', authorId: 'u2' },
    { id: 'm3', authorId: 'u3' },
    { id: 'm4', authorId: 'u2' },
  ];

  it('bỏ mọi tin do người đã chặn viết, giữ nguyên thứ tự phần còn lại', () => {
    const conLai = locTinNguoiDaChan(tin, new Set(['u2']), (t) => t.authorId);
    expect(conLai.map((t) => t.id)).toEqual(['m1', 'm3']);
  });

  /* `useMemo` phía sau so theo tham chiếu: trả mảng mới là dựng lại cả danh sách. */
  it('chưa chặn ai thì trả lại đúng mảng cũ', () => {
    expect(locTinNguoiDaChan(tin, new Set(), (t) => t.authorId)).toBe(tin);
  });

  it('tin không rõ người gửi thì giữ lại', () => {
    const khongRo = [{ id: 'm9', authorId: undefined as string | undefined }];
    expect(locTinNguoiDaChan(khongRo, new Set(['u2']), (t) => t.authorId)).toEqual(khongRo);
  });
});

describe('locHoiThoaiNguoiDaChan', () => {
  function hoiThoai(id: string, nguoiKia: string): DirectConversation {
    return {
      id,
      pairKey: `u1:${nguoiKia}`,
      createdAt: '',
      updatedAt: '',
      unreadCount: 0,
      participants: [
        { id: `${id}-a`, userId: 'u1', user: { id: 'u1', email: '', fullName: 'Tôi' } },
        { id: `${id}-b`, userId: nguoiKia, user: { id: nguoiKia, email: '', fullName: nguoiKia } },
      ],
    };
  }

  const ds = [hoiThoai('c1', 'u2'), hoiThoai('c2', 'u3')];

  it('giấu hội thoại với người đã chặn', () => {
    expect(locHoiThoaiNguoiDaChan(ds, new Set(['u2']), 'u1').map((h) => h.id)).toEqual(['c2']);
  });

  /* Chính mình không bao giờ nằm trong danh sách chặn, nhưng phòng dữ liệu bẩn. */
  it('không xét chính mình', () => {
    expect(locHoiThoaiNguoiDaChan(ds, new Set(['u1']), 'u1')).toHaveLength(2);
  });

  it('chưa chặn ai thì trả lại đúng mảng cũ', () => {
    expect(locHoiThoaiNguoiDaChan(ds, new Set(), 'u1')).toBe(ds);
  });
});
