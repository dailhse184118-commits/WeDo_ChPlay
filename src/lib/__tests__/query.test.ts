import { QueryClient } from '@tanstack/react-query';

import { nenLuuXuongMay } from '../query';

/*
  Cache react-query được ghi xuống máy để mất mạng vẫn xem được dữ liệu cũ.
  Riêng truy vấn đánh dấu `meta.luuXuongMay = false` (ví dụ link đồng bộ lịch —
  ai cầm link là đọc được lịch) không được nằm trên đĩa.
*/
describe('nenLuuXuongMay', () => {
  const tao = async (meta?: Record<string, unknown>) => {
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
    await client.fetchQuery({ queryKey: ['k'], queryFn: () => 1, meta });
    const q = client.getQueryCache().find({ queryKey: ['k'] });
    client.clear();
    return q!;
  };

  it('truy vấn thường đã có dữ liệu: ghi xuống máy', async () => {
    expect(nenLuuXuongMay(await tao())).toBe(true);
  });

  it('truy vấn đánh dấu không lưu: không ghi', async () => {
    expect(nenLuuXuongMay(await tao({ luuXuongMay: false }))).toBe(false);
  });
});
