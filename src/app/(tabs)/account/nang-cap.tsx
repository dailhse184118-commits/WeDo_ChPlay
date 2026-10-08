import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { deepLinkToSubscriptions, useIAP, type Purchase } from 'expo-iap';

import { GradientHeader } from '../../../components/ui/GradientHeader';
import { guiGiaoDichApple, layAppAccountToken } from '../../../lib/api/apple-iap';
import { useAuth } from '../../../lib/auth/auth-context';
import { ghepTheGoi, loiNhanMua, MA_GOI, workspaceMinhLamChu, type MaGoi, type TheGoi } from '../../../lib/payments/mua-goi';
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
]);

/**
 * Màn Nâng cấp (chỉ iOS). Mọi giá lấy từ StoreKit. Giao dịch về thì gửi máy
 * chủ xác minh, máy chủ xác nhận rồi mới `finishTransaction`: máy chủ hỏng thì
 * giữ giao dịch, StoreKit đưa lại ở lần mở sau và ta gửi lại.
 *
 * Màn này gọi `useWorkspace()` nên PHẢI nằm trong nhóm `(tabs)` và được khai
 * `href: null` ở `_layout.tsx`. Đường dẫn vẫn là /account/nang-cap.
 */
export default function ManNangCap() {
  const router = useRouter();
  /* Màn ẩn của nhóm (tabs): không dùng `router.back()`, xem `useQuayLai`. */
  const quayLai = useQuayLai(useCallback(() => router.navigate('/account'), [router]));
  const { user } = useAuth();
  const { workspaces } = useWorkspace();
  const queryClient = useQueryClient();
  const [dangMua, setDangMua] = useState<MaGoi | null>(null);
  const [dangKichHoat, setDangKichHoat] = useState(false);
  const [loi, setLoi] = useState('');
  const [thongBao, setThongBao] = useState('');
  const [workspaceChon, setWorkspaceChon] = useState<string | null>(null);

  const cuaToi = useMemo(() => workspaceMinhLamChu(workspaces, user?.id ?? ''), [workspaces, user?.id]);
  const workspaceTeam = workspaceChon ?? cuaToi[0]?.id ?? null;

  /*
    `xuLyGiaoDich` cần `finishTransaction` của `useIAP`, nên `useIAP` phải khai
    báo trước. `onPurchaseSuccess` đi qua ref để luôn gọi bản mới nhất của hàm
    (workspace đang chọn có thể đã đổi từ lúc đăng ký).
  */
  const xuLyRef = useRef<(purchase: Purchase) => Promise<void>>(async () => undefined);
  const dangGui = useRef(new Set<string>());

  const { connected, subscriptions, fetchProducts, requestPurchase, finishTransaction, getAvailablePurchases } = useIAP({
    onPurchaseSuccess: (p) => void xuLyRef.current(p),
    onPurchaseError: (e) => {
      setDangMua(null);
      setLoi(loiNhanMua(e));
    },
    /*
      Giao dịch gửi máy chủ hỏng thì không finish; "Khôi phục mua hàng" phải đưa
      được nó lại qua `onPurchaseSuccess` dù đã giao một lần trong phiên này.
    */
    purchaseUpdatedListenerOptions: { dedupeTransactionIOS: false },
  });

  xuLyRef.current = async (purchase: Purchase) => {
    const jws = purchase.purchaseToken;
    if (!jws) return;
    // Cùng một giao dịch về hai lần (nghe sự kiện + khôi phục) thì chỉ gửi một.
    if (dangGui.current.has(purchase.id)) return;
    dangGui.current.add(purchase.id);
    setDangKichHoat(true);
    try {
      const laTeam = purchase.productId.startsWith('team_');
      await guiGiaoDichApple({ jws, workspaceId: laTeam ? (workspaceTeam ?? undefined) : undefined });
      await finishTransaction({ purchase });
      await queryClient.invalidateQueries({ queryKey: ['entitlements'] });
      setLoi('');
    } catch (e) {
      // Không finish: StoreKit sẽ đưa lại giao dịch, ta gửi lại lần mở sau.
      const ma = (e as { code?: string } | null)?.code;
      setLoi(
        ma && MA_LOI_NGHIEP_VU.has(ma)
          ? loiNhanMua(e)
          : 'Đã thanh toán, đang kích hoạt gói… Mở lại app nếu chưa thấy gói.',
      );
    } finally {
      dangGui.current.delete(purchase.id);
      setDangKichHoat(false);
      setDangMua(null);
    }
  };

  useEffect(() => {
    if (connected) void fetchProducts({ skus: [...MA_GOI], type: 'subs' });
  }, [connected, fetchProducts]);

  const the = useMemo(() => ghepTheGoi(subscriptions), [subscriptions]);

  async function mua(sku: MaGoi) {
    setLoi('');
    setDangMua(sku);
    try {
      const { appAccountToken } = await layAppAccountToken();
      await requestPurchase({ type: 'subs', request: { apple: { sku, appAccountToken } } });
    } catch (e) {
      setDangMua(null);
      setLoi(loiNhanMua(e));
    }
  }

  async function khoiPhuc() {
    setLoi('');
    setThongBao('');
    try {
      // Phát lại các giao dịch còn hiệu lực qua `onPurchaseSuccess` để gửi máy chủ.
      await getAvailablePurchases({ alsoPublishToEventListenerIOS: true });
      setThongBao('Đã kiểm tra các gói đã mua.');
    } catch {
      setLoi('Chưa khôi phục được. Bạn thử lại sau nhé.');
    }
  }

  if (Platform.OS !== 'ios') return null;

  return (
    <View style={styles.man}>
      <GradientHeader title="Nâng cấp" onBack={quayLai} dense />
      <ScrollView style={styles.than} contentContainerStyle={styles.noiDung}>
        {the.map((t) => (
          <TheNangCap
            key={t.plan}
            the={t}
            dangMua={dangMua}
            khoaTeam={t.plan === 'TEAM_GROWTH' && cuaToi.length === 0}
            onMua={mua}
          />
        ))}
        {cuaToi.length > 1 ? (
          <View style={styles.hop}>
            <Text style={styles.nhan}>Mua Team Growth cho workspace</Text>
            {cuaToi.map((w) => (
              <Pressable
                key={w.id}
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
            <Text style={styles.chipChu}>Đã thanh toán, đang kích hoạt gói…</Text>
          </View>
        ) : null}
        {loi ? <Text style={styles.loi}>{loi}</Text> : null}
        {thongBao ? <Text style={styles.thongBao}>{thongBao}</Text> : null}
        <Pressable testID="khoi-phuc" onPress={() => void khoiPhuc()}>
          <Text style={styles.lienKet}>Khôi phục mua hàng</Text>
        </Pressable>
        <Pressable testID="quan-ly" onPress={() => void deepLinkToSubscriptions()}>
          <Text style={styles.lienKet}>Quản lý đăng ký</Text>
        </Pressable>
        <Text style={styles.phapLy}>
          Gói tự gia hạn theo kỳ đã chọn và tính vào tài khoản Apple ID của bạn, trừ khi bạn huỷ ít nhất 24 giờ trước
          khi hết kỳ. Quản lý và huỷ trong Cài đặt → Apple ID → Đăng ký.
        </Text>
      </ScrollView>
    </View>
  );
}

function TheNangCap({
  the,
  dangMua,
  khoaTeam,
  onMua,
}: {
  the: TheGoi;
  dangMua: MaGoi | null;
  khoaTeam: boolean;
  onMua: (sku: MaGoi) => void;
}) {
  return (
    <View style={[styles.the, khoaTeam && styles.theMo]}>
      <Text style={styles.ten}>{the.ten}</Text>
      {the.quyenLoi.map((q) => (
        <Text key={q} style={styles.quyen}>
          • {q}
        </Text>
      ))}
      {khoaTeam ? <Text style={styles.ghiChu}>Tạo workspace rồi mới mua Team Growth.</Text> : null}
      <View style={styles.hangNut}>
        {[the.thang, the.nam].map((o, i) =>
          o ? (
            <Pressable
              key={o.sku}
              testID={`mua-${o.sku}`}
              disabled={khoaTeam || dangMua !== null}
              onPress={() => onMua(o.sku)}
              style={styles.nut}
            >
              <Text style={styles.nutChu}>
                {dangMua === o.sku ? 'Đang mở App Store…' : `${o.gia} / ${i === 0 ? 'tháng' : 'năm'}`}
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
  nutChu: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
  hop: { backgroundColor: colors.background, borderRadius: radius.lg, padding: 14, gap: 8 },
  nhan: { fontWeight: '700', color: colors.text },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  chipChon: { borderWidth: 2, borderColor: colors.primary },
  chipChu: { color: colors.text },
  loi: { color: colors.danger, fontWeight: '600' },
  thongBao: { color: colors.success, fontWeight: '600' },
  lienKet: { color: colors.primary, fontWeight: '700', textAlign: 'center', paddingVertical: 8 },
  phapLy: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: fontSize.xs * 1.4 },
});
