import { ApiError } from '../../api/client';
import { ghepTheGoi, loiNhanMua, workspaceMinhLamChu } from '../mua-goi';

describe('ghepTheGoi', () => {
  it('ghép 4 sản phẩm StoreKit thành 2 thẻ, giá lấy từ StoreKit', () => {
    const the = ghepTheGoi([
      { id: 'pro_monthly', displayPrice: '39.000 ₫' },
      { id: 'pro_yearly', displayPrice: '390.000 ₫' },
      { id: 'team_monthly', displayPrice: '129.000 ₫' },
      { id: 'team_yearly', displayPrice: '1.290.000 ₫' },
    ]);
    expect(the.map((t) => t.ten)).toEqual(['Personal Pro', 'Team Growth']);
    expect(the[0].thang).toEqual({ sku: 'pro_monthly', gia: '39.000 ₫' });
    expect(the[1].nam).toEqual({ sku: 'team_yearly', gia: '1.290.000 ₫' });
    expect(the[0].quyenLoi.some((q) => q.includes('300 lượt AI'))).toBe(true);
  });

  it('thiếu sản phẩm thì ô đó null, không ném lỗi', () => {
    const the = ghepTheGoi([{ id: 'pro_monthly', displayPrice: '39.000 ₫' }]);
    expect(the[0].nam).toBeNull();
    expect(the[1].thang).toBeNull();
  });
});

describe('workspaceMinhLamChu', () => {
  it('chỉ giữ workspace có ownerId là mình', () => {
    const ws = [
      { id: 'a', name: 'Nhóm 5', ownerId: 'u1' },
      { id: 'b', name: 'Lớp', ownerId: 'u2' },
    ];
    expect(workspaceMinhLamChu(ws, 'u1')).toEqual([{ id: 'a', name: 'Nhóm 5' }]);
    expect(workspaceMinhLamChu(ws, 'u9')).toEqual([]);
  });
});

describe('loiNhanMua', () => {
  it('người dùng huỷ bảng Apple → chuỗi rỗng (không báo gì)', () => {
    expect(loiNhanMua({ code: 'user-cancelled' })).toBe('');
  });
  it('trùng gói web còn hạn → câu có ngày', () => {
    expect(loiNhanMua({ code: 'SUBSCRIPTION_CONFLICT', currentPeriodEnd: '2026-11-08T10:00:00.000Z' })).toContain('08/11/2026');
  });
  it('giao dịch App Store không hợp lệ → bảo bấm Khôi phục', () => {
    expect(loiNhanMua({ code: 'APPLE_TRANSACTION_INVALID' })).toBe(
      'Giao dịch App Store không hợp lệ. Bấm Khôi phục mua hàng để thử lại.',
    );
  });
  it('không phải chủ workspace → hướng dẫn chọn lại rồi Khôi phục', () => {
    expect(loiNhanMua({ code: 'WORKSPACE_OWNER_REQUIRED' })).toContain(
      'Chọn workspace bạn làm chủ ở trên rồi bấm Khôi phục mua hàng.',
    );
  });
  it('mã lạ → câu chung', () => {
    expect(loiNhanMua(new Error('x'))).toBe('Chưa mua được. Bạn thử lại sau nhé.');
  });
  it('ApiError trùng gói web: ngày nằm trong chiTiet của body máy chủ', () => {
    const loi = new ApiError('Trùng gói', 409, 'SUBSCRIPTION_CONFLICT');
    loi.chiTiet = { currentPeriodEnd: '2026-11-08T10:00:00.000Z' };
    expect(loiNhanMua(loi)).toContain('08/11/2026');
  });
});
