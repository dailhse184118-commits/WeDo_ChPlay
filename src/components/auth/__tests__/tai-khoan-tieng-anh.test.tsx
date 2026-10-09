import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ManTaiKhoan from '../../../app/(tabs)/account/index';
import ManNangCap from '../../../app/(tabs)/account/nang-cap';
import ManDongGop from '../../../app/(tabs)/account/contributions';
import ManXoaTaiKhoan from '../../../app/account/delete-account';
import ManThongTinCaNhan from '../../../app/account/profile';
import ManCaiDatThongBao from '../../../app/account/notification-settings';
import ManGopY from '../../../app/account/feedback';
import ManNguoiDaChan from '../../../app/account/blocked';
import { getDeletionBlockers } from '../../../lib/api/account';
import { getContributions } from '../../../lib/api/tasks';
import { getFeedbackStatus } from '../../../lib/api/feedback';
import { getPreferences } from '../../../lib/api/notifications';
import { listBlocks } from '../../../lib/api/moderation';
import { getEntitlements } from '../../../lib/api/entitlements';
import { ApiError } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/auth-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { chuVietConSot } from '../../../i18n/chu-viet-con-sot';
import { datNgonNguChoKiemThu } from '../../../i18n/ngon-ngu';
import { renderScreen } from '../../../test-utils/render';
import { dongGoiHienTai } from '../../../lib/payments/goi-hien-tai';
import { ghepTheGoi, loiNhanMua, ngayVN } from '../../../lib/payments/mua-goi';
import { trangThaiHanMuc } from '../../../lib/ai/han-muc';
import { doiNgaySinhSangMayChu } from '../../../lib/ngay-sinh';
import { kiemTraDanhGia } from '../../../lib/feedback/kiem-tra';

/*
  Khu vực Tài khoản và Nâng cấp ở tiếng Anh: không còn chữ tiếng Việt nào hiện ra.
  Đặt cạnh các test tiếng Việt của cùng màn vì mọi tệp dưới `src/app/(tabs)/` đều thành một tab.
*/

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), canGoBack: () => true }),
  useFocusEffect: jest.fn(),
}));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(async () => ({ type: 'opened' })) }));
jest.mock('../../../lib/auth/auth-context');
jest.mock('../../../lib/workspace/workspace-context');
jest.mock('../../../lib/images/anh-dai-dien', () => ({ chonAnhDaiDien: jest.fn() }));
jest.mock('../../../lib/api/account', () => ({
  capNhatAnhDaiDien: jest.fn(),
  capNhatThongTinCaNhan: jest.fn(),
  datDongYAI: jest.fn(),
  deleteAccount: jest.fn(),
  getDeletionBlockers: jest.fn(),
  transferWorkspaceOwner: jest.fn(),
}));
jest.mock('../../../lib/api/entitlements', () => ({ getEntitlements: jest.fn() }));
jest.mock('../../../lib/api/tasks', () => ({ getContributions: jest.fn() }));
jest.mock('../../../lib/api/feedback', () => ({ getFeedbackStatus: jest.fn(), submitFeedback: jest.fn() }));
jest.mock('../../../lib/api/notifications', () => ({ getPreferences: jest.fn(), updatePreferences: jest.fn() }));
jest.mock('../../../lib/api/moderation', () => ({ listBlocks: jest.fn(), unblockUser: jest.fn(), blockUser: jest.fn() }));
jest.mock('../../../lib/api/apple-iap', () => ({
  layAppAccountToken: jest.fn(async () => ({ appAccountToken: 'tok' })),
  guiGiaoDichApple: jest.fn(),
}));
jest.mock('../../../components/dong-gop/XuatBaoCao', () => ({ XuatBaoCao: () => null }));

