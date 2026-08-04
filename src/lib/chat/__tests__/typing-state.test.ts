import { applyTyping, activeTypers, typingLabel } from '../typing-state';

const NOW = 1_000_000;

describe('applyTyping', () => {
  it('ghi dấu thời gian khi bắt đầu gõ', () => {
    const next = applyTyping({}, 'u1', true, NOW);
    expect(next.u1).toBe(NOW);
  });

  it('xoá người dùng khi ngừng gõ', () => {
    const next = applyTyping({ u1: NOW }, 'u1', false, NOW + 100);
    expect(next.u1).toBeUndefined();
  });

  it('không làm thay đổi đối tượng đầu vào', () => {
    const current = { u1: NOW };
    applyTyping(current, 'u2', true, NOW);
    expect(current).toEqual({ u1: NOW });
  });
});

describe('activeTypers', () => {
  it('trả người còn trong thời hạn', () => {
    expect(activeTypers({ u1: NOW }, NOW + 2000)).toEqual(['u1']);
  });

  it('bỏ người đã quá hạn', () => {
    expect(activeTypers({ u1: NOW }, NOW + 6000)).toEqual([]);
  });

  it('lọc đúng khi có nhiều người', () => {
    const state = { u1: NOW, u2: NOW + 4000 };
    expect(activeTypers(state, NOW + 6000)).toEqual(['u2']);
  });
});

describe('typingLabel', () => {
  it('trả chuỗi rỗng khi không ai gõ', () => {
    expect(typingLabel([])).toBe('');
  });

  it('nêu tên khi một người gõ', () => {
    expect(typingLabel(['Đại'])).toBe('Đại đang nhập…');
  });

  it('nêu hai tên khi hai người gõ', () => {
    expect(typingLabel(['Đại', 'An'])).toBe('Đại và An đang nhập…');
  });

  it('rút gọn khi nhiều hơn hai người', () => {
    expect(typingLabel(['Đại', 'An', 'Bình'])).toBe('3 người đang nhập…');
  });
});
