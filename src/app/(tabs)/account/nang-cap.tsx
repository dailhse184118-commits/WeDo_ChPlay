import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deepLinkToSubscriptions, useIAP, type Purchase } from 'expo-iap';

import { useNgonNgu, useTuDien } from '../../../i18n/NgonNguProvider';
import { tuDienNangCap } from '../../../i18n/tu-dien/nang-cap';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import { guiGiaoDichApple, layAppAccountToken } from '../../../lib/api/apple-iap';
import { getEntitlements } from '../../../lib/api/entitlements';
import { useAuth } from '../../../lib/auth/auth-context';
import { PRIVACY_URL, TERMS_URL, openLegalLink } from '../../../lib/legal-links';
import { ghepTheGoi, loiNhanMua, MA_GOI, workspaceMinhLamChu, type MaGoi, type TheGoi } from '../../../lib/payments/mua-goi';
import { docWorkspaceLucMua, ghiWorkspaceLucMua, xoaWorkspaceLucMua } from '../../../lib/payments/workspace-luc-mua';
import { useQuayLai } from '../../../lib/use-quay-lai';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, radius, spacing } from '../../../theme/tokens';

/*
  Mã lỗi máy chủ có câu giải thích riêng trong `loiNhanMua`. Mọi lỗi khác lúc gửi
  giao dịch (mạng, 5xx) đều có nghĩa "đã trả tiền nhưng chưa kích hoạt được":
  không được báo "chưa mua được" khiến người dùng mua lần hai.
*/
const MA_LOI_NGHIEP_VU = new Set([
  'SUBSCRIPTION_CONFLICT',
  'TRANSACTION_OWNED_BY_OTHER_USER',
  'WORKSPACE_OWNER_REQUIRED',
  'APPLE_IAP_DISABLED',
  'APPLE_TRANSACTION_INVALID',
]);

/* Chưa kết nối được StoreKit sau ngần này thì thôi chờ, hiện nút Thử lại. */
const CHO_KET_NOI_MS = 15_000;

type TrangThaiGia = 'dang-tai' | 'loi' | 'xong';

/**
 * Câu báo đang hiện, giữ ở dạng NGUỒN, dịch lúc vẽ để đổi ngôn ngữ giữa chừng thì
 * câu báo đổi theo. `mua` là lỗi mua gói (qua `loiNhanMua`); còn lại là câu cố định của màn.
 */
type LoiNangCap =
  | { khoa: 'khongDocGiaoDich' | 'daThanhToan' | 'chuaKhoiPhuc' | 'chuaMoQuanLy' }
  | { mua: unknown };

/**
 * Màn Nâng cấp (chỉ iOS). Mọi giá lấy từ StoreKit. Giao dịch về thì gửi máy
 * chủ xác minh, máy chủ xác nhận rồi mới `finishTransaction`: máy chủ hỏng thì
 * giữ giao dịch, StoreKit đưa lại ở lần mở màn này sau và ta gửi lại.
 *
 * Màn này gọi `useWorkspace()` nên PHẢI nằm trong nhóm `(tabs)` và được khai
 * `href: null` ở `_layout.tsx`. Đường dẫn vẫn là /account/nang-cap.
 */
