import { buildTokens } from '../build-tokens';
import { GIOI_HAN_CO_CHU } from '../responsive';

const MAY_NHO = buildTokens(360, 1);
const MAY_THUONG = buildTokens(411, 1);
const TABLET = buildTokens(800, 1);
const CHU_TO = buildTokens(411, 2);

describe('co giãn theo bề rộng máy', () => {
  it('thu khoảng cách lại trên máy nhỏ', () => {
    expect(MAY_NHO.spacing.lg).toBeLessThan(MAY_THUONG.spacing.lg);
  });

  it('nới khoảng cách ra trên tablet', () => {
    expect(TABLET.spacing.lg).toBeGreaterThan(MAY_THUONG.spacing.lg);
  });

  it('thu cỡ chữ lại trên máy nhỏ', () => {
    expect(MAY_NHO.fontSize.md).toBeLessThan(MAY_THUONG.fontSize.md);
  });

  it('thu avatar lại trên máy nhỏ', () => {
    expect(MAY_NHO.sizes.profileAvatar).toBeLessThan(MAY_THUONG.sizes.profileAvatar);
  });
});

describe('co giãn theo cỡ chữ hệ thống', () => {
  it('nới chiều cao ô nhập và nút ra, vì chữ bên trong to lên', () => {
    expect(CHU_TO.sizes.control).toBeGreaterThan(MAY_THUONG.sizes.control);
  });

  it('giữ nguyên avatar và ô icon, vì chúng không chứa chữ chạy dài', () => {
    expect(CHU_TO.sizes.profileAvatar).toBe(MAY_THUONG.sizes.profileAvatar);
    expect(CHU_TO.sizes.projectAvatar).toBe(MAY_THUONG.sizes.projectAvatar);
    expect(CHU_TO.sizes.iconTile).toBe(MAY_THUONG.sizes.iconTile);
    expect(CHU_TO.sizes.icon).toBe(MAY_THUONG.sizes.icon);
  });

  it('KHÔNG phóng cỡ chữ theo cỡ chữ hệ thống, React Native đã tự làm rồi', () => {
    // Nhân hai lần là phóng bình phương: mức 200% của Android thành 400%.
    expect(CHU_TO.fontSize.md).toBe(MAY_THUONG.fontSize.md);
  });

  it('nới chiều cao dòng ra, vì React Native không tự phóng lineHeight', () => {
    expect(CHU_TO.lineHeight.md).toBeGreaterThan(MAY_THUONG.lineHeight.md);
  });

  it('dừng nới chiều cao ô nhập ở ngưỡng chặn, để nút không cao bằng nửa màn hình', () => {
    expect(buildTokens(411, 3).sizes.control).toBe(buildTokens(411, 1.3).sizes.control);
  });

  it('nới thanh tab ra, vì nhãn dưới icon là thứ bị cắt trước nhất', () => {
    expect(CHU_TO.sizes.tabBar).toBeGreaterThan(MAY_THUONG.sizes.tabBar);
  });

  it('dừng nới thanh tab ở ngưỡng chặn, để nó không ăn hết màn hình', () => {
    expect(buildTokens(411, 3).sizes.tabBar).toBe(buildTokens(411, 1.3).sizes.tabBar);
  });

  it('nới badge theo cỡ chữ THẬT, không dừng ở ngưỡng chặn như thanh tab', () => {
    /*
      Badge của react-navigation là một `<Text>` có `overflow: hidden`, chiều cao
      cố định 18dp. Không có đường nào chặn cỡ chữ của nó bằng style, nên hộp
      phải lớn theo hết mức người dùng phóng, nếu không chữ số bị xén.
    */
    expect(buildTokens(411, 2).sizes.badge).toBeGreaterThan(
      buildTokens(411, GIOI_HAN_CO_CHU).sizes.badge,
    );
  });

  it('giữ badge đủ lớn chứa chữ số ở mọi kích cỡ', () => {
    for (const [width, coChu] of [
      [360, 1],
      [411, 1],
      [800, 1],
      [411, 2],
      [320, 2],
    ] as const) {
      const token = buildTokens(width, coChu);
      // Chữ dựng ra cao `fontSize.xxs * coChu`, cộng chút đệm hai bên.
      expect(token.sizes.badge).toBeGreaterThanOrEqual(token.fontSize.xxs * coChu + 4);
    }
  });

  it('giữ thanh tab đủ cao cho icon cộng nhãn ở mọi kích cỡ', () => {
    for (const token of [MAY_NHO, MAY_THUONG, TABLET, CHU_TO, buildTokens(320, 2)]) {
      expect(token.sizes.tabBar).toBeGreaterThan(token.sizes.icon + token.lineHeight.xxs);
    }
  });
});

