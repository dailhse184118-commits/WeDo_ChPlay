import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { deepLinkToSubscriptions } from 'expo-iap';
import ManNangCap from '../../../app/(tabs)/account/nang-cap';
import { ApiError } from '../../../lib/api/client';
import { guiGiaoDichApple, layAppAccountToken } from '../../../lib/api/apple-iap';
import { getEntitlements } from '../../../lib/api/entitlements';
import { useAuth } from '../../../lib/auth/auth-context';
import { PRIVACY_URL, TERMS_URL } from '../../../lib/legal-links';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { renderScreen } from '../../../test-utils/render';

let mockFocusCb: (() => void) | undefined;
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), navigate: jest.fn() }),
  useFocusEffect: (cb: () => void) => {
    mockFocusCb = cb;
  },
}));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(async () => ({ type: 'opened' })) }));
jest.mock('../../../lib/auth/auth-context');
jest.mock('../../../lib/workspace/workspace-context');
jest.mock('../../../lib/api/apple-iap', () => ({
  layAppAccountToken: jest.fn(async () => ({ appAccountToken: 'tok' })),
  guiGiaoDichApple: jest.fn(),
}));
jest.mock('../../../lib/api/entitlements', () => ({ getEntitlements: jest.fn() }));

const SAN_PHAM = [
  { id: 'pro_monthly', displayPrice: '39.000 ₫' },
  { id: 'pro_yearly', displayPrice: '390.000 ₫' },
  { id: 'team_monthly', displayPrice: '129.000 ₫' },
  { id: 'team_yearly', displayPrice: '1.290.000 ₫' },
];

/* Hàm của hook giữ nguyên danh tính giữa các lần render, như `useIAP` thật. */
const mockFinishTransaction = jest.fn(async () => undefined);
const mockRequestPurchase = jest.fn(async () => undefined);
const mockFetchProducts = jest.fn(async () => undefined);
const mockReconnect = jest.fn(async () => true);
const mockRestorePurchases = jest.fn(async () => undefined);
let mockOnPurchaseSuccess: ((p: any) => void) | undefined;
let mockIap: { connected: boolean; subscriptions: any[]; availablePurchases: any[] };
jest.mock('expo-iap', () => ({
  useIAP: (opts: any) => {
    mockOnPurchaseSuccess = opts?.onPurchaseSuccess;
    return {
      ...mockIap,
      fetchProducts: mockFetchProducts,
      reconnect: mockReconnect,
      requestPurchase: mockRequestPurchase,
      finishTransaction: mockFinishTransaction,
      restorePurchases: mockRestorePurchases,
    };
  },
  deepLinkToSubscriptions: jest.fn(async () => undefined),
}));

function renderManHinh() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderScreen(
    <QueryClientProvider client={queryClient}>
      <ManNangCap />
    </QueryClientProvider>,
  );
}

/* Đợi giá về và gói hiện tại tải xong (nút mua mới mở khoá). */
async function renderSanSang() {
  const man = await renderManHinh();
  await waitFor(() =>
    expect(man.getByTestId('mua-pro_monthly').props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: false }),
    ),
  );
  return man;
}

const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedWs = useWorkspace as jest.MockedFunction<typeof useWorkspace>;
const mockedGui = guiGiaoDichApple as jest.MockedFunction<typeof guiGiaoDichApple>;
const mockedEntitlements = getEntitlements as jest.MockedFunction<typeof getEntitlements>;
const giaoDich = (productId: string, id = 'tx') => ({ id, productId, purchaseToken: 'JWS', transactionDate: 1 });

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockIap = { connected: true, subscriptions: SAN_PHAM, availablePurchases: [] };
  mockedEntitlements.mockResolvedValue({ plan: 'FREE', usage: {}, subscription: null } as any);
  mockedAuth.mockReturnValue({ status: 'signedIn', user: { id: 'u1', email: 'a@b.c', fullName: 'Đại' } } as any);
  mockedWs.mockReturnValue({
    status: 'ready',
    active: { id: 'ws-1', name: 'Nhóm 5', ownerId: 'u1' },
    workspaces: [{ id: 'ws-1', name: 'Nhóm 5', ownerId: 'u1' }, { id: 'ws-2', name: 'Lớp', ownerId: 'u2' }],
    refresh: jest.fn(), create: jest.fn(), switchTo: jest.fn(),
  } as any);
});

