import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { Socket } from 'socket.io-client';

import { datManDangMo, quenManDangMo } from '../notifications/man-dang-mo';

/**
 * Giữ một khung chat khớp máy chủ, dù màn hình KHÔNG BAO GIỜ bị gỡ.
 *
 * Màn chat nằm trong nhóm `(tabs)` là một route của bộ điều hướng tab. Tab đã mở
 * thì sống tới hết phiên: bấm Quay lại chỉ ẩn nó đi, bấm lại đúng khung chat đó
 * chỉ đưa màn cũ lên trước — `useEffect` theo `projectId` không chạy lại. Lỗi
 * người thử nghiệm báo 23/09/2026: tin mới không hiện, huy hiệu chưa đọc không
 * mất, phải bấm vào lần thứ hai mới thấy.
 *
 * Nên nạp lại theo đúng ba lúc có thể đã lỡ tin:
 * - màn được đưa lên (mỗi lần, không chỉ lần gắn đầu tiên);
 * - app trở lại tiền cảnh — Android cắt kết nối khi app nằm nền, và máy chủ
 *   KHÔNG phát lại tin gửi trong lúc đó;
 * - socket nối lại sau khi đứt, cùng lý do.
 *
 * Hai lúc sau CHỈ nạp khi màn đang được XEM — focus và app ở tiền cảnh. Nạp khung
 * chat là GET /chat, mà máy chủ coi lượt đó là "đã đọc": màn đã rời, hay app đang
 * nằm nền, mà vẫn nạp là xoá huy hiệu của những tin người dùng chưa hề thấy. Màn
 * đã rời thì để lần focus sau tự nạp.
 */
export function useDongBoKhungChat({
  khoaManDangMo,
  socket,
  napLai,
  onRoi,
}: {
  /** `du-an:<id>` hoặc `dm:<id>` — xem `man-dang-mo.ts`. */
  khoaManDangMo: string | null;
  socket: Pick<Socket, 'on' | 'off'> | null;
  napLai: () => void;
  /**
   * Gọi đúng lúc người dùng THÔI NHÌN màn — rời màn, hoặc app vào nền trong lúc
   * đang xem — để chốt những việc còn treo, như báo đã đọc.
   */
  onRoi?: () => void;
}): { dangXem: () => boolean; dangMo: () => boolean } {
  const dangFocus = useRef(false);
  const dangTienCanh = useRef(
    AppState.currentState !== 'background' && AppState.currentState !== 'inactive',
  );

  // Luôn gọi bản mới nhất mà không phải đăng ký lại mọi lắng nghe.
  const napLaiMoiNhat = useRef(napLai);
  const onRoiMoiNhat = useRef(onRoi);
  useEffect(() => {
    napLaiMoiNhat.current = napLai;
    onRoiMoiNhat.current = onRoi;
  }, [napLai, onRoi]);

  const dangXem = useCallback(() => dangFocus.current && dangTienCanh.current, []);
  /** Màn đang được focus, bất kể app ở tiền cảnh hay nằm nền. */
  const dangMo = useCallback(() => dangFocus.current, []);

  /* Nhịp hoãn nạp sau khi mở app — dùng chung cho nhánh AppState và nhánh socket. */
  const henNap = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      dangFocus.current = true;
      if (khoaManDangMo) datManDangMo(khoaManDangMo);
      napLaiMoiNhat.current();

      return () => {
        dangFocus.current = false;
        // Chỉ xoá khoá của chính mình — màn kế tiếp có thể đã kịp đặt khoá của nó.
        if (khoaManDangMo) quenManDangMo(khoaManDangMo);
        onRoiMoiNhat.current?.();
      };
    }, [khoaManDangMo]),
  );

  useEffect(() => {
    const dangKy = AppState.addEventListener('change', (trangThai) => {
      const truoc = dangTienCanh.current;
      dangTienCanh.current = trangThai === 'active';

      // Vào nền lúc đang xem: người dùng thôi nhìn màn — chốt việc treo ngay bây giờ,
      // đừng để hẹn giờ bị Android đóng băng rồi bắn khi mở app lên ở màn khác.
      if (truoc && !dangTienCanh.current && dangFocus.current) onRoiMoiNhat.current?.();

      if (truoc || !dangTienCanh.current || !dangFocus.current) return;

      /*
        Hoãn một nhịp rồi xét lại. Mở app bằng cách chạm thông báo của chỗ khác:
        Android báo "đã mở app" TRƯỚC khi lệnh chuyển màn kịp chạy, lúc khung chat
        cũ vẫn đang focus. Nạp ngay là máy chủ ghi khung chat đó "đã đọc" trong khi
        người dùng đang được đưa sang màn khác, chưa hề thấy tin.
      */
      if (henNap.current) clearTimeout(henNap.current);
      henNap.current = setTimeout(() => {
        henNap.current = null;
        if (dangFocus.current && dangTienCanh.current) napLaiMoiNhat.current();
      }, 500);
    });
    return () => {
      if (henNap.current) clearTimeout(henNap.current);
      henNap.current = null;
      dangKy.remove();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    /*
      Nối lại lúc app nằm nền thì thôi — mở app lên, nhánh AppState ở trên sẽ nạp.
      Đang có nhịp hoãn sau khi mở app thì cũng để nhịp đó lo: socket thường nối
      lại chỉ vài trăm mili-giây sau 'active', trước khi lệnh chuyển màn từ thông
      báo kịp chạy.
    */
    const khiNoi = () => {
      if (!dangFocus.current || !dangTienCanh.current || henNap.current) return;
      napLaiMoiNhat.current();
    };
    socket.on('connect', khiNoi);
    return () => {
      socket.off('connect', khiNoi);
    };
  }, [socket]);

  return { dangXem, dangMo };
}
