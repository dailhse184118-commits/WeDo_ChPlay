import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';

import { MessageBubble } from '../../../../components/chat/MessageBubble';
import { EmptyChat } from '../../../../components/chat/EmptyChat';
import { ImageViewer } from '../../../../components/chat/ImageViewer';
import { MessageComposer } from '../../../../components/chat/MessageComposer';
import { useBangThaoTac } from '../../../../components/moderation/BangThaoTac';
import { PhieuBaoCao, type DoiTuongBaoCao } from '../../../../components/moderation/PhieuBaoCao';
import { ErrorBanner } from '../../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../../components/ui/GradientHeader';
import {
  getDirectMessages,
  listConversations,
  markConversationRead,
  sendDirectFiles,
  sendDirectMessage,
} from '../../../../lib/api/direct-chat';
import type { TepChon } from '../../../../lib/api/tasks';
import { useAuth } from '../../../../lib/auth/auth-context';
import { doiPhuong } from '../../../../lib/chat/doi-phuong';
import { idsHienAvatar, idsHienTen } from '../../../../lib/chat/nhom-tin';
import { useHeaderTep } from '../../../../lib/chat/use-header-tep';
import { locTinNguoiDaChan } from '../../../../lib/moderation/loc-chan';
import { useChanNguoi, useNguoiDaChan } from '../../../../lib/moderation/use-kiem-duyet';
import { datManDangMo, quenManDangMo } from '../../../../lib/notifications/man-dang-mo';
import { baoLoi, moTaTep } from '../../../../lib/observability/sentry';
import { chonAnh, chupAnh } from '../../../../lib/images/pick-images';
import type { DirectMessage, UserSummary } from '../../../../lib/types';
import { colors, radius, scale, spacing } from '../../../../theme/tokens';

