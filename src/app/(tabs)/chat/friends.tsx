import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { FriendRow } from '../../../components/friends/FriendRow';
import { useBangThaoTac } from '../../../components/moderation/BangThaoTac';
import { PhieuBaoCao, type DoiTuongBaoCao } from '../../../components/moderation/PhieuBaoCao';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import { startConversation } from '../../../lib/api/direct-chat';
import {
  DO_DAI_TU_KHOA_TOI_THIEU,
  listFriends,
  respondToRequest,
  searchUsers,
  sendFriendRequest,
} from '../../../lib/api/friends';
import { useAuth } from '../../../lib/auth/auth-context';
import { nhomBanBe } from '../../../lib/friends/danh-sach';
import { trangThaiKetBan } from '../../../lib/friends/quan-he';
import {
  useChanNguoi,
  useNguoiDaChan,
  type NguoiCanChan,
} from '../../../lib/moderation/use-kiem-duyet';
import { useDebouncedValue } from '../../../lib/use-debounced-value';
import { colors, fontSize, lineHeight, radius, scale, scaleWithFont, spacing } from '../../../theme/tokens';

function Muc({ tieuDe, children }: { tieuDe: string; children: React.ReactNode }) {
  return (
    <View style={styles.muc}>
      <Text style={styles.mucTieuDe}>{tieuDe}</Text>
      {children}
    </View>
  );
}

