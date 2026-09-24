import {
  keysToInvalidate,
  khoaChuaDocDuAn,
  projectRoomsToJoin,
  MAX_JOINED_PROJECTS,
} from '../sync-rules';

describe('keysToInvalidate', () => {
  it('thông báo mới làm hỏng cả danh sách lẫn số chưa đọc', () => {
    expect(keysToInvalidate('notification:new')).toEqual([
      ['notifications'],
      ['notifications-unread'],
    ]);
  });

  it('công việc đổi làm hỏng cả danh sách lẫn chi tiết', () => {
    expect(keysToInvalidate('task:project:updated')).toEqual([['tasks'], ['task']]);
  });

  it('tin nhắn riêng mới làm hỏng cả danh sách hội thoại lẫn luồng đang mở', () => {
    expect(keysToInvalidate('message:direct')).toEqual([
      ['direct-conversations'],
      ['direct-messages'],
    ]);
  });

  it('tin nhắn riêng bị sửa chỉ làm hỏng luồng', () => {
    expect(keysToInvalidate('message:direct:updated')).toEqual([['direct-messages']]);
  });

  it('đã đọc làm hỏng danh sách hội thoại để huy hiệu tắt đi', () => {
    expect(keysToInvalidate('read:direct')).toEqual([['direct-conversations']]);
  });
});

describe('projectRoomsToJoin', () => {
  it('trả về id của mọi dự án', () => {
    expect(projectRoomsToJoin([{ id: 'p1' }, { id: 'p2' }])).toEqual(['p1', 'p2']);
  });

  it('bỏ id trùng', () => {
    expect(projectRoomsToJoin([{ id: 'p1' }, { id: 'p1' }, { id: 'p2' }])).toEqual(['p1', 'p2']);
  });

  it('bỏ qua phần tử thiếu id', () => {
    const messy = [{ id: 'p1' }, {} as { id: string }, { id: '' }, { id: 'p2' }];
    expect(projectRoomsToJoin(messy)).toEqual(['p1', 'p2']);
  });

  it('chặn ở giới hạn để không dội truy vấn kiểm tra quyền', () => {
    const many = Array.from({ length: 100 }, (_, i) => ({ id: `p${i}` }));
    expect(projectRoomsToJoin(many)).toHaveLength(MAX_JOINED_PROJECTS);
  });

  it('nhận giới hạn riêng', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ id: `p${i}` }));
    expect(projectRoomsToJoin(many, 3)).toEqual(['p0', 'p1', 'p2']);
  });

  it('danh sách rỗng thì không vào phòng nào', () => {
    expect(projectRoomsToJoin([])).toEqual([]);
  });
});

/*
  Huy hiệu chưa đọc ở danh sách dự án trước đây không bao giờ được làm mới khi
  có tin — chỉ đổi khi app vào nền rồi mở lại. Người thử nghiệm 23/09/2026: tin
  mới tới mà huy hiệu đứng yên, đọc xong rồi huy hiệu vẫn còn.
*/
describe('khoaChuaDocDuAn', () => {
  it('tin người khác gửi làm hỏng số chưa đọc của ĐÚNG dự án đó', () => {
    expect(khoaChuaDocDuAn({ projectId: 'p1', authorId: 'u2' }, 'u1')).toEqual([
      'chat-unread',
      'p1',
    ]);
  });

  /* Tin mình gửi không bao giờ là "chưa đọc" với chính mình — gọi lại là thừa. */
  it('tin của chính mình thì bỏ qua', () => {
    expect(khoaChuaDocDuAn({ projectId: 'p1', authorId: 'u1' }, 'u1')).toBeNull();
  });

  it('bỏ qua gói tin thiếu dự án thay vì làm hỏng mọi huy hiệu', () => {
    expect(khoaChuaDocDuAn({ authorId: 'u2' }, 'u1')).toBeNull();
    expect(khoaChuaDocDuAn(null, 'u1')).toBeNull();
  });
});