const mockRequestPurchase = jest.fn();
let mockIap: { connected: boolean; subscriptions: any[]; availablePurchases: any[] };
jest.mock('expo-iap', () => ({
  useIAP: () => ({
    ...mockIap,
    fetchProducts: jest.fn(async () => undefined),
    reconnect: jest.fn(async () => true),
    requestPurchase: mockRequestPurchase,
    finishTransaction: jest.fn(async () => undefined),
    restorePurchases: jest.fn(async () => undefined),
  }),
  deepLinkToSubscriptions: jest.fn(async () => undefined),
}));

const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedWs = useWorkspace as jest.MockedFunction<typeof useWorkspace>;
const mockedEntitlements = getEntitlements as jest.MockedFunction<typeof getEntitlements>;
const mockedBlockers = getDeletionBlockers as jest.MockedFunction<typeof getDeletionBlockers>;
const mockedDongGop = getContributions as jest.MockedFunction<typeof getContributions>;
const mockedTrangThai = getFeedbackStatus as jest.MockedFunction<typeof getFeedbackStatus>;
const mockedPrefs = getPreferences as jest.MockedFunction<typeof getPreferences>;
const mockedBlocks = listBlocks as jest.MockedFunction<typeof listBlocks>;

const SAN_PHAM = [
  { id: 'pro_monthly', displayPrice: '39.000 ₫' },
  { id: 'pro_yearly', displayPrice: '390.000 ₫' },
  { id: 'team_monthly', displayPrice: '129.000 ₫' },
  { id: 'team_yearly', displayPrice: '1.290.000 ₫' },
];

let client: QueryClient;
let heDieuHanh: jest.ReplaceProperty<typeof Platform.OS> | undefined;

function dung(ui: React.ReactElement) {
  return renderScreen(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  datNgonNguChoKiemThu('en');
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  mockIap = { connected: true, subscriptions: SAN_PHAM, availablePurchases: [] };
  mockedEntitlements.mockResolvedValue({ plan: 'FREE', usage: {}, subscription: null } as never);
  mockedAuth.mockReturnValue({
    status: 'signedIn',
    user: { id: 'u1', email: 'a@b.c', fullName: 'Dai', aiConsentAt: null, dob: '1999-08-14T00:00:00.000Z', phone: '0900000000' },
    signOut: jest.fn(),
    capNhatHoSo: jest.fn(),
  } as never);
  mockedWs.mockReturnValue({
    status: 'ready',
    active: { id: 'ws-1', name: 'Team 5', ownerId: 'u1' },
    workspaces: [
      { id: 'ws-1', name: 'Team 5', ownerId: 'u1' },
      { id: 'ws-2', name: 'Class', ownerId: 'u1' },
    ],
  } as never);
});

afterEach(() => {
  heDieuHanh?.restore();
  heDieuHanh = undefined;
  client.clear();
  datNgonNguChoKiemThu('vi');
});

/* `boQua`: nhãn song ngữ cố ý của hàng đổi ngôn ngữ. */
type Nut = { type?: string; props?: Record<string, unknown>; children?: unknown[] | null };

/** Gom chữ hiển thị: nội dung chữ và các thuộc tính chữ (nhãn truy cập, gợi ý ô nhập). */
function gomChu(nut: unknown, ra: string[] = []): string[] {
  if (typeof nut === 'string') ra.push(nut);
  else if (nut && typeof nut === 'object') {
    const { props, children } = nut as Nut;
    for (const khoa of ['accessibilityLabel', 'placeholder', 'label', 'title']) {
      const v = props?.[khoa];
      if (typeof v === 'string') ra.push(v);
    }
    (children ?? []).forEach((con) => gomChu(con, ra));
  }
  return ra;
}

const conSot = (man: { toJSON: () => unknown }) => {
  const cay = man.toJSON();
  const nhieuNut = Array.isArray(cay) ? cay : [cay];
  return chuVietConSot(JSON.stringify(nhieuNut.flatMap((n) => gomChu(n))), ['Ngôn ngữ / Language']);
};

