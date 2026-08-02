import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      // Mạng di động hay chập chờn; đừng nạp lại liên tục khi app đổi focus.
      refetchOnWindowFocus: false,
    },
  },
});
