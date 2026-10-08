import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ManNangCap from '../../../app/(tabs)/account/nang-cap';
import { guiGiaoDichApple, layAppAccountToken } from '../../../lib/api/apple-iap';
import { useAuth } from '../../../lib/auth/auth-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { renderScreen } from '../../../test-utils/render';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), navigate: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
jest.mock('../../../lib/auth/auth-context');
jest.mock('../../../lib/workspace/workspace-context');
jest.mock('../../../lib/api/apple-iap', () => ({
  layAppAccountToken: jest.fn(async () => ({ appAccountToken: 'tok' })),
  guiGiaoDichApple: jest.fn(),
  MA_LOI_IAP: {},
}));

const mockFinishTransaction = jest.fn(async () => undefined);
const mockRequestPurchase = jest.fn(async () => undefined);
let mockOnPurchaseSuccess: ((p: any) => void) | undefined;
jest.mock('expo-iap', () => ({
  useIAP: (opts: any) => {
    mockOnPurchaseSuccess = opts?.onPurchaseSuccess;
    return {
      connected: true,
      subscriptions: [
        { id: 'pro_monthly', displayPrice: '39.000 ₫' },
        { id: 'pro_yearly', displayPrice: '390.000 ₫' },
        { id: 'team_monthly', displayPrice: '129.000 ₫' },
        { id: 'team_yearly', displayPrice: '1.290.000 ₫' },
      ],
      fetchProducts: jest.fn(async () => undefined),
      requestPurchase: mockRequestPurchase,
      finishTransaction: mockFinishTransaction,
      getAvailablePurchases: jest.fn(async () => undefined),
      availablePurchases: [],
    };
  },
  deepLinkToSubscriptions: jest.fn(),
}));

function renderManHinh() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderScreen(
    <QueryClientProvider client={queryClient}>
      <ManNangCap />
    </QueryClientProvider>,
  );
}

const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedWs = useWorkspace as jest.MockedFunction<typeof useWorkspace>;
const mockedGui = guiGiaoDichApple as jest.MockedFunction<typeof guiGiaoDichApple>;

beforeEach(() => {
  jest.clearAllMocks();
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
});

it('mua Pro tháng: gọi requestPurchase với sku và appAccountToken', async () => {
  const { findByTestId } = await renderManHinh();
  await fireEvent.press(await findByTestId('mua-pro_monthly'));
  await waitFor(() => expect(layAppAccountToken).toHaveBeenCalled());
  await waitFor(() =>
    expect(mockRequestPurchase).toHaveBeenCalledWith({ type: 'subs', request: { apple: { sku: 'pro_monthly', appAccountToken: 'tok' } } }),
  );
});

it('giao dịch về: gửi máy chủ, xong mới finishTransaction', async () => {
  mockedGui.mockResolvedValue({ transactionId: 'tx', subscription: { provider: 'APPLE', plan: 'PERSONAL_PRO', billingCycle: 'MONTHLY', currentPeriodEnd: '2026-11-08T10:00:00.000Z' } });
  await renderManHinh();
  await act(async () => mockOnPurchaseSuccess?.({ id: 'tx', productId: 'pro_monthly', purchaseToken: 'JWS', transactionDate: 1 }));
  await waitFor(() => expect(mockedGui).toHaveBeenCalledWith({ jws: 'JWS', workspaceId: undefined }));
  await waitFor(() => expect(mockFinishTransaction).toHaveBeenCalled());
});

it('máy chủ hỏng: KHÔNG finishTransaction, hiện đang kích hoạt', async () => {
  mockedGui.mockRejectedValue(new Error('500'));
  const { findByText } = await renderManHinh();
  await act(async () => mockOnPurchaseSuccess?.({ id: 'tx', productId: 'pro_monthly', purchaseToken: 'JWS', transactionDate: 1 }));
  expect(await findByText(/đang kích hoạt/i)).toBeTruthy();
  expect(mockFinishTransaction).not.toHaveBeenCalled();
});

it('Team: gửi workspaceId của workspace mình làm chủ', async () => {
  mockedGui.mockResolvedValue({ transactionId: 'tx', subscription: null });
  const { findByTestId } = await renderManHinh();
  await fireEvent.press(await findByTestId('mua-team_monthly'));
  await waitFor(() => expect(mockRequestPurchase).toHaveBeenCalled());
  await act(async () => mockOnPurchaseSuccess?.({ id: 'tx', productId: 'team_monthly', purchaseToken: 'JWS', transactionDate: 1 }));
  await waitFor(() => expect(mockedGui).toHaveBeenCalledWith({ jws: 'JWS', workspaceId: 'ws-1' }));
});