describe('tab Tài khoản ở tiếng Anh', () => {
  it('iPhone: mọi hàng menu bằng tiếng Anh, dòng gói hiện tại cũng vậy', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    mockedEntitlements.mockResolvedValue({
      plan: 'PERSONAL_PRO',
      usage: {},
      subscription: { plan: 'PERSONAL_PRO', provider: 'APPLE', currentPeriodEnd: '2026-11-08T10:00:00.000Z' },
    } as never);
    const man = await dung(<ManTaiKhoan />);

    await waitFor(() => expect(man.getByText('Personal Pro · until Nov 8, 2026 · via App Store')).toBeTruthy());
    expect(man.getByText('Upgrade plan')).toBeTruthy();
    expect(man.getByText('Contribution board')).toBeTruthy();
    expect(man.getByText('Delete account')).toBeTruthy();
    expect(man.getByText('Sign out')).toBeTruthy();
    expect(man.getByText('Blocked people')).toBeTruthy();
    expect(man.queryByText('Calendar sync')).toBeNull();
    expect(conSot(man)).toEqual([]);
  });

  it('Android: có hàng Calendar sync, không có Upgrade plan', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
    const man = await dung(<ManTaiKhoan />);

    expect(man.getByText('Calendar sync')).toBeTruthy();
    expect(man.queryByText('Upgrade plan')).toBeNull();
    expect(conSot(man)).toEqual([]);
  });
});

describe('màn Nâng cấp ở tiếng Anh', () => {
  async function moSanSang() {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    const man = await dung(<ManNangCap />);
    await waitFor(() =>
      expect(man.getByTestId('mua-pro_monthly').props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: false }),
      ),
    );
    return man;
  }

  it('thẻ gói, giá theo kỳ, nút và đoạn pháp lý tự gia hạn đều bằng tiếng Anh', async () => {
    const man = await moSanSang();

    expect(man.getByText('Personal Pro')).toBeTruthy();
    expect(man.getByText('Team Growth')).toBeTruthy();
    expect(man.getByText('• 300 AI task suggestions per month')).toBeTruthy();
    expect(man.getByText('39.000 ₫ / month')).toBeTruthy();
    expect(man.getByText('390.000 ₫ / year')).toBeTruthy();
    expect(man.getByText('Restore purchases')).toBeTruthy();
    expect(man.getByText('Manage subscription')).toBeTruthy();
    expect(man.getByText('Terms of Use')).toBeTruthy();
    expect(man.getByText('Privacy Policy')).toBeTruthy();
    expect(man.getByText('Buy Team Growth for workspace')).toBeTruthy();

    // Đoạn pháp lý: tự gia hạn, tính vào Apple ID, huỷ trước 24 giờ, đường quản lý.
    const phapLy = man.getByText(/renews automatically/);
    const chu = String(phapLy.props.children);
    expect(chu).toMatch(/charged to your Apple ID/);
    expect(chu).toMatch(/unless you cancel at least 24 hours before the end of the current period/);
    expect(chu).toContain('Settings > [your name] > Subscriptions');
    expect(conSot(man)).toEqual([]);
  });

  it('lỗi mua gói hiện bằng tiếng Anh khi là mã nghiệp vụ', async () => {
    mockRequestPurchase.mockRejectedValueOnce({ code: 'WORKSPACE_OWNER_REQUIRED' });
    const man = await moSanSang();

    await fireEvent.press(man.getByTestId('mua-team_monthly'));
    await waitFor(() =>
      expect(
        man.getByText(
          'Only the workspace owner can buy the Team plan. Choose a workspace you own above, then tap Restore purchases.',
        ),
      ).toBeTruthy(),
    );
    expect(conSot(man)).toEqual([]);
  });

  it('đang có gói mua trên web: banner chặn bằng tiếng Anh, ngày viết kiểu Mỹ', async () => {
    mockedEntitlements.mockResolvedValue({
      plan: 'PERSONAL_PRO',
      usage: {},
      subscription: { plan: 'PERSONAL_PRO', provider: 'PAYOS', currentPeriodEnd: '2099-11-08T10:00:00.000Z' },
    } as never);
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    const man = await dung(<ManNangCap />);

    await waitFor(() => expect(man.getByTestId('chan-goi-web')).toBeTruthy());
    expect(
      man.getByText('Your current web plan runs until Nov 8, 2099. You can buy on iPhone after that date.'),
    ).toBeTruthy();
    expect(conSot(man)).toEqual([]);
  });
});

