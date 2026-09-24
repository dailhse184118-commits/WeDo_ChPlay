import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import type { Socket } from 'socket.io-client';

import { giaHanMotLuot } from '../api/client';
import { useAuth } from '../auth/auth-context';
import { loadToken } from '../auth/token-storage';
import { createChatSocket } from '../socket';

/** Chờ lâu nhất giữa hai lần tự nối lại sau khi bị máy chủ ngắt. */
const CHO_NOI_LAI_TOI_DA_MS = 60_000;

export interface SocketState {
  socket: Socket | null;
  connected: boolean;
  onlineUserIds: Set<string>;
}

const SocketContext = createContext<SocketState | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status !== 'signedIn') {
      return;
    }

    let cancelled = false;
    let active: Socket | null = null;
    let henNoiLai: ReturnType<typeof setTimeout> | null = null;
    let lanThu = 0;
    let theoDoiApp: { remove: () => void } | null = null;

    const huyHenNoiLai = () => {
      if (henNoiLai) clearTimeout(henNoiLai);
      henNoiLai = null;
    };

    (async () => {
      const token = await loadToken();
      if (!token || cancelled) return;

      // Truyền hàm đọc token, không truyền token — xem `createChatSocket`.
      const next = createChatSocket(loadToken);
      active = next;

      /*
        Máy chủ ngắt socket ('io server disconnect') khi bắt tay thất bại: token
        hết hạn, hoặc lỗi tạm thời lúc đọc cơ sở dữ liệu. Với lý do này
        socket.io-client KHÔNG tự nối lại — realtime chết im lặng tới khi tắt app,
        trong lúc gọi API vẫn chạy nên chẳng ai nhận ra. Gia hạn phiên rồi nối
        lại, lùi dần để lỗi kéo dài không thành vòng lặp dội máy chủ.

        Mọi lý do khác (rớt mạng, máy chủ khởi động lại) thư viện đã tự nối lại;
        chen thêm lượt nối tay là hai kết nối đua nhau.
      */
      const henNoiLaiSau = () => {
        if (henNoiLai || cancelled) return;
        const cho = Math.min(CHO_NOI_LAI_TOI_DA_MS, 2_000 * 2 ** lanThu);
        lanThu += 1;
        henNoiLai = setTimeout(async () => {
          henNoiLai = null;
          try {
            const tokenMoi = await giaHanMotLuot();
            // Không gia hạn được là phiên đã hết hẳn: nối lại chỉ bị ngắt tiếp.
            if (cancelled || !tokenMoi) return;
            /*
              Trong lúc chờ gia hạn, nhánh AppState có thể đã nối lại rồi. Gọi
              connect() lần nữa là gửi CONNECT thứ hai trên cùng kết nối — máy chủ
              coi là sai trạng thái và cắt cả kết nối.
            */
            if (next.connected || next.active) return;
            next.connect();
          } catch {
            // Lỗi mạng khi gia hạn: phiên có thể vẫn còn, thử lại sau.
            henNoiLaiSau();
          }
        }, cho);
      };

      next.on('connect', () => {
        huyHenNoiLai();
        setConnected(true);
      });
      next.on('disconnect', (lyDo: string) => {
        setConnected(false);
        if (lyDo === 'io server disconnect') henNoiLaiSau();
      });

      /*
        Mở app lên mà socket đang nằm chết — không kết nối, cũng không đang tự thử
        lại — thì nối ngay thay vì đợi hẹn giờ lùi dần. Bắt tay mà bị từ chối thì
        nhánh 'io server disconnect' ở trên lo tiếp.
      */
      theoDoiApp = AppState.addEventListener('change', (trangThai) => {
        if (trangThai !== 'active' || cancelled) return;
        if (next.connected || next.active) return;
        huyHenNoiLai();
        next.connect();
      });
      next.on('presence:snapshot', (ids: string[]) => {
        /*
          Đặt lại bộ đếm lùi Ở ĐÂY, không ở 'connect': máy chủ từ chối trong lúc bắt
          tay SAU khi đã gửi CONNECT, nên mỗi lần bị từ chối vẫn có 'connect' đi
          trước — đặt lại ở đó là thời gian chờ không bao giờ tăng. Máy chủ chỉ gửi
          presence:snapshot khi đã nhận phiên thật.
        */
        lanThu = 0;
        setOnlineUserIds(new Set(ids));
      });
      next.on('presence:online', ({ userId }: { userId: string }) =>
        setOnlineUserIds((current) => new Set(current).add(userId)),
      );
      next.on('presence:offline', ({ userId }: { userId: string }) =>
        setOnlineUserIds((current) => {
          const copy = new Set(current);
          copy.delete(userId);
          return copy;
        }),
      );

      if (!cancelled) setSocket(next);
    })();

    return () => {
      cancelled = true;
      huyHenNoiLai();
      theoDoiApp?.remove();
      // Bắt buộc dọn. Bỏ qua sẽ khiến đăng nhập lại tạo kết nối chồng
      // và mỗi tin nhắn hiện hai lần.
      active?.disconnect();
      setSocket(null);
      setConnected(false);
      setOnlineUserIds(new Set());
    };
  }, [status]);

  const value = useMemo<SocketState>(
    () => ({ socket, connected, onlineUserIds }),
    [socket, connected, onlineUserIds],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket(): SocketState {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket phải được dùng bên trong SocketProvider');
  }
  return context;
}
