import { mergeMessages, applyRecall } from '../message-list';
import type { ChatMessage } from '../../types';

function makeMessage(id: string, minute: number, content = 'noi dung'): ChatMessage {
  return {
    id,
    content,
    workspaceId: 'w1',
    projectId: 'p1',
    authorId: 'u1',
    createdAt: `2026-08-04T00:${String(minute).padStart(2, '0')}:00.000Z`,
    updatedAt: `2026-08-04T00:${String(minute).padStart(2, '0')}:00.000Z`,
  };
}

describe('mergeMessages', () => {
  it('trả danh sách rỗng khi cả hai nguồn rỗng', () => {
    expect(mergeMessages([], [])).toEqual([]);
  });

  it('sắp xếp tăng dần theo thời gian tạo', () => {
    const merged = mergeMessages([makeMessage('b', 5)], [makeMessage('a', 1)]);
    expect(merged.map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('khử trùng theo id, bản đến sau thắng', () => {
    const cu = makeMessage('a', 1, 'ban cu');
    const moi = makeMessage('a', 1, 'ban moi');
    const merged = mergeMessages([cu], [moi]);
    expect(merged).toHaveLength(1);
    expect(merged[0].content).toBe('ban moi');
  });

  it('không làm thay đổi mảng đầu vào', () => {
    const existing = [makeMessage('a', 1)];
    const snapshot = [...existing];
    mergeMessages(existing, [makeMessage('b', 2)]);
    expect(existing).toEqual(snapshot);
  });

  it('gộp được nhiều tin cùng lúc', () => {
    const merged = mergeMessages(
      [makeMessage('a', 1), makeMessage('c', 3)],
      [makeMessage('b', 2), makeMessage('d', 4)],
    );
    expect(merged.map((m) => m.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('applyRecall', () => {
  it('thay tin nhắn bị thu hồi bằng bản mới', () => {
    const list = [makeMessage('a', 1), makeMessage('b', 2)];
    const recalled: ChatMessage = {
      ...makeMessage('b', 2),
      deletedAt: '2026-08-04T01:00:00.000Z',
    };

    const next = applyRecall(list, recalled);

    expect(next).toHaveLength(2);
    expect(next[1].deletedAt).toBe('2026-08-04T01:00:00.000Z');
  });

  it('bỏ qua khi không tìm thấy tin nhắn', () => {
    const list = [makeMessage('a', 1)];
    expect(applyRecall(list, makeMessage('khong-ton-tai', 9))).toEqual(list);
  });
});