describe('màn Xoá tài khoản ở tiếng Anh', () => {
  it('danh sách, chủ workspace cần chuyển quyền và ô xác nhận DELETE đều bằng tiếng Anh', async () => {
    mockedBlockers.mockResolvedValue({
      canDelete: true,
      blockers: [
        {
          workspaceId: 'w1',
          workspaceName: 'Team 5',
          otherMemberCount: 1,
          projectCount: 2,
          taskCount: 1,
          candidates: [{ id: 'c1', fullName: 'Sam', email: 'sam@x.y' }],
        },
      ],
    } as never);
    const man = await dung(<ManXoaTaiKhoan />);

    await waitFor(() => expect(man.getByTestId('delete-account')).toBeTruthy());
    expect(man.getByText('Deleting your account permanently removes')).toBeTruthy();
    expect(man.getByText('Messages you sent in every project chat')).toBeTruthy();
    expect(man.getByText(/1 other member\. It holds 2 projects and 1 task/)).toBeTruthy();
    expect(man.getByText('Type DELETE in the box below to turn on the delete button.')).toBeTruthy();
    expect(man.getByTestId('delete-account').props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
    await fireEvent.changeText(man.getByTestId('delete-confirm'), 'delete');
    expect(man.getByTestId('delete-account').props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: false }),
    );
    expect(conSot(man)).toEqual([]);
  });

  it('tải thông tin hỏng: câu báo và nút Try again bằng tiếng Anh', async () => {
    mockedBlockers.mockRejectedValue(new Error('mạng'));
    const man = await dung(<ManXoaTaiKhoan />);

    await waitFor(() => expect(man.getByText('Couldn’t load your account info.')).toBeTruthy());
    expect(man.getByText('Try again')).toBeTruthy();
    expect(conSot(man)).toEqual([]);
  });
});