export default function FriendsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [tuKhoa, setTuKhoa] = useState('');
  /*
    Chờ người dùng ngừng gõ rồi mới hỏi máy chủ. Gõ "Nguyễn Văn A" mà bắn mỗi
    ký tự một lượt là mười mấy lượt gọi, phần lớn về sau lượt cuối nên kết quả
    còn nhảy loạn trên màn hình.
  */
  const tuKhoaCho = useDebouncedValue(tuKhoa, 300);

  // Dòng đang gọi máy chủ. Khoá đúng dòng đó thôi, các dòng khác vẫn bấm được.
  const [dongDangXuLy, setDongDangXuLy] = useState<string | null>(null);

  const danhSachQuery = useQuery({
    queryKey: ['friends'],
    queryFn: listFriends,
  });

  const timQuery = useQuery({
    queryKey: ['friends-search', tuKhoaCho],
    queryFn: () => searchUsers(tuKhoaCho),
    enabled: tuKhoaCho.trim().length >= DO_DAI_TU_KHOA_TOI_THIEU,
  });

  /*
    Chặn xong là máy chủ xoá tình bạn và giấu người đó khỏi tìm kiếm, nhưng lượt
    nạp lại cần một nhịp. Lọc ngay ở đây để người vừa bị chặn biến mất tức thì.
  */
  const daChan = useNguoiDaChan();

  const nhom = useMemo(() => {
    const tatCa = nhomBanBe(
      danhSachQuery.data ?? { friends: [], incoming: [], outgoing: [] },
      user?.id ?? '',
    );
    if (daChan.size === 0) return tatCa;

    const conLai = (ds: typeof tatCa.banBe) => ds.filter((dong) => !daChan.has(dong.nguoi.id));
    return { banBe: conLai(tatCa.banBe), denMinh: conLai(tatCa.denMinh), daGui: conLai(tatCa.daGui) };
  }, [danhSachQuery.data, user?.id, daChan]);

  const [doiTuongBaoCao, setDoiTuongBaoCao] = useState<DoiTuongBaoCao | null>(null);
  const { moBang, bang: bangThaoTac } = useBangThaoTac();
  const { hoiRoiChan } = useChanNguoi();

  /* Báo cáo và Chặn cho mọi dòng người — Điều khoản sử dụng hứa có cả hai ở đây. */
  function moThaoTacNguoi(nguoi: NguoiCanChan) {
    moBang({
      tieuDe: nguoi.fullName,
      thaoTac: [
        {
          khoa: 'bao-cao',
          nhan: 'Báo cáo người này',
          onChon: () =>
            setDoiTuongBaoCao({ targetType: 'USER', targetId: nguoi.id, tenNguoi: nguoi.fullName }),
        },
        { khoa: 'chan', nhan: 'Chặn người này', nguyHiem: true, onChon: () => hoiRoiChan(nguoi) },
      ],
    });
  }

  function xongMotLuot() {
    setDongDangXuLy(null);
    void queryClient.invalidateQueries({ queryKey: ['friends'] });
    void queryClient.invalidateQueries({ queryKey: ['friends-search'] });
  }

  const guiLoiMoi = useMutation({
    mutationFn: (targetUserId: string) => sendFriendRequest(targetUserId),
    onSettled: xongMotLuot,
  });

  const traLoi = useMutation({
    mutationFn: ({ tinhBanId, dongY }: { tinhBanId: string; dongY: boolean }) =>
      respondToRequest(tinhBanId, dongY),
    onSettled: xongMotLuot,
  });

  /*
    Máy chủ tra theo `pairKey` trước khi tạo, nên bấm lại đúng người đã có hội
    thoại sẽ mở lại hội thoại cũ chứ không sinh cái trùng.
  */
  const moHoiThoai = useMutation({
    mutationFn: ({ userId }: { userId: string; hoTen: string }) => startConversation(userId),
    onSuccess: (hoiThoai, bien) => {
      void queryClient.invalidateQueries({ queryKey: ['direct-conversations'] });
      router.push(`/chat/dm/${hoiThoai.id}?ten=${encodeURIComponent(bien.hoTen)}`);
    },
    onSettled: () => setDongDangXuLy(null),
  });

  const dangTim = tuKhoaCho.trim().length >= DO_DAI_TU_KHOA_TOI_THIEU;
  const nguoiTimDuoc = (timQuery.data ?? []).filter((nguoi) => !daChan.has(nguoi.id));

  const loi =
    danhSachQuery.error instanceof Error
      ? danhSachQuery.error.message
      : guiLoiMoi.error instanceof Error
        ? guiLoiMoi.error.message
        : traLoi.error instanceof Error
          ? traLoi.error.message
          : moHoiThoai.error instanceof Error
            ? moHoiThoai.error.message
            : null;

  return (
    <View style={styles.screen}>
      <GradientHeader title="Bạn bè" onBack={() => router.back()}>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.9)" />
          <TextInput
            testID="tim-nguoi"
            accessibilityLabel="Tìm theo tên, email hoặc số điện thoại"
            value={tuKhoa}
            onChangeText={setTuKhoa}
            placeholder="Tên, email hoặc số điện thoại"
            placeholderTextColor="rgba(255,255,255,0.75)"
            style={styles.searchInput}
            spellCheck={false}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </GradientHeader>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={danhSachQuery.isRefetching}
            onRefresh={() => danhSachQuery.refetch()}
            colors={[colors.primary]}
          />
        }
      >
        {loi ? <ErrorBanner message={loi} /> : null}

        {dangTim ? (
          <Muc tieuDe="Kết quả tìm kiếm">
            {timQuery.isLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.cho} />
            ) : nguoiTimDuoc.length === 0 ? (
              <Text style={styles.trong}>
                Không tìm thấy ai khớp "{tuKhoaCho.trim()}". Thử email đầy đủ hoặc số điện thoại
                của bạn ấy.
              </Text>
            ) : (
              nguoiTimDuoc.map((nguoi) => {
                const trangThai = trangThaiKetBan(nguoi, user?.id ?? '');

                return (
                  <FriendRow
                    key={nguoi.id}
                    nguoi={nguoi}
                    trangThai={trangThai}
                    dangXuLy={dongDangXuLy === nguoi.id}
                    onGuiLoiMoi={() => {
                      setDongDangXuLy(nguoi.id);
                      guiLoiMoi.mutate(nguoi.id);
                    }}
                    onNhanTin={() => {
                      setDongDangXuLy(nguoi.id);
                      moHoiThoai.mutate({ userId: nguoi.id, hoTen: nguoi.fullName });
                    }}
                    /*
                      Lời mời của người này đang chờ mình duyệt: id lời mời nằm
                      ngay trong `friendship` máy chủ gửi kèm.
                    */
                    onDuyet={() => {
                      const tinhBanId = nguoi.friendship?.id;
                      if (!tinhBanId) return;
                      setDongDangXuLy(nguoi.id);
                      traLoi.mutate({ tinhBanId, dongY: true });
                    }}
                    onTuChoi={() => {
                      const tinhBanId = nguoi.friendship?.id;
                      if (!tinhBanId) return;
                      setDongDangXuLy(nguoi.id);
                      traLoi.mutate({ tinhBanId, dongY: false });
                    }}
                    onThem={() => moThaoTacNguoi(nguoi)}
                  />
                );
              })
            )}
          </Muc>
        ) : null}

        {danhSachQuery.isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.cho} />
        ) : (
          <>
            {nhom.denMinh.length > 0 ? (
              <Muc tieuDe={`Lời mời đang chờ bạn (${nhom.denMinh.length})`}>
                {nhom.denMinh.map((dong) => (
                  <FriendRow
                    key={dong.tinhBanId}
                    nguoi={dong.nguoi}
                    trangThai="cho-minh-duyet"
                    dangXuLy={dongDangXuLy === dong.nguoi.id}
                    onDuyet={() => {
                      setDongDangXuLy(dong.nguoi.id);
                      traLoi.mutate({ tinhBanId: dong.tinhBanId, dongY: true });
                    }}
                    onTuChoi={() => {
                      setDongDangXuLy(dong.nguoi.id);
                      traLoi.mutate({ tinhBanId: dong.tinhBanId, dongY: false });
                    }}
                    onThem={() => moThaoTacNguoi(dong.nguoi)}
                  />
                ))}
              </Muc>
            ) : null}

            <Muc tieuDe={`Bạn bè (${nhom.banBe.length})`}>
              {nhom.banBe.length === 0 ? (
                <Text style={styles.trong}>
                  Chưa có ai. Gõ tên, email hoặc số điện thoại của bạn học vào ô tìm kiếm ở trên
                  rồi bấm "Kết bạn".
                </Text>
              ) : (
                nhom.banBe.map((dong) => (
                  <FriendRow
                    key={dong.tinhBanId}
                    nguoi={dong.nguoi}
                    trangThai="la-ban"
                    dangXuLy={dongDangXuLy === dong.nguoi.id}
                    onNhanTin={() => {
                      setDongDangXuLy(dong.nguoi.id);
                      moHoiThoai.mutate({ userId: dong.nguoi.id, hoTen: dong.nguoi.fullName });
                    }}
                    onThem={() => moThaoTacNguoi(dong.nguoi)}
                  />
                ))
              )}
            </Muc>

            {nhom.daGui.length > 0 ? (
              <Muc tieuDe={`Đã gửi, đang chờ (${nhom.daGui.length})`}>
                {nhom.daGui.map((dong) => (
                  <FriendRow
                    key={dong.tinhBanId}
                    nguoi={dong.nguoi}
                    trangThai="da-gui-loi-moi"
                    onThem={() => moThaoTacNguoi(dong.nguoi)}
                  />
                ))}
              </Muc>
            ) : null}
          </>
        )}
      </ScrollView>

      {bangThaoTac}
      <PhieuBaoCao doiTuong={doiTuongBaoCao} onDong={() => setDoiTuongBaoCao(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  search: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    // Ô có chữ bên trong: `minHeight` để chữ phóng to thì ô cao theo.
    minHeight: scaleWithFont(44),
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.sm + 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.onPrimary,
    fontSize: fontSize.sm,
    paddingVertical: 0,
  },
  // Nội dung kéo lên chồng mép gradient.
  body: { flex: 1, marginTop: -spacing.md, paddingHorizontal: spacing.md },
  list: { paddingTop: spacing.md, paddingBottom: spacing.xl },
  muc: { marginBottom: spacing.lg },
  mucTieuDe: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  cho: { marginTop: scale(24) },
  trong: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: lineHeight.sm,
    paddingVertical: spacing.sm,
  },
});
