import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { blockUser, listBlocks, unblockUser, type NguoiDaChan } from '../api/moderation';
import { tapNguoiDaChan } from './loc-chan';
import { NOI_DUNG_XAC_NHAN_CHAN, tieuDeXacNhanChan } from './noi-dung';

/**
 * Khoá cache của danh sách chặn.
 *
 * Mọi màn cần biết "ai đã bị chặn" — chat dự án, tin nhắn riêng, danh sách hội
 * thoại, màn Người đã chặn — đọc CHUNG khoá này, nên chặn ở một chỗ là mọi chỗ
 * ẩn theo ngay, không cần nạp lại từng màn.
 */
export const KHOA_DANH_SACH_CHAN = ['moderation', 'blocks'] as const;

export function useDanhSachChan() {
  return useQuery({
    queryKey: KHOA_DANH_SACH_CHAN,
    queryFn: listBlocks,
    // Danh sách này chỉ đổi khi chính người dùng bấm chặn hay bỏ chặn.
    staleTime: 5 * 60_000,
  });
}

/** Tập id người đã chặn. Rỗng khi chưa tải xong hoặc tải hỏng — không bao giờ chặn nhầm. */
export function useNguoiDaChan(): ReadonlySet<string> {
  const { data } = useDanhSachChan();
  return useMemo(() => tapNguoiDaChan(data), [data]);
}

/** Người sắp bị chặn. Cần họ tên cho câu hỏi xác nhận và cho màn Người đã chặn. */
export interface NguoiCanChan {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

/**
 * Hỏi lại rồi mới chặn.
 *
 * Chặn là thao tác nặng — xoá luôn tình bạn và khoá tin nhắn riêng hai chiều —
 * nên luôn có một bước xác nhận nói rõ hậu quả và chỗ để bỏ chặn.
 *
 * Chặn xong ghi thẳng người đó vào cache TRƯỚC khi nạp lại: Apple muốn thấy việc
 * chặn có tác dụng ngay, còn đợi lượt GET quay về thì tin của người kia vẫn nằm
 * trên màn thêm một nhịp.
 */
export function useChanNguoi() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (nguoi: NguoiCanChan) => blockUser(nguoi.id),
    onSuccess: (_ketQua, nguoi) => {
      queryClient.setQueryData<NguoiDaChan[]>(KHOA_DANH_SACH_CHAN, (cu = []) =>
        cu.some((x) => x.userId === nguoi.id)
          ? cu
          : [
              ...cu,
              {
                userId: nguoi.id,
                fullName: nguoi.fullName,
                avatarUrl: nguoi.avatarUrl ?? null,
                blockedAt: new Date().toISOString(),
              },
            ],
      );
      void queryClient.invalidateQueries({ queryKey: KHOA_DANH_SACH_CHAN });
      // Máy chủ xoá luôn tình bạn và giấu người đó khỏi tìm kiếm — đọc lại cho khớp.
      void queryClient.invalidateQueries({ queryKey: ['friends'] });
      void queryClient.invalidateQueries({ queryKey: ['friends-search'] });
      void queryClient.invalidateQueries({ queryKey: ['direct-conversations'] });
    },
  });

  const hoiRoiChan = useCallback(
    (nguoi: NguoiCanChan, sauKhiChan?: () => void) => {
      Alert.alert(tieuDeXacNhanChan(nguoi.fullName), NOI_DUNG_XAC_NHAN_CHAN, [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Chặn',
          style: 'destructive',
          onPress: () =>
            mutate(nguoi, {
              onSuccess: () => sauKhiChan?.(),
              onError: (loi) =>
                Alert.alert(
                  'Chưa chặn được',
                  loi instanceof Error ? loi.message : 'Có lỗi xảy ra. Thử lại sau.',
                ),
            }),
        },
      ]);
    },
    [mutate],
  );

  return { hoiRoiChan, dangChan: isPending };
}

/**
 * Bỏ chặn.
 *
 * Máy chủ đã lọc tin của người đó khỏi các lượt GET trước, nên phải nạp lại hội
 * thoại riêng thì tin cũ mới hiện lại.
 */
export function useBoChan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => unblockUser(userId),
    onSuccess: (_ketQua, userId) => {
      queryClient.setQueryData<NguoiDaChan[]>(KHOA_DANH_SACH_CHAN, (cu) =>
        cu?.filter((x) => x.userId !== userId),
      );
      void queryClient.invalidateQueries({ queryKey: KHOA_DANH_SACH_CHAN });
      void queryClient.invalidateQueries({ queryKey: ['direct-conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['direct-messages'] });
      void queryClient.invalidateQueries({ queryKey: ['friends-search'] });
    },
  });
}
