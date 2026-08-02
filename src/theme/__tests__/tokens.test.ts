import { colors, spacing } from '../tokens';

describe('design tokens', () => {
  it('dùng đúng màu thương hiệu WeDo', () => {
    expect(colors.primary).toBe('#0055c7');
  });

  it('có thang khoảng cách tăng dần', () => {
    expect(spacing.sm).toBeLessThan(spacing.md);
    expect(spacing.md).toBeLessThan(spacing.lg);
  });
});
