import { keysToInvalidate, projectRoomsToJoin, MAX_JOINED_PROJECTS } from '../sync-rules';

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