const GOC_MAY_CHU = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export default function ManTinNhanRieng() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { conversationId, ten } = useLocalSearchParams<{
    conversationId: string;
    ten?: string;
  }>();

  // MessageComposer là controlled component, màn hình phải tự giữ nội dung đang soạn.
  const [noiDung, setNoiDung] = useState('');
  const [anhChoGui, setAnhChoGui] = useState<TepChon[]>([]);
  const [anhDangXem, setAnhDangXem] = useState<string | null>(null);
  /** Lỗi từ máy ảnh hoặc thư viện ảnh — không phải lỗi máy chủ nên để riêng. */
  const [loiChonAnh, setLoiChonAnh] = useState('');

  const headerTep = useHeaderTep();

  /*
    ĐỪNG đổi lại thành `KeyboardAvoidingView`. Đây là lần vá thứ tư cùng một chỗ.

    `KeyboardAvoidingView` tính đệm bằng `frame.y + frame.height - keyboardY`,
    trong đó `frame` là vị trí CỦA CHÍNH NÓ trên màn hình, đo một lần lúc
    `onLayout` rồi chốt luôn.

    Màn chat dự án gắn nó SAU khi tải xong dữ liệu, tức sau khi hiệu ứng trượt
    vào màn đã kết thúc, nên đo trúng. Màn này gắn ngay lúc mở, giữa lúc màn
    hình còn đang trượt — nó chốt một con số sai và không bao giờ đo lại. Đó là
    lý do chỉ màn này bị che ô nhập, còn chat dự án thì không.

    `useReanimatedKeyboardAnimation` đưa thẳng chiều cao bàn phím do hệ điều
    hành báo (`height` âm khi bàn phím mở), không đo đạc gì, nên không có gì để
    đo sai.
  */
  const banPhim = useReanimatedKeyboardAnimation();
  const kieuTruThem = useAnimatedStyle(() => ({ paddingBottom: -banPhim.height.value }));

  const messagesQuery = useQuery({
    queryKey: ['direct-messages', conversationId],
    queryFn: () => getDirectMessages(conversationId),
    enabled: Boolean(conversationId),
  });

  /*
    Người kia trong hội thoại. Báo cáo và chặn cần id của họ, mà tham số đường
    dẫn chỉ mang tên. Đọc từ danh sách hội thoại — thường đã nằm sẵn trong cache
    vì người dùng vừa bấm vào từ đó — và lùi về người gửi tin khi danh sách chưa
    về kịp (mở thẳng từ thông báo chẳng hạn).
  */
  const hoiThoaiQuery = useQuery({
    queryKey: ['direct-conversations'],
    queryFn: listConversations,
    enabled: Boolean(conversationId),
  });

  const nguoiKia = useMemo<UserSummary | null>(() => {
    const hoiThoai = hoiThoaiQuery.data?.find((item) => item.id === conversationId);
    const tuDanhSach = hoiThoai && user?.id ? doiPhuong(hoiThoai, user.id) : null;
    if (tuDanhSach) return tuDanhSach;

    const tinCuaHo = messagesQuery.data?.find((tin) => tin.senderId !== user?.id && tin.sender);
    return tinCuaHo?.sender ?? null;
  }, [hoiThoaiQuery.data, messagesQuery.data, conversationId, user?.id]);

  /*
    Tin của người mình đã chặn. Máy chủ đã bỏ chúng khỏi lượt GET, nhưng vừa
    chặn xong thì cache vẫn còn bản cũ — lọc ở đây để chúng biến mất ngay.
  */
  const daChan = useNguoiDaChan();
  const tinHien = useMemo(
    () => locTinNguoiDaChan(messagesQuery.data ?? [], daChan, (tin) => tin.senderId),
    [messagesQuery.data, daChan],
  );

  const [doiTuongBaoCao, setDoiTuongBaoCao] = useState<DoiTuongBaoCao | null>(null);
  const { moBang, bang: bangThaoTac } = useBangThaoTac();
  const { hoiRoiChan } = useChanNguoi();

  /*
    Chặn xong thì rời hội thoại: nó biến khỏi danh sách Tin nhắn, tin của người
    kia bị ẩn, và gửi thêm cũng bị máy chủ từ chối — ở lại chỉ thấy một màn trống.
  */
  const chan = useCallback(
    (nguoi: UserSummary) => hoiRoiChan(nguoi, () => router.back()),
    [hoiRoiChan, router],
  );

  function moThaoTacHoiThoai() {
    if (!nguoiKia) return;

    moBang({
      tieuDe: nguoiKia.fullName,
      thaoTac: [
        {
          khoa: 'bao-cao-nguoi',
          nhan: 'Báo cáo người này',
          onChon: () =>
            setDoiTuongBaoCao({
              targetType: 'USER',
              targetId: nguoiKia.id,
              tenNguoi: nguoiKia.fullName,
            }),
        },
        { khoa: 'chan', nhan: 'Chặn người này', nguyHiem: true, onChon: () => chan(nguoiKia) },
      ],
    });
  }

  /* Tin của chính mình thì không có gì để báo cáo hay chặn. */
  function moThaoTacTin(tin: DirectMessage) {
    if (!tin.senderId || tin.senderId === user?.id) return;

    const nguoiGui: UserSummary | null = tin.sender
      ? { ...tin.sender, id: tin.senderId }
      : nguoiKia;

    moBang({
      thaoTac: [
        {
          khoa: 'bao-cao',
          nhan: 'Báo cáo tin nhắn',
          onChon: () =>
            setDoiTuongBaoCao({
              targetType: 'DIRECT_MESSAGE',
              targetId: tin.id,
              tenNguoi: nguoiGui?.fullName,
            }),
        },
        ...(nguoiGui
          ? [
              {
                khoa: 'chan',
                nhan: 'Chặn người này',
                nguyHiem: true,
                onChon: () => chan(nguoiGui),
              },
            ]
          : []),
      ],
    });
  }

  function xongMotLuotGui() {
    // Xoá ô soạn SAU khi máy chủ nhận. Xoá trước mà mạng hỏng thì người dùng
    // mất luôn câu vừa gõ và không có cách nào lấy lại.
    setNoiDung('');
    setAnhChoGui([]);
    void queryClient.invalidateQueries({ queryKey: ['direct-messages', conversationId] });
    void queryClient.invalidateQueries({ queryKey: ['direct-conversations'] });
  }

  const guiMutation = useMutation({
    mutationFn: (content: string) => sendDirectMessage(conversationId, content),
    onSuccess: xongMotLuotGui,
  });

  const guiAnhMutation = useMutation({
    mutationFn: ({ files, content }: { files: TepChon[]; content: string }) =>
      sendDirectFiles(conversationId, files, content),
    onSuccess: xongMotLuotGui,
    /*
      Bao ve Sentry, neu khong cau loi that bien mat sau bang do "Khong the ket
      noi may chu" ma nguoi dung nhin thay. Nguoi kiem thu bao khong gui duoc
      anh ngay 19/09 va khong ai biet vi sao — vi dung cho nay nuot loi.
    */
    onError: (loi, bien) =>
      baoLoi(loi, 'gui-anh-tin-nhan-rieng', {
        soTep: bien.files.length,
        tep: bien.files.map(moTaTep),
        coChuThich: bien.content.trim().length > 0,
      }),
  });

  /*
    Báo cho bộ xử lý thông báo biết đang mở hội thoại nào, để tin của chính hội
    thoại này không nhảy banner đè lên thứ người dùng đang đọc.

    Theo FOCUS, không theo lần gắn màn: màn này là tab ẩn, sống suốt phiên. Theo
    lần gắn thì rời đi rồi banner của hội thoại này vẫn bị chặn, còn quay lại thì
    khoá đã bị màn khác xoá mà không được đặt lại.
  */
  useFocusEffect(
    useCallback(() => {
      if (!conversationId) return;

      const khoa = `dm:${conversationId}`;
      datManDangMo(khoa);
      // Chỉ xoá khoá của chính mình — khung chat khác có thể đã kịp đặt khoá của nó.
      return () => quenManDangMo(khoa);
    }, [conversationId]),
  );

  /*
    Đánh dấu đã đọc khi mở, và mỗi lần có tin mới về trong lúc màn đang mở.
    Không làm thì huy hiệu chưa đọc vẫn sáng dù người dùng đang nhìn thẳng vào
    tin nhắn đó.
  */
  const soTin = messagesQuery.data?.length ?? 0;
  useEffect(() => {
    if (!conversationId || soTin === 0) return;

    void markConversationRead(conversationId)
      .then(() => queryClient.invalidateQueries({ queryKey: ['direct-conversations'] }))
      // Đánh dấu đã đọc hỏng không đáng làm phiền người dùng: họ vẫn đọc được
      // tin nhắn, và lượt mở sau sẽ thử lại.
      .catch(() => undefined);
  }, [conversationId, soTin, queryClient]);

  /*
    Đảo ngược để `inverted` của FlatList neo ở tin mới nhất, và đổi `sender`
    thành `author` — tên mà MessageBubble đọc. Chat dự án gọi người gửi là
    `author`, tin nhắn riêng gọi là `sender`; đó là hình dạng máy chủ trả về.
  */
  const duLieu = useMemo(
    () => [...tinHien].reverse().map((tin) => ({ ...tin, author: tin.sender ?? null })),
    [tinHien],
  );

  /*
    Tính trên danh sách theo thứ tự thời gian, TRƯỚC khi đảo — xem `idsHienAvatar`.
  */
  const nhom = useMemo(() => {
    const theoThoiGian = tinHien.map((tin) => ({
      id: tin.id,
      nguoiGuiId: tin.senderId,
    }));

    return { avatar: idsHienAvatar(theoThoiGian), ten: idsHienTen(theoThoiGian) };
  }, [tinHien]);

  async function nhanAnh(lay: () => Promise<TepChon[]>) {
    setLoiChonAnh('');
    try {
      const them = await lay();
      if (them.length === 0) return;

      setAnhChoGui((hienCo) => [...hienCo, ...them]);
    } catch (loi) {
      setLoiChonAnh(loi instanceof Error ? loi.message : 'Không mở được ảnh.');
    }
  }

  function gui() {
    if (anhChoGui.length > 0) {
      guiAnhMutation.mutate({ files: anhChoGui, content: noiDung });
      return;
    }

    guiMutation.mutate(noiDung.trim());
  }

  const dangGui = guiMutation.isPending || guiAnhMutation.isPending;

  /*
    Màn này là tab ẩn, sống suốt phiên: mở hội thoại khác vẫn là CÙNG một màn.
    Lỗi gửi của hội thoại trước — nhất là câu "không thể nhắn tin" sau khi chặn
    — không được nằm lại trên hội thoại sau, và phiếu báo cáo cũng phải đóng.
  */
  const { reset: xoaLoiGui } = guiMutation;
  const { reset: xoaLoiGuiAnh } = guiAnhMutation;
  useEffect(() => {
    xoaLoiGui();
    xoaLoiGuiAnh();
    setDoiTuongBaoCao(null);
  }, [conversationId, xoaLoiGui, xoaLoiGuiAnh]);

  /*
    Lỗi gửi đứng trước lỗi tải: người dùng vừa bấm Gửi thì điều họ đang chờ là
    kết quả của cú bấm đó.

    Gửi hỏng mà không báo gì là im lặng nguy hiểm — ô soạn vẫn còn chữ, vòng
    quay tắt, và người dùng tưởng tin đã đi.

    Một trong hai người đã chặn người kia thì máy chủ trả 403 mã `BLOCKED` kèm
    câu tiếng Việt sẵn ("Bạn không thể nhắn tin cho người này."). Nó đi đúng
    đường này và hiện nguyên văn — đừng thay bằng câu lỗi chung, người dùng cần
    biết đây không phải lỗi mạng để khỏi bấm gửi lại mãi.
  */
  const loiGui = guiMutation.error ?? guiAnhMutation.error;
  const loi =
    loiChonAnh ||
    (loiGui instanceof Error
      ? loiGui.message
      : messagesQuery.isError && !messagesQuery.data
        ? messagesQuery.error instanceof Error
          ? messagesQuery.error.message
          : 'Không tải được tin nhắn.'
        : '');

  return (
    <View style={styles.man}>
      <GradientHeader
        title={ten || nguoiKia?.fullName || 'Tin nhắn'}
        onBack={() => router.back()}
        dense
        right={
          nguoiKia ? (
            <Pressable
              testID="dm-thao-tac"
              accessibilityRole="button"
              accessibilityLabel={`Thao tác với ${nguoiKia.fullName}`}
              onPress={moThaoTacHoiThoai}
              hitSlop={8}
              style={styles.nutThem}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.onPrimary} />
            </Pressable>
          ) : undefined
        }
      />

      <Reanimated.View style={[styles.than, kieuTruThem]}>
        {loi ? <ErrorBanner message={loi} /> : null}

        {messagesQuery.isLoading && !messagesQuery.data ? (
          <View style={styles.giua}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={duLieu}
            inverted
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.danhSach}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyChat
                title="Chưa có tin nhắn nào"
                body="Gửi lời chào để bắt đầu cuộc trò chuyện."
              />
            }
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isMine={item.senderId === user?.id}
                hienAvatar={nhom.avatar.has(item.id)}
                hienTen={nhom.ten.has(item.id)}
                goc={GOC_MAY_CHU}
                headers={headerTep}
                onXemAnh={setAnhDangXem}
                // Tạo công việc bằng AI là tính năng của chat dự án. Ở đây nhấn
                // giữ chỉ có Báo cáo và Chặn.
                onLongPress={() => moThaoTacTin(item)}
              />
            )}
          />
        )}

        <MessageComposer
          value={noiDung}
          onChangeText={setNoiDung}
          onSend={gui}
          sending={dangGui}
          anhDaChon={anhChoGui}
          onChup={() => void nhanAnh(chupAnh)}
          onChonAnh={() => void nhanAnh(chonAnh)}
          onBoAnh={(viTri) => setAnhChoGui((hienCo) => hienCo.filter((_, i) => i !== viTri))}
        />
      </Reanimated.View>

      <ImageViewer url={anhDangXem} headers={headerTep} onDong={() => setAnhDangXem(null)} />

      {bangThaoTac}
      <PhieuBaoCao doiTuong={doiTuongBaoCao} onDong={() => setDoiTuongBaoCao(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: colors.page },
  than: { flex: 1 },
  giua: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  danhSach: { padding: spacing.md },
  nutThem: {
    width: scale(40),
    height: scale(40),
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
