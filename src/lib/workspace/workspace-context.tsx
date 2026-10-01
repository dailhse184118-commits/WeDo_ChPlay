import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { createWorkspace, listWorkspaces } from '../api/workspaces';
import { baoLoi } from '../observability/sentry';
import { loadActiveWorkspaceId, saveActiveWorkspaceId } from '../auth/token-storage';
import { useSocketNeuCo } from '../socket/socket-context';
import type { Workspace } from '../types';
import { pickActiveWorkspace } from './active-workspace';
import { docDanhSachKhongGian, luuDanhSachKhongGian } from './danh-sach-luu';

/**
 * `error`: lần nạp ĐẦU TIÊN hỏng và máy chưa có danh sách nào lưu từ trước —
 * không có gì để dựng màn hình. Nạp lại hỏng sau khi đã có danh sách thì giữ
 * nguyên danh sách, không bao giờ rơi vào đây.
 */
export type WorkspaceStatus = 'loading' | 'empty' | 'ready' | 'error';

/** Tự thử lại sau một lần nạp hỏng: 2 giây, rồi 5, rồi 15. Sau đó chờ người dùng hoặc mạng về. */
export const LICH_THU_LAI_MS = [2_000, 5_000, 15_000] as const;

export interface WorkspaceState {
  status: WorkspaceStatus;
  active: Workspace | null;
  workspaces: Workspace[];
  refresh: () => Promise<void>;
  create: (name: string) => Promise<void>;
  /** Đổi sang workspace khác. Id không có trong danh sách thì không làm gì. */
  switchTo: (workspaceId: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<WorkspaceStatus>('loading');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [active, setActive] = useState<Workspace | null>(null);

  /** Đã dựng được danh sách nào chưa — từ máy chủ hay từ bản lưu trên máy. */
  const daCoDanhSach = useRef(false);
  /** Lượt nạp gần nhất có hỏng không: hỏng thì socket nối lại được là nạp lại. */
  const napHong = useRef(false);
  const soLanThuLai = useRef(0);
  const henThuLai = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conGan = useRef(true);

  const apDung = useCallback(async (list: Workspace[]) => {
    setWorkspaces(list);

    const savedId = await loadActiveWorkspaceId();
    const chosen = pickActiveWorkspace(list, savedId);

    setActive(chosen);
    setStatus(chosen ? 'ready' : 'empty');
    daCoDanhSach.current = true;

    if (chosen && chosen.id !== savedId) {
      await saveActiveWorkspaceId(chosen.id);
    }
  }, []);

  const refresh = useCallback(async () => {
    /*
      Hỏng một lượt nạp thì GIỮ NGUYÊN danh sách cũ. Nạp lại giờ chạy mỗi lần
      quay lại app, mà quay lại app lúc sóng yếu là chuyện hằng ngày — để lỗi
      thoát ra sẽ biến một lần chập mạng thành màn "tạo không gian làm việc",
      trông y như người dùng vừa mất sạch dữ liệu.

      Hỏng ngay lần ĐẦU (mở app lúc mất mạng, Wi-Fi hội chợ chập chờn, máy chủ
      đang khởi động lại) thì dùng danh sách lưu từ lần trước để người dùng vào
      được app và đọc dữ liệu đã có trên máy. Chưa từng lưu thì báo lỗi kèm nút
      Thử lại — trước đây chỗ này để vòng quay chạy mãi mãi.
    */
    let list: Workspace[];
    try {
      list = await listWorkspaces();
    } catch (loi) {
      baoLoi(loi, 'nap-danh-sach-khong-gian');
      if (!conGan.current) return;
      napHong.current = true;

      if (!daCoDanhSach.current) {
        const daLuu = await docDanhSachKhongGian();
        if (!conGan.current) return;
        if (daLuu && daLuu.length > 0) {
          await apDung(daLuu);
        } else {
          setStatus('error');
        }
      }

      const lan = soLanThuLai.current;
      if (lan < LICH_THU_LAI_MS.length && !henThuLai.current) {
        soLanThuLai.current = lan + 1;
        henThuLai.current = setTimeout(() => {
          henThuLai.current = null;
          void refresh();
        }, LICH_THU_LAI_MS[lan]);
      }
      return;
    }

    if (!conGan.current) return;
    napHong.current = false;
    soLanThuLai.current = 0;
    if (henThuLai.current) {
      clearTimeout(henThuLai.current);
      henThuLai.current = null;
    }

    void luuDanhSachKhongGian(list);
    await apDung(list);
  }, [apDung]);

  const create = useCallback(async (name: string) => {
    const workspace = await createWorkspace({ name });
    await saveActiveWorkspaceId(workspace.id);
    setWorkspaces((current) => [...current, workspace]);
    setActive(workspace);
    setStatus('ready');
  }, []);

  const switchTo = useCallback(
    async (workspaceId: string) => {
      /*
        Tìm trong danh sách đang có thay vì tin thẳng id gọi vào. Workspace có
        thể vừa bị xoá ở máy khác, hoặc người dùng vừa bị mời ra — khi đó đặt
        `active` thành null sẽ đá cả app về màn tạo workspace.
      */
      const chosen = workspaces.find((workspace) => workspace.id === workspaceId);
      if (!chosen || chosen.id === active?.id) return;

      setActive(chosen);
      await saveActiveWorkspaceId(chosen.id);
    },
    [workspaces, active],
  );

  useEffect(() => {
    void refresh();

    /*
      Nạp lại mỗi lần quay lại app.

      Mọi dữ liệu khác đã tự tươi nhờ `refetchOnWindowFocus` của react-query
      (xem `lib/app-focus.ts`), nhưng danh sách không gian nằm NGOÀI react-query
      nên bị bỏ quên: nó chỉ tải đúng một lần lúc mở app.

      Hậu quả người kiểm thử gặp ngày 19/09/2026: được thêm vào một dự án ở
      không gian khác, nhận được thông báo đẩy và mở được chi tiết công việc,
      nhưng danh sách không gian không hề có cái mới — không có đường nào vào
      dự án đó ngoài việc tắt hẳn app rồi mở lại.
    */
    const subscription = AppState.addEventListener('change', (trangThai) => {
      if (trangThai === 'active') void refresh();
    });

    conGan.current = true;
    return () => {
      conGan.current = false;
      subscription.remove();
      if (henThuLai.current) {
        clearTimeout(henThuLai.current);
        henThuLai.current = null;
      }
    };
  }, [refresh]);

  /*
    Socket vừa nối lại được nghĩa là mạng và máy chủ đã về. Lượt nạp trước hỏng
    thì nạp lại ngay, không đợi hẹn giờ hay người dùng bấm Thử lại.
  */
  const daNoiSocket = useSocketNeuCo()?.connected ?? false;
  useEffect(() => {
    if (daNoiSocket && napHong.current) void refresh();
  }, [daNoiSocket, refresh]);

  const value = useMemo<WorkspaceState>(
    () => ({ status, active, workspaces, refresh, create, switchTo }),
    [status, active, workspaces, refresh, create, switchTo],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceState {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace phải được dùng bên trong WorkspaceProvider');
  }
  return context;
}
