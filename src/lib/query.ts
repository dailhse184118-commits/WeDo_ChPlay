import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
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
