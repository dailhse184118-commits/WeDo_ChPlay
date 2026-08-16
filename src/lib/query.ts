import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

/** Đổi khoá này khi hình dạng dữ liệu đổi, để cache cũ bị bỏ thay vì đọc nhầm. */
const KHOA_CACHE = 'wedo:query-cache:v1';

/**
 * Cache sống được bao lâu trên đĩa.
 *
 * Dài hơn hẳn `staleTime`: `staleTime` quyết định khi nào cần nạp lại, còn con
 * số này quyết định khi nào vứt hẳn. Bảy ngày đủ để người dùng mở app sau kỳ
 * nghỉ mà vẫn thấy việc cũ thay vì màn hình trắng.
 */
const HAN_CACHE_MS = 7 * 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      /*
        `gcTime` phải dài hơn `staleTime` rất nhiều thì cache mới sống đủ lâu để
        được ghi xuống đĩa. Để mặc định 5 phút thì dữ liệu bị dọn trước khi kịp
        có ích cho lần mở app sau.
      */
      gcTime: HAN_CACHE_MS,
      retry: 1,
      /*
        Quay lại app thì nạp lại. Trước đây tắt vì sợ mạng di động chập chờn,
        nhưng `staleTime` 30 giây đã chặn việc nạp lại dồn dập rồi — chuyển qua
        chuyển lại trong 30 giây không sinh thêm lượt gọi nào.

        Cần `bridgeAppStateToQueryFocus` mới có tác dụng: React Native không có
        sự kiện focus của cửa sổ như trình duyệt.
      */
      refetchOnWindowFocus: true,
    },
  },
});

/**
 * Ghi cache xuống máy để mất mạng vẫn xem được dữ liệu lần trước.
 *
 * Trước đây cache chỉ nằm trong bộ nhớ tạm: tắt app rồi mở lại ở chỗ sóng yếu —
 * thang máy, tầng hầm, giảng đường — là trắng màn hình, dù năm phút trước vừa
 * xem xong. Với người dùng đi 4G thì đó là chuyện hằng ngày.
 */
export const cacheBenBi = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: KHOA_CACHE,
});

export const HAN_CACHE_BEN_BI_MS = HAN_CACHE_MS;

/**
 * Xoá sạch cache đã ghi xuống đĩa. PHẢI gọi lúc đăng xuất.
 *
 * Cache chứa công việc, tin nhắn và tên dự án của người vừa dùng. Không xoá thì
 * người đăng nhập tiếp theo trên cùng máy sẽ thấy dữ liệu của người trước ngay
 * khi mở app, trước cả khi lượt gọi mạng đầu tiên kịp trả về.
 *
 * Xoá cả trong bộ nhớ lẫn trên đĩa: bỏ sót vế nào cũng vẫn rò.
 */
export async function xoaCacheBenBi(): Promise<void> {
  queryClient.clear();
  try {
    await cacheBenBi.removeClient();
  } catch {
    // Không xoá được đĩa thì thôi, nhưng phần trong bộ nhớ ở trên đã sạch.
  }
}
