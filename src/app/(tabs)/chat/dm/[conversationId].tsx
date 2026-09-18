import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { MessageBubble } from '../../../../components/chat/MessageBubble';
import { EmptyChat } from '../../../../components/chat/EmptyChat';
import { ImageViewer } from '../../../../components/chat/ImageViewer';
import { MessageComposer } from '../../../../components/chat/MessageComposer';
import { ErrorBanner } from '../../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../../components/ui/GradientHeader';
import {
  getDirectMessages,
  markConversationRead,
  sendDirectFiles,
  sendDirectMessage,
} from '../../../../lib/api/direct-chat';
import type { TepChon } from '../../../../lib/api/tasks';
import { useAuth } from '../../../../lib/auth/auth-context';
import { idsHienAvatar, idsHienTen } from '../../../../lib/chat/nhom-tin';
import { useHeaderTep } from '../../../../lib/chat/use-header-tep';
import { datManDangMo, quenManDangMo } from '../../../../lib/notifications/man-dang-mo';
import { chonAnh, chupAnh } from '../../../../lib/images/pick-images';
import { colors, spacing } from '../../../../theme/tokens';

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

  const messagesQuery = useQuery({
    queryKey: ['direct-messages', conversationId],
    queryFn: () => getDirectMessages(conversationId),
    enabled: Boolean(conversationId),
  });

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
  });

  /*
    Báo cho bộ xử lý thông báo biết đang mở hội thoại nào, để tin của chính hội
    thoại này không nhảy banner đè lên thứ người dùng đang đọc.
  */
  useEffect(() => {
    if (!conversationId) return;

    datManDangMo(`dm:${conversationId}`);
    return () => quenManDangMo();
  }, [conversationId]);

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
    () =>
      [...(messagesQuery.data ?? [])]
        .reverse()
        .map((tin) => ({ ...tin, author: tin.sender ?? null })),
    [messagesQuery.data],
  );

  /*
    Tính trên danh sách theo thứ tự thời gian, TRƯỚC khi đảo — xem `idsHienAvatar`.
  */
  const nhom = useMemo(() => {
    const theoThoiGian = (messagesQuery.data ?? []).map((tin) => ({
      id: tin.id,
      nguoiGuiId: tin.senderId,
    }));

    return { avatar: idsHienAvatar(theoThoiGian), ten: idsHienTen(theoThoiGian) };
  }, [messagesQuery.data]);

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
    Lỗi gửi đứng trước lỗi tải: người dùng vừa bấm Gửi thì điều họ đang chờ là
    kết quả của cú bấm đó.

    Gửi hỏng mà không báo gì là im lặng nguy hiểm — ô soạn vẫn còn chữ, vòng
    quay tắt, và người dùng tưởng tin đã đi.
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
      <GradientHeader title={ten || 'Tin nhắn'} onBack={() => router.back()} dense />

      {/* Cùng lý do đã ghi ở màn chat dự án: bản của thư viện đọc bàn phím từ
          hệ điều hành, không qua sự kiện mà mỗi hãng báo mỗi kiểu. */}
      <KeyboardAvoidingView style={styles.than} behavior="padding" automaticOffset>
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
                // Nhấn giữ để tạo công việc là tính năng của chat dự án. Tin
                // nhắn riêng chưa có hành động nào, nhưng prop là bắt buộc.
                onLongPress={() => undefined}
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
      </KeyboardAvoidingView>

      <ImageViewer url={anhDangXem} headers={headerTep} onDong={() => setAnhDangXem(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: colors.page },
  than: { flex: 1 },
  giua: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  danhSach: { padding: spacing.md },
});