export default function ManNangCap() {
  const router = useRouter();
  /* Màn ẩn của nhóm (tabs): không dùng `router.back()`, xem `useQuayLai`. */
  const quayLai = useQuayLai(useCallback(() => router.navigate('/account'), [router]));
  const t = useTuDien(tuDienNangCap);
  const { ngonNgu } = useNgonNgu();
  const { user } = useAuth();
  const { active, workspaces } = useWorkspace();
  const queryClient = useQueryClient();
  const [dangMua, setDangMua] = useState<MaGoi | null>(null);
  const [dangKichHoat, setDangKichHoat] = useState(false);
  const [dangKhoiPhuc, setDangKhoiPhuc] = useState(false);
  const [daKhoiPhuc, setDaKhoiPhuc] = useState(false);
  const [loi, setLoi] = useState<LoiNangCap | null>(null);
  const [workspaceChon, setWorkspaceChon] = useState<string | null>(null);
  const [trangThaiGia, setTrangThaiGia] = useState<TrangThaiGia>('dang-tai');

  /*
    Cùng khoá với tab Tài khoản (invalidate ['entitlements'] sau khi mua).
    Người dùng đang có gói payOS còn hạn mà mua thêm qua Apple thì Apple vẫn thu
    tiền, nhưng máy chủ trả 409 SUBSCRIPTION_CONFLICT: mất tiền hai lần. Nên khoá
    nút mua ngay từ đây.
  */
  const goiQuery = useQuery({
    queryKey: ['entitlements', active?.id],
    queryFn: () => getEntitlements(active?.id),
  });
  const goiHienTai = goiQuery.data?.subscription ?? null;
  const conGoiWeb =
    goiHienTai?.provider === 'PAYOS' && Date.parse(goiHienTai.currentPeriodEnd) > Date.now();
  /* Đang tải thì chưa biết có gói web không: khoá luôn cho chắc, chỉ vài trăm ms. */
  const khoaMua = conGoiWeb || goiQuery.isLoading;

  const cuaToi = useMemo(() => workspaceMinhLamChu(workspaces, user?.id ?? ''), [workspaces, user?.id]);
  const workspaceTeam = workspaceChon ?? cuaToi[0]?.id ?? null;

  /*
    `xuLyGiaoDich` cần `finishTransaction` của `useIAP`, nên `useIAP` phải khai
    báo trước. `onPurchaseSuccess` đi qua ref để luôn gọi bản mới nhất của hàm
    (workspace đang chọn có thể đã đổi từ lúc đăng ký).
  */
  const xuLyRef = useRef<(purchase: Purchase) => Promise<void>>(async () => undefined);
  const dangGui = useRef(new Set<string>());
  const dangMuaRef = useRef<MaGoi | null>(null);
  dangMuaRef.current = dangMua;
  /*
    Giao dịch Team phát lại mà bộ nhớ bền không ghi workspace (mua từ máy khác,
    bộ nhớ hỏng): dùng đúng workspace đang tô sáng trên màn.
  */
  const phuongAnRef = useRef<string | undefined>(undefined);
  phuongAnRef.current = workspaceTeam ?? undefined;
  const ketNoiRef = useRef(false);

  const {
    connected,
    subscriptions,
    availablePurchases,
    fetchProducts,
    reconnect,
    requestPurchase,
    finishTransaction,
    restorePurchases,
  } = useIAP({
    onPurchaseSuccess: (p) => void xuLyRef.current(p),
    onPurchaseError: (e) => {
      const sku = dangMuaRef.current;
      if (sku) void xoaWorkspaceLucMua(sku);
      setDangMua(null);
      setDaKhoiPhuc(false);
      setLoi({ mua: e });
    },
    // Không kết nối được StoreKit thì không có giá nào để hiện.
    onError: () => {
      if (!ketNoiRef.current) setTrangThaiGia('loi');
    },
    /*
      Giao dịch gửi máy chủ hỏng thì không finish; "Khôi phục mua hàng" phải đưa
      được nó lại qua `onPurchaseSuccess` dù đã giao một lần trong phiên này.
    */
    purchaseUpdatedListenerOptions: { dedupeTransactionIOS: false },
  });
  ketNoiRef.current = connected;

  xuLyRef.current = async (purchase: Purchase) => {
    const jws = purchase.purchaseToken;
    if (!jws) {
      setDangMua(null);
      setDaKhoiPhuc(false);
      setLoi({ khoa: 'khongDocGiaoDich' });
      return;
    }
    // Cùng một giao dịch về hai lần (nghe sự kiện + khôi phục) thì chỉ gửi một.
    if (dangGui.current.has(purchase.id)) return;
    dangGui.current.add(purchase.id);
    setDaKhoiPhuc(false);
    setDangKichHoat(true);
    const sku = purchase.productId;
    try {
      const workspaceId = sku.startsWith('team_')
        ? ((await docWorkspaceLucMua(sku)) ?? phuongAnRef.current)
        : undefined;
      await guiGiaoDichApple({ jws, workspaceId });
      await finishTransaction({ purchase });
      await xoaWorkspaceLucMua(sku);
      await queryClient.invalidateQueries({ queryKey: ['entitlements'] });
      setLoi(null);
    } catch (e) {
      const ma = (e as { code?: string } | null)?.code;
      if (ma === 'TRANSACTION_OWNED_BY_OTHER_USER') {
        /*
          Gói đã thuộc một tài khoản WeDo khác: gửi lại bao nhiêu lần cũng bị từ
          chối, và không ai mất gì. Finish để khỏi báo lỗi mỗi lần mở màn.
        */
        setLoi({ mua: e });
        try {
          await finishTransaction({ purchase });
          await xoaWorkspaceLucMua(sku);
        } catch {
          // Finish hỏng thì lần sau StoreKit đưa lại, ta lại báo đúng câu này.
        }
        return;
      }
      /*
        Không finish: StoreKit sẽ đưa lại giao dịch khi mở lại màn này hoặc bấm
        Khôi phục. Sai chủ workspace thì quên workspace đã ghi, để lần gửi lại
        dùng workspace người dùng chọn lại trên màn.
      */
      if (ma === 'WORKSPACE_OWNER_REQUIRED') await xoaWorkspaceLucMua(sku);
      setLoi(ma && MA_LOI_NGHIEP_VU.has(ma) ? { mua: e } : { khoa: 'daThanhToan' });
    } finally {
      dangGui.current.delete(purchase.id);
      setDangKichHoat(false);
      setDangMua(null);
    }
  };

  /*
    Lấy giá từ StoreKit. Hỏng (chưa kết nối, sản phẩm chưa duyệt, chưa ký Paid
    Apps Agreement) thì phải nói ra, không để thẻ trống không nút.
  */
  const dangTaiGia = useRef(false);
  const daTaiKhiKetNoi = useRef(false);
  const taiGia = useCallback(
    async (ketNoiLai: boolean) => {
      if (dangTaiGia.current) return;
      dangTaiGia.current = true;
      setTrangThaiGia('dang-tai');
      try {
        if (ketNoiLai && !(await reconnect())) throw new Error('chua-ket-noi');
        await fetchProducts({ skus: [...MA_GOI], type: 'subs' });
        setTrangThaiGia('xong');
      } catch {
        setTrangThaiGia('loi');
      } finally {
        dangTaiGia.current = false;
      }
    },
    [fetchProducts, reconnect],
  );

  useEffect(() => {
    if (!connected || daTaiKhiKetNoi.current) return;
    daTaiKhiKetNoi.current = true;
    void taiGia(false);
  }, [connected, taiGia]);

  useEffect(() => {
    if (connected) return;
    const hen = setTimeout(() => {
      if (!dangTaiGia.current) setTrangThaiGia((s) => (s === 'dang-tai' ? 'loi' : s));
    }, CHO_KET_NOI_MS);
    return () => clearTimeout(hen);
  }, [connected]);

  /* Tab ẩn không bao giờ gỡ: quay lại màn thì xoá câu báo của lần trước. */
  useFocusEffect(
    useCallback(() => {
      setLoi(null);
      setDaKhoiPhuc(false);
    }, []),
  );

  const the = useMemo(() => ghepTheGoi(subscriptions, ngonNgu), [subscriptions, ngonNgu]);
  const khongCoGia = the.every((g) => !g.thang && !g.nam);
  const loiGia = trangThaiGia === 'loi' || (trangThaiGia === 'xong' && khongCoGia);

  async function mua(sku: MaGoi) {
    setLoi(null);
    setDaKhoiPhuc(false);
    setDangMua(sku);
    try {
      if (sku.startsWith('team_') && workspaceTeam) await ghiWorkspaceLucMua(sku, workspaceTeam);
      const { appAccountToken } = await layAppAccountToken();
      await requestPurchase({ type: 'subs', request: { apple: { sku, appAccountToken } } });
    } catch (e) {
      void xoaWorkspaceLucMua(sku);
      setDangMua(null);
      setLoi({ mua: e });
    }
  }

  async function khoiPhuc() {
    setLoi(null);
    setDaKhoiPhuc(false);
    setDangKhoiPhuc(true);
    try {
      /*
        `restorePurchases` gọi AppStore.sync rồi phát lại các giao dịch còn hiệu
        lực qua `onPurchaseSuccess` để gửi máy chủ.
      */
      await restorePurchases({ alsoPublishToEventListenerIOS: true });
      setDaKhoiPhuc(true);
    } catch {
      setLoi({ khoa: 'chuaKhoiPhuc' });
    } finally {
      setDangKhoiPhuc(false);
    }
  }

  async function quanLy() {
    try {
      await deepLinkToSubscriptions();
    } catch {
      setLoi({ khoa: 'chuaMoQuanLy' });
    }
  }

  if (Platform.OS !== 'ios') return null;

  /* Câu lỗi đã dịch. Rỗng khi không có lỗi, hoặc khi người dùng tự huỷ (`loiNhanMua` trả rỗng). */
  const loiChu = loi ? ('khoa' in loi ? t[loi.khoa] : loiNhanMua(loi.mua, ngonNgu)) : '';

  /* Chỉ báo kết quả khôi phục khi đã có kết quả và không có lỗi nào sau đó. */
  const thongBao =
    daKhoiPhuc && !loiChu
      ? availablePurchases.length > 0
        ? t.daKiemTra
        : t.khongThayGoi
      : '';

  return (
    <View style={styles.man}>
      <GradientHeader title={t.tieuDe} onBack={quayLai} dense />
      <ScrollView style={styles.than} contentContainerStyle={styles.noiDung}>
        {conGoiWeb && goiHienTai ? (
          <View testID="chan-goi-web" style={styles.hop}>
            <Text style={styles.nhan}>
              {loiNhanMua({ code: 'SUBSCRIPTION_CONFLICT', currentPeriodEnd: goiHienTai.currentPeriodEnd }, ngonNgu)}
            </Text>
          </View>
        ) : null}
        {trangThaiGia === 'dang-tai' ? (
          <View testID="dang-tai-gia" style={styles.hop}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.chipChu}>{t.layGia}</Text>
          </View>
        ) : null}
        {loiGia ? (
          <View testID="loi-gia" style={styles.hop}>
            <Text style={styles.loi}>{t.khongLayDuocGoi}</Text>
            <Pressable testID="thu-lai-gia" accessibilityRole="button" onPress={() => void taiGia(!connected)}>
              <Text style={styles.lienKet}>{t.thuLai}</Text>
            </Pressable>
          </View>
        ) : null}
        {the.map((goi) => (
          <TheNangCap
            key={goi.plan}
            the={goi}
            dangMua={dangMua}
            khoaMua={khoaMua}
            khoaTeam={goi.plan === 'TEAM_GROWTH' && cuaToi.length === 0}
            onMua={mua}
          />
        ))}
        {cuaToi.length > 1 ? (
          <View style={styles.hop}>
            <Text style={styles.nhan}>{t.muaTeamChoWorkspace}</Text>
            {cuaToi.map((w) => (
              <Pressable
                key={w.id}
                accessibilityRole="button"
                accessibilityState={{ selected: workspaceTeam === w.id }}
                onPress={() => setWorkspaceChon(w.id)}
                style={[styles.chip, workspaceTeam === w.id && styles.chipChon]}
              >
                <Text style={styles.chipChu}>{w.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {dangKichHoat ? (
          <View style={styles.hop}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.chipChu}>{t.dangKichHoat}</Text>
          </View>
        ) : null}
        {loiChu ? <Text style={styles.loi}>{loiChu}</Text> : null}
        {thongBao ? <Text style={styles.thongBao}>{thongBao}</Text> : null}
        <Pressable
          testID="khoi-phuc"
          accessibilityRole="button"
          accessibilityState={{ disabled: dangKhoiPhuc }}
          disabled={dangKhoiPhuc}
          onPress={() => void khoiPhuc()}
        >
          <Text style={styles.lienKet}>{dangKhoiPhuc ? t.dangKhoiPhuc : t.khoiPhuc}</Text>
        </Pressable>
        <Pressable testID="quan-ly" accessibilityRole="button" onPress={() => void quanLy()}>
          <Text style={styles.lienKet}>{t.quanLy}</Text>
        </Pressable>
        <View style={styles.hangLienKet}>
          <Pressable testID="nang-cap-dieu-khoan" accessibilityRole="link" onPress={() => void openLegalLink(TERMS_URL)}>
            <Text style={styles.lienKetNho}>{t.dieuKhoan}</Text>
          </Pressable>
          <Pressable testID="nang-cap-rieng-tu" accessibilityRole="link" onPress={() => void openLegalLink(PRIVACY_URL)}>
            <Text style={styles.lienKetNho}>{t.riengTu}</Text>
          </Pressable>
        </View>
        <Text style={styles.phapLy}>{t.phapLy}</Text>
      </ScrollView>
    </View>
  );
}

function TheNangCap({
  the,
  dangMua,
  khoaMua,
  khoaTeam,
  onMua,
}: {
  the: TheGoi;
  dangMua: MaGoi | null;
  khoaMua: boolean;
  khoaTeam: boolean;
  onMua: (sku: MaGoi) => void;
}) {
  const t = useTuDien(tuDienNangCap);
  const khoa = khoaMua || khoaTeam || dangMua !== null;
  return (
    <View style={[styles.the, khoaTeam && styles.theMo]}>
      <Text style={styles.ten}>{the.ten}</Text>
      {the.quyenLoi.map((q) => (
        <Text key={q} style={styles.quyen}>
          • {q}
        </Text>
      ))}
      {khoaTeam ? <Text style={styles.ghiChu}>{t.taoWorkspaceTruoc}</Text> : null}
      <View style={styles.hangNut}>
        {[the.thang, the.nam].map((o, i) =>
          o ? (
            <Pressable
              key={o.sku}
              testID={`mua-${o.sku}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: khoa, busy: dangMua === o.sku }}
              disabled={khoa}
              onPress={() => onMua(o.sku)}
              style={[styles.nut, khoa && !khoaTeam && styles.nutMo]}
            >
              <Text style={styles.nutChu}>
                {dangMua === o.sku ? t.dangMoAppStore : t.giaTheoKy(o.gia, i !== 0)}
              </Text>
            </Pressable>
          ) : null,
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: colors.page },
  than: { flex: 1 },
  noiDung: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  the: { backgroundColor: colors.background, borderRadius: radius.xl, padding: spacing.lg, gap: 6 },
  theMo: { opacity: 0.55 },
  ten: { fontSize: fontSize.xl, fontWeight: '800', color: colors.primary },
  quyen: { fontSize: fontSize.sm, color: colors.text },
  ghiChu: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
  hangNut: { flexDirection: 'row', gap: 10, marginTop: 10 },
  nut: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' },
  nutMo: { opacity: 0.5 },
  nutChu: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
  hop: { backgroundColor: colors.background, borderRadius: radius.lg, padding: 14, gap: 8 },
  nhan: { fontWeight: '700', color: colors.text },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  chipChon: { borderWidth: 2, borderColor: colors.primary },
  chipChu: { color: colors.text },
  loi: { color: colors.danger, fontWeight: '600' },
  thongBao: { color: colors.success, fontWeight: '600' },
  lienKet: { color: colors.primary, fontWeight: '700', textAlign: 'center', paddingVertical: 8 },
  hangLienKet: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  lienKetNho: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '600', paddingVertical: 4 },
  phapLy: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: fontSize.xs * 1.4 },
});