it('hiện hai thẻ với giá từ StoreKit', async () => {
  const { findByText } = await renderManHinh();
  expect(await findByText(/39\.000 ₫/)).toBeTruthy();
  expect(await findByText(/1\.290\.000 ₫/)).toBeTruthy();
  expect(mockFetchProducts).toHaveBeenCalledWith({ skus: ['pro_monthly', 'pro_yearly', 'team_monthly', 'team_yearly'], type: 'subs' });
});

it('mua Pro tháng: gọi requestPurchase với sku và appAccountToken', async () => {
  const { getByTestId } = await renderSanSang();
  await fireEvent.press(getByTestId('mua-pro_monthly'));
  await waitFor(() => expect(layAppAccountToken).toHaveBeenCalled());
  await waitFor(() =>
    expect(mockRequestPurchase).toHaveBeenCalledWith({ type: 'subs', request: { apple: { sku: 'pro_monthly', appAccountToken: 'tok' } } }),
  );
});

it('giao dịch về: gửi máy chủ, máy chủ xong rồi mới finishTransaction', async () => {
  let traLoi: (v: any) => void = () => undefined;
  mockedGui.mockImplementation(() => new Promise((r) => { traLoi = r; }));
  await renderSanSang();
  await act(async () => mockOnPurchaseSuccess?.(giaoDich('pro_monthly')));
  await waitFor(() => expect(mockedGui).toHaveBeenCalledWith({ jws: 'JWS', workspaceId: undefined }));
  // Máy chủ chưa trả lời: chưa được finish.
  expect(mockFinishTransaction).not.toHaveBeenCalled();
  await act(async () => traLoi({ transactionId: 'tx', subscription: null }));
  await waitFor(() => expect(mockFinishTransaction).toHaveBeenCalled());
  expect(mockedGui.mock.invocationCallOrder[0]).toBeLessThan(mockFinishTransaction.mock.invocationCallOrder[0]);
});

it('máy chủ hỏng: KHÔNG finishTransaction, bảo mở lại màn Nâng cấp', async () => {
  mockedGui.mockRejectedValue(new Error('500'));
  const { findByText } = await renderSanSang();
  await act(async () => mockOnPurchaseSuccess?.(giaoDich('pro_monthly')));
  expect(await findByText(/Mở lại màn Nâng cấp nếu chưa thấy gói/)).toBeTruthy();
  expect(mockFinishTransaction).not.toHaveBeenCalled();
});