describe('các màn con của Tài khoản ở tiếng Anh', () => {
  it('Personal info: nhãn, gợi ý và lỗi ngày sinh', async () => {
    const man = await dung(<ManThongTinCaNhan />);

    expect(man.getByText('Sign-in email')).toBeTruthy();
    expect(man.getByText('Date of birth (dd/mm/yyyy)')).toBeTruthy();
    await fireEvent.changeText(man.getByTestId('profile-dob'), '31/02/2025');
    await fireEvent.press(man.getByTestId('profile-save'));
    expect(man.getByText('That date doesn’t exist on the calendar.')).toBeTruthy();
    expect(conSot(man)).toEqual([]);
  });

  it('Notification settings', async () => {
    mockedPrefs.mockResolvedValue({
      notifyTaskAssignment: true,
      notifyTaskReview: true,
      notifyDeadlineReminder: true,
      notifyMeeting: true,
    } as never);
    const man = await dung(<ManCaiDatThongBao />);

    await waitFor(() => expect(man.getByText('Task assignments')).toBeTruthy());
    expect(man.getByText('A reminder 24 hours before and at the deadline')).toBeTruthy();
    expect(conSot(man)).toEqual([]);
  });

  it('Feedback: nhãn sao, đếm ký tự và lỗi kiểm tra', async () => {
    mockedTrangThai.mockResolvedValue({ feedback: null, canSubmit: true, locked: false } as never);
    const man = await dung(<ManGopY />);

    await waitFor(() => expect(man.getByText('Tap to choose a rating')).toBeTruthy());
    await fireEvent.press(man.getByTestId('sao-4'));
    expect(man.getByText('Good')).toBeTruthy();
    await fireEvent.changeText(man.getByTestId('o-noi-dung'), 'short');
    expect(man.getByText('1,495 characters left')).toBeTruthy();
    await fireEvent.press(man.getByTestId('nut-gui-gop-y'));
    expect(man.getByText('Write 5 more characters so we can understand what you mean.')).toBeTruthy();
    expect(conSot(man)).toEqual([]);
  });

  it('Blocked people: danh sách rỗng', async () => {
    mockedBlocks.mockResolvedValue([]);
    const man = await dung(<ManNguoiDaChan />);

    await waitFor(() => expect(man.getByText('You haven’t blocked anyone.')).toBeTruthy());
    expect(conSot(man)).toEqual([]);
  });

  it('Blocked people: có người bị chặn', async () => {
    mockedBlocks.mockResolvedValue([
      { userId: 'x1', fullName: 'Sam', avatarUrl: null, blockedAt: '2026-10-01T00:00:00.000Z' },
    ] as never);
    const man = await dung(<ManNguoiDaChan />);

    await waitFor(() => expect(man.getByText('Unblock')).toBeTruthy());
    expect(man.getByLabelText('Unblock Sam')).toBeTruthy();
    expect(conSot(man)).toEqual([]);
  });

  it('Contribution board', async () => {
    mockedDongGop.mockResolvedValue({
      thanhVien: [
        {
          userId: 'a',
          user: { fullName: 'Sam', email: 's@x.y' },
          hoanThanh: 3,
          chuaXong: 1,
          treHan: 0,
          daNop: 2,
          biTraLai: 1,
          tyLeDungHanPhanTram: 80,
        },
      ],
    } as never);
    const man = await dung(<ManDongGop />);

    await waitFor(() => expect(man.getByText('80% on time')).toBeTruthy());
    expect(man.getByText('Completed')).toBeTruthy();
    expect(man.getByText('1 task was returned for changes')).toBeTruthy();
    expect(conSot(man)).toEqual([]);
  });
});

describe('hàm thuần ở tiếng Anh', () => {
  it('lỗi mua gói, ngày và gói hiện tại', () => {
    expect(loiNhanMua({ code: 'user-cancelled' })).toBe('');
    expect(loiNhanMua({ code: 'APPLE_IAP_DISABLED' })).toBe(
      'Paying through the App Store isn’t available right now. Please try again later.',
    );
    expect(loiNhanMua({ code: 'SUBSCRIPTION_CONFLICT' })).toBe('You already have another plan that’s still active.');
    expect(loiNhanMua(new ApiError('x', 500))).toBe('We couldn’t complete the purchase. Please try again later.');
    expect(ngayVN('2026-11-08T10:00:00.000Z')).toBe('Nov 8, 2026');
    expect(dongGoiHienTai(null)).toBe('Free');
    expect(
      dongGoiHienTai({ plan: 'TEAM_GROWTH', provider: 'PAYOS', currentPeriodEnd: '2026-11-08T10:00:00.000Z' } as never),
    ).toBe('Team Growth · until Nov 8, 2026 · via web');
    expect(ghepTheGoi(SAN_PHAM)[1].quyenLoi[1]).toBe('Up to 4 members, 3 workspaces');
  });

  it('hạn mức AI, ngày sinh, đánh giá', () => {
    const han = { limit: 10, used: 10, remaining: 0, periodEnd: '2026-12-31T00:00:00.000Z' } as never;
    expect(trangThaiHanMuc(han).loiNhan).toBe(
      'You’ve used all 10 AI credits for this month. Your credits refill on Dec 31. You can still create tasks manually with the plus button.',
    );
    expect(trangThaiHanMuc({ ...(han as object), remaining: 1 } as never).loiNhan).toBe('1 AI credit left this month.');
    expect(doiNgaySinhSangMayChu('abc').loi).toBe('Enter your date of birth as dd/mm/yyyy.');
    expect(kiemTraDanhGia(0, '')).toBe('Choose a star rating first.');
  });
});