describe('hai hàm co giãn cho kích cỡ lẻ', () => {
  it('scale thu số đo hình học theo bề rộng máy', () => {
    expect(MAY_NHO.scale(64)).toBeLessThan(MAY_THUONG.scale(64));
    expect(TABLET.scale(64)).toBeGreaterThan(MAY_THUONG.scale(64));
  });

  it('scale bỏ qua cỡ chữ, vì hình vuông không chứa chữ chạy dài', () => {
    expect(CHU_TO.scale(64)).toBe(MAY_THUONG.scale(64));
  });

  it('scaleWithFont nới hộp chứa chữ ra theo cỡ chữ', () => {
    expect(CHU_TO.scaleWithFont(40)).toBeGreaterThan(MAY_THUONG.scaleWithFont(40));
  });

  it('cả hai trả về số nguyên', () => {
    expect(Number.isInteger(MAY_NHO.scale(37))).toBe(true);
    expect(Number.isInteger(CHU_TO.scaleWithFont(37))).toBe(true);
  });
});

describe('thang bậc giữ đúng thứ tự ở mọi kích cỡ', () => {
  const truongHop = {
    'máy nhỏ': MAY_NHO,
    'máy thường': MAY_THUONG,
    tablet: TABLET,
    'cỡ chữ lớn nhất': CHU_TO,
    'máy nhỏ nhất kèm cỡ chữ lớn nhất': buildTokens(320, 2),
  };

  for (const [ten, token] of Object.entries(truongHop)) {
    describe(ten, () => {
      it('khoảng cách tăng dần', () => {
        const { spacing } = token;
        expect(spacing.xxs).toBeLessThan(spacing.xs);
        expect(spacing.xs).toBeLessThan(spacing.sm);
        expect(spacing.sm).toBeLessThan(spacing.md);
        expect(spacing.md).toBeLessThan(spacing.lg);
        expect(spacing.lg).toBeLessThan(spacing.xl);
      });

      it('cỡ chữ tăng dần', () => {
        const { fontSize } = token;
        expect(fontSize.xxs).toBeLessThan(fontSize.xs);
        expect(fontSize.xs).toBeLessThan(fontSize.sm);
        expect(fontSize.sm).toBeLessThan(fontSize.md);
        expect(fontSize.md).toBeLessThan(fontSize.lg);
        expect(fontSize.lg).toBeLessThan(fontSize.xl);
      });

      it('chiều cao dòng luôn cao hơn cỡ chữ tương ứng', () => {
        for (const bac of ['xxs', 'xs', 'sm', 'md', 'lg', 'xl'] as const) {
          expect(token.lineHeight[bac]).toBeGreaterThan(token.fontSize[bac]);
        }
      });

      it('mọi giá trị là số nguyên dương', () => {
        for (const nhom of [token.spacing, token.fontSize, token.lineHeight, token.sizes]) {
          for (const [khoa, giaTri] of Object.entries(nhom)) {
            expect(`${khoa}=${giaTri}`).toBe(`${khoa}=${Math.round(giaTri)}`);
            expect(giaTri).toBeGreaterThan(0);
          }
        }
      });
    });
  }
});
