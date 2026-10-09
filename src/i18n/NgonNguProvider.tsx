import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { TuDien } from './dich';
import { dichThongBaoLoi } from './loi';
import {
  dangKyNgonNgu,
  datLuaChon,
  docLaiNgonNguMay,
  layLuaChon,
  layNgonNgu,
  napLuaChonDaLuu,
  type LuaChonNgonNgu,
  type NgonNgu,
} from './ngon-ngu';

interface GiaTri {
  ngonNgu: NgonNgu;
  luaChon: LuaChonNgonNgu;
  datLuaChon: (l: LuaChonNgonNgu) => Promise<void>;
}
const Ctx = createContext<GiaTri | null>(null);

function useKho() {
  const ngonNgu = useSyncExternalStore(dangKyNgonNgu, layNgonNgu, layNgonNgu);
  const luaChon = useSyncExternalStore(dangKyNgonNgu, layLuaChon, layLuaChon);
  return { ngonNgu, luaChon };
}

export function NgonNguProvider({ children }: { children: ReactNode }) {
  const { ngonNgu, luaChon } = useKho();
  useEffect(() => {
    void napLuaChonDaLuu();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') docLaiNgonNguMay();
    });
    return () => sub.remove();
  }, []);
  const giaTri = useMemo(() => ({ ngonNgu, luaChon, datLuaChon }), [ngonNgu, luaChon]);
  return <Ctx.Provider value={giaTri}>{children}</Ctx.Provider>;
}

/** Dùng được cả ngoài Provider (kiểm thử): khi đó đọc thẳng kho. */
export function useNgonNgu(): GiaTri {
  const g = useContext(Ctx);
  const kho = useKho();
  return g ?? { ...kho, datLuaChon };
}
export function useTuDien<T>(t: TuDien<T>): T {
  return t[useNgonNgu().ngonNgu];
}
export function useDichLoi() {
  const { ngonNgu } = useNgonNgu();
  return useCallback((loi: unknown, duPhong: string) => dichThongBaoLoi(loi, duPhong, ngonNgu), [ngonNgu]);
}
