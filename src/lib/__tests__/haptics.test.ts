import * as Haptics from 'expo-haptics';
import { tapFeedback } from '../haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

const mockedImpact = Haptics.impactAsync as jest.MockedFunction<typeof Haptics.impactAsync>;

describe('tapFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gọi rung khi thiết bị hỗ trợ', async () => {
    mockedImpact.mockResolvedValue(undefined);
    await tapFeedback();
    expect(mockedImpact).toHaveBeenCalledWith('medium');
  });

  it('nuốt lỗi khi thiếu module native', async () => {
    mockedImpact.mockRejectedValue(
      new Error('The method or property Haptic.impactAsync is not available on android'),
    );
    await expect(tapFeedback()).resolves.toBeUndefined();
  });

  it('nuốt lỗi khi thiết bị không có mô-tơ rung', async () => {
    mockedImpact.mockRejectedValue(new Error('Vibrator unavailable'));
    await expect(tapFeedback()).resolves.toBeUndefined();
  });
});
