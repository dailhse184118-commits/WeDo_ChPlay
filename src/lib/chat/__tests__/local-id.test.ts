import { createLocalId } from '../local-id';

describe('createLocalId', () => {
  it('trả chuỗi không rỗng', () => {
    expect(createLocalId().length).toBeGreaterThan(0);
  });

  it('sinh giá trị khác nhau qua nhiều lần gọi', () => {
    const ids = new Set(Array.from({ length: 500 }, () => createLocalId()));
    expect(ids.size).toBe(500);
  });

  it('chỉ dùng ký tự an toàn cho URL và header', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(createLocalId()).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
