import { pickActiveWorkspace } from '../active-workspace';
import type { Workspace } from '../../types';

function makeWorkspace(id: string): Workspace {
  return {
    id,
    name: `Không gian ${id}`,
    ownerId: 'u1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('pickActiveWorkspace', () => {
  it('trả null khi chưa có workspace nào', () => {
    expect(pickActiveWorkspace([], null)).toBeNull();
  });

  it('lấy workspace đầu tiên khi chưa lưu lựa chọn', () => {
    const list = [makeWorkspace('a'), makeWorkspace('b')];
    expect(pickActiveWorkspace(list, null)?.id).toBe('a');
  });

  it('ưu tiên workspace đã lưu', () => {
    const list = [makeWorkspace('a'), makeWorkspace('b')];
    expect(pickActiveWorkspace(list, 'b')?.id).toBe('b');
  });

  it('quay về workspace đầu tiên khi cái đã lưu không còn tồn tại', () => {
    const list = [makeWorkspace('a'), makeWorkspace('b')];
    expect(pickActiveWorkspace(list, 'da-bi-xoa')?.id).toBe('a');
  });
});