describe('đang có gói payOS còn hạn', () => {
  it('khoá mọi nút mua và báo ngày hết gói web', async () => {
    mockedEntitlements.mockResolvedValue({
      plan: 'PERSONAL_PRO',
      usage: {},
      subscription: { provider: 'PAYOS', plan: 'PERSONAL_PRO', billingCycle: 'MONTHLY', currentPeriodEnd: '2099-11-08T10:00:00.000Z' },
    } as any);
    const man = await renderManHinh();
    expect(await man.findByText(/mua trên web còn đến 08\/11\/2099/)).toBeTruthy();
    expect(mockedEntitlements).toHaveBeenCalledWith('ws-1');
    for (const sku of ['pro_monthly', 'pro_yearly', 'team_monthly', 'team_yearly']) {
      expect(man.getByTestId(`mua-${sku}`).props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
    }
    await fireEvent.press(man.getByTestId('mua-pro_monthly'));
    expect(layAppAccountToken).not.toHaveBeenCalled();
    expect(mockRequestPurchase).not.toHaveBeenCalled();
  });

  it('gói payOS đã hết hạn thì mua được', async () => {
    mockedEntitlements.mockResolvedValue({
      plan: 'FREE',
      usage: {},
      subscription: { provider: 'PAYOS', plan: 'PERSONAL_PRO', billingCycle: 'MONTHLY', currentPeriodEnd: '2000-01-01T00:00:00.000Z' },
    } as any);
    const man = await renderSanSang();
    expect(man.queryByTestId('chan-goi-web')).toBeNull();
  });
});

it('có link Điều khoản và Chính sách riêng tư mở trang pháp lý', async () => {
  const man = await renderSanSang();
  await fireEvent.press(man.getByTestId('nang-cap-dieu-khoan'));
  await fireEvent.press(man.getByTestId('nang-cap-rieng-tu'));
  expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(TERMS_URL);
  expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(PRIVACY_URL);
  expect(man.getByText(/Tiền được trừ vào Apple ID khi xác nhận mua/)).toBeTruthy();
  expect(man.getByText(/Cài đặt → \[tên bạn\] → Đăng ký/)).toBeTruthy();
});

describe('lấy giá từ App Store', () => {
  it('chưa kết nối: hiện đang lấy giá', async () => {
    mockIap = { connected: false, subscriptions: [], availablePurchases: [] };
    const man = await renderManHinh();
    expect(man.getByText('Đang lấy giá từ App Store…')).toBeTruthy();
    expect(man.queryByTestId('mua-pro_monthly')).toBeNull();
  });

  it('lấy giá hỏng: báo lỗi, bấm Thử lại thì lấy lại', async () => {
    mockIap = { connected: true, subscriptions: [], availablePurchases: [] };
    mockFetchProducts.mockRejectedValueOnce(new Error('E_SERVICE_ERROR'));
    const man = await renderManHinh();
    expect(await man.findByText('Chưa lấy được gói từ App Store.')).toBeTruthy();
    await fireEvent.press(man.getByTestId('thu-lai-gia'));
    await waitFor(() => expect(mockFetchProducts).toHaveBeenCalledTimes(2));
    expect(mockReconnect).not.toHaveBeenCalled();
  });

  it('lấy về rỗng (sản phẩm chưa duyệt): cũng báo lỗi', async () => {
    mockIap = { connected: true, subscriptions: [], availablePurchases: [] };
    const man = await renderManHinh();
    expect(await man.findByTestId('loi-gia')).toBeTruthy();
  });

  it('chưa kết nối mà bấm Thử lại: kết nối lại trước', async () => {
    jest.useFakeTimers();
    try {
      mockIap = { connected: false, subscriptions: [], availablePurchases: [] };
      const man = await renderManHinh();
      await act(async () => {
        jest.advanceTimersByTime(15_000);
      });
      expect(man.getByText('Chưa lấy được gói từ App Store.')).toBeTruthy();
      await fireEvent.press(man.getByTestId('thu-lai-gia'));
      expect(mockReconnect).toHaveBeenCalled();
      expect(mockFetchProducts).toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});

const haiWorkspace = {
  status: 'ready',
  active: { id: 'ws-1', name: 'Nhóm 5', ownerId: 'u1' },
  workspaces: [
    { id: 'ws-1', name: 'Nhóm 5', ownerId: 'u1' },
    { id: 'ws-3', name: 'Đồ án', ownerId: 'u1' },
    { id: 'ws-2', name: 'Lớp', ownerId: 'u2' },
  ],
  refresh: jest.fn(), create: jest.fn(), switchTo: jest.fn(),
} as any;

it('Team: gửi workspaceId của workspace mình làm chủ đã chọn', async () => {
  mockedWs.mockReturnValue(haiWorkspace);
  mockedGui.mockResolvedValue({ transactionId: 'tx', subscription: null });
  const { getByTestId, getByText } = await renderSanSang();
  await fireEvent.press(getByText('Đồ án'));
  await fireEvent.press(getByTestId('mua-team_monthly'));
  await waitFor(() => expect(mockRequestPurchase).toHaveBeenCalled());
  await act(async () => mockOnPurchaseSuccess?.(giaoDich('team_monthly')));
  await waitFor(() => expect(mockedGui).toHaveBeenCalledWith({ jws: 'JWS', workspaceId: 'ws-3' }));
  // Xong thì xoá workspace đã ghi.
  await waitFor(async () => expect(await AsyncStorage.getItem('wedo.iap.workspaceTheoGoi')).toBe('{}'));
});

it('Team: đổi chip khi đang mở App Store vẫn gửi workspace lúc bấm mua', async () => {
  mockedWs.mockReturnValue(haiWorkspace);
  mockedGui.mockResolvedValue({ transactionId: 'tx', subscription: null });
  const { getByTestId, getByText } = await renderSanSang();
  await fireEvent.press(getByTestId('mua-team_monthly'));
  await waitFor(() => expect(mockRequestPurchase).toHaveBeenCalled());
  await fireEvent.press(getByText('Đồ án'));
  await act(async () => mockOnPurchaseSuccess?.(giaoDich('team_monthly')));
  await waitFor(() => expect(mockedGui).toHaveBeenCalledWith({ jws: 'JWS', workspaceId: 'ws-1' }));
});

it('Team: workspace lúc mua ghi vào bộ nhớ bền, tắt app mở lại vẫn gửi đúng', async () => {
  mockedWs.mockReturnValue(haiWorkspace);
  mockedGui.mockRejectedValueOnce(new Error('500'));
  const lan1 = await renderSanSang();
  await fireEvent.press(lan1.getByText('Đồ án'));
  await fireEvent.press(lan1.getByTestId('mua-team_yearly'));
  await waitFor(() => expect(mockRequestPurchase).toHaveBeenCalled());
  expect(JSON.parse((await AsyncStorage.getItem('wedo.iap.workspaceTheoGoi')) ?? '{}')).toEqual({ team_yearly: 'ws-3' });
  await act(async () => mockOnPurchaseSuccess?.(giaoDich('team_yearly')));
  await waitFor(() => expect(mockedGui).toHaveBeenCalledTimes(1));
  expect(mockFinishTransaction).not.toHaveBeenCalled();
  await lan1.unmount();

  // "Mở lại app": màn mới, chip về mặc định (ws-1), StoreKit đưa lại giao dịch.
  mockedGui.mockResolvedValue({ transactionId: 'tx', subscription: null });
  await renderSanSang();
  await act(async () => mockOnPurchaseSuccess?.(giaoDich('team_yearly')));
  await waitFor(() => expect(mockedGui).toHaveBeenLastCalledWith({ jws: 'JWS', workspaceId: 'ws-3' }));
});

it('Giao dịch Team phát lại (không có workspace đã nhớ): dùng chip đang chọn', async () => {
  mockedWs.mockReturnValue(haiWorkspace);
  mockedGui.mockResolvedValue({ transactionId: 'tx', subscription: null });
  const { getByText } = await renderSanSang();
  await fireEvent.press(getByText('Đồ án'));
  await act(async () => mockOnPurchaseSuccess?.(giaoDich('team_yearly')));
  await waitFor(() => expect(mockedGui).toHaveBeenCalledWith({ jws: 'JWS', workspaceId: 'ws-3' }));
});

it('Giao dịch Team phát lại, chưa bấm chip: dùng workspace đang tô sáng, không phải undefined', async () => {
  mockedWs.mockReturnValue(haiWorkspace);
  mockedGui.mockResolvedValue({ transactionId: 'tx', subscription: null });
  await renderSanSang();
  await act(async () => mockOnPurchaseSuccess?.(giaoDich('team_yearly')));
  await waitFor(() => expect(mockedGui).toHaveBeenCalledWith({ jws: 'JWS', workspaceId: 'ws-1' }));
});

it('Thiếu JWS: báo lỗi và mở lại nút mua', async () => {
  const { getByTestId, findByText } = await renderSanSang();
  await fireEvent.press(getByTestId('mua-pro_monthly'));
  await waitFor(() => expect(mockRequestPurchase).toHaveBeenCalled());
  await act(async () => mockOnPurchaseSuccess?.({ id: 'tx', productId: 'pro_monthly', purchaseToken: null, transactionDate: 1 }));
  expect(await findByText('Không đọc được giao dịch từ App Store.')).toBeTruthy();
  await fireEvent.press(getByTestId('mua-pro_yearly'));
  await waitFor(() => expect(mockRequestPurchase).toHaveBeenCalledTimes(2));
  expect(mockedGui).not.toHaveBeenCalled();
});

it('đang mua: nút mua mờ đi và khoá', async () => {
  // Bảng Apple đang mở: requestPurchase đã xong, giao dịch chưa về.
  const man = await renderSanSang();
  await fireEvent.press(man.getByTestId('mua-pro_monthly'));
  await waitFor(() => expect(mockRequestPurchase).toHaveBeenCalled());
  expect(man.getByTestId('mua-pro_yearly').props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
  expect(man.getByText('Đang mở App Store…')).toBeTruthy();
});

describe('máy chủ từ chối dứt khoát', () => {
  it('đã thuộc tài khoản WeDo khác: báo rồi finishTransaction', async () => {
    mockedGui.mockRejectedValue(new ApiError('Của người khác', 409, 'TRANSACTION_OWNED_BY_OTHER_USER'));
    const { findByText } = await renderSanSang();
    await act(async () => mockOnPurchaseSuccess?.(giaoDich('pro_monthly')));
    expect(await findByText(/gắn với một tài khoản WeDo khác/)).toBeTruthy();
    await waitFor(() => expect(mockFinishTransaction).toHaveBeenCalledTimes(1));
  });

  it('giao dịch không hợp lệ: câu riêng, không finish', async () => {
    mockedGui.mockRejectedValue(new ApiError('Sai', 400, 'APPLE_TRANSACTION_INVALID'));
    const { findByText } = await renderSanSang();
    await act(async () => mockOnPurchaseSuccess?.(giaoDich('pro_monthly')));
    expect(await findByText('Giao dịch App Store không hợp lệ. Bấm Khôi phục mua hàng để thử lại.')).toBeTruthy();
    expect(mockFinishTransaction).not.toHaveBeenCalled();
  });

  it('không phải chủ workspace: hướng dẫn chọn lại, quên workspace đã ghi, không finish', async () => {
    mockedWs.mockReturnValue(haiWorkspace);
    await AsyncStorage.setItem('wedo.iap.workspaceTheoGoi', JSON.stringify({ team_monthly: 'ws-2' }));
    mockedGui.mockRejectedValueOnce(new ApiError('Không phải chủ', 403, 'WORKSPACE_OWNER_REQUIRED'));
    const man = await renderSanSang();
    await act(async () => mockOnPurchaseSuccess?.(giaoDich('team_monthly')));
    expect(await man.findByText(/Chọn workspace bạn làm chủ ở trên rồi bấm Khôi phục mua hàng/)).toBeTruthy();
    expect(mockedGui).toHaveBeenCalledWith({ jws: 'JWS', workspaceId: 'ws-2' });
    expect(mockFinishTransaction).not.toHaveBeenCalled();

    // Chọn lại chip rồi giao dịch về lại (Khôi phục): gửi workspace vừa chọn.
    mockedGui.mockResolvedValue({ transactionId: 'tx', subscription: null });
    await fireEvent.press(man.getByText('Đồ án'));
    await act(async () => mockOnPurchaseSuccess?.(giaoDich('team_monthly')));
    await waitFor(() => expect(mockedGui).toHaveBeenLastCalledWith({ jws: 'JWS', workspaceId: 'ws-3' }));
  });
});

describe('Khôi phục mua hàng', () => {
  it('gọi restorePurchases phát lại qua listener; có gói thì báo đã kiểm tra', async () => {
    mockIap = { connected: true, subscriptions: SAN_PHAM, availablePurchases: [giaoDich('pro_monthly')] };
    const man = await renderSanSang();
    await fireEvent.press(man.getByTestId('khoi-phuc'));
    expect(mockRestorePurchases).toHaveBeenCalledWith({ alsoPublishToEventListenerIOS: true });
    expect(await man.findByText('Đã kiểm tra các gói đã mua.')).toBeTruthy();
  });

  it('không có gói nào: báo không tìm thấy', async () => {
    const man = await renderSanSang();
    await fireEvent.press(man.getByTestId('khoi-phuc'));
    expect(await man.findByText('Không tìm thấy gói nào.')).toBeTruthy();
  });

  it('khôi phục hỏng: chỉ báo lỗi, không báo đã kiểm tra', async () => {
    mockRestorePurchases.mockRejectedValueOnce(new Error('x'));
    const man = await renderSanSang();
    await fireEvent.press(man.getByTestId('khoi-phuc'));
    expect(await man.findByText('Chưa khôi phục được. Bạn thử lại sau nhé.')).toBeTruthy();
    expect(man.queryByText('Đã kiểm tra các gói đã mua.')).toBeNull();
    expect(man.queryByText('Không tìm thấy gói nào.')).toBeNull();
  });
});

it('Quản lý đăng ký mở không được: báo câu ngắn', async () => {
  (deepLinkToSubscriptions as jest.Mock).mockRejectedValueOnce(new Error('x'));
  const man = await renderSanSang();
  await fireEvent.press(man.getByTestId('quan-ly'));
  expect(await man.findByText(/Chưa mở được trang quản lý đăng ký/)).toBeTruthy();
});

it('quay lại màn (focus): xoá câu báo của lần trước', async () => {
  const man = await renderSanSang();
  await fireEvent.press(man.getByTestId('khoi-phuc'));
  expect(await man.findByText('Không tìm thấy gói nào.')).toBeTruthy();
  await act(async () => mockFocusCb?.());
  expect(man.queryByText('Không tìm thấy gói nào.')).toBeNull();
});
