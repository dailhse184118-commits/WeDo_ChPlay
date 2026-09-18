import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { MessageBubble } from '../../../../components/chat/MessageBubble';
import { MessageComposer } from '../../../../components/chat/MessageComposer';
import { ErrorBanner } from '../../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../../components/ui/GradientHeader';
import {
  getDirectMessages,
  markConversationRead,
  sendDirectMessage,
} from '../../../../lib/api/direct-chat';
import { useAuth } from '../../../../lib/auth/auth-context';
import { colors, spacing } from '../../../../theme/tokens';

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

  const messagesQuery = useQuery({
    queryKey: ['direct-messages', conversationId],
    queryFn: () => getDirectMessages(conversationId),
    enabled: Boolean(conversationId),
  });

  const guiMutation = useMutation({
    mutationFn: (content: string) => sendDirectMessage(conversationId, content),
    onSuccess: () => {
      // Xoá ô soạn SAU khi máy chủ nhận. Xoá trước mà mạng hỏng thì người dùng
      // mất luôn câu vừa gõ và không có cách nào lấy lại.
      setNoiDung('');
      void queryClient.invalidateQueries({ queryKey: ['direct-messages', conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['direct-conversations'] });
    },
  });

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

  const loi =
    messagesQuery.isError && !messagesQuery.data
      ? messagesQuery.error instanceof Error
        ? messagesQuery.error.message
        : 'Không tải được tin nhắn.'
      : '';

  return (
    <View style={styles.man}>
      <GradientHeader title={ten || 'Tin nhắn'} onBack={() => router.back()} dense />

      {/*
        `behavior="padding"` cho CẢ Android, giống màn chat dự án. Từ khi bật
        `edgeToEdgeEnabled`, Android không tự thu cửa sổ nữa và ô soạn tin nằm
        khuất hẳn sau bàn phím.

        Không cần `keyboardVerticalOffset`: thanh tab đã bị ẩn ở màn này (khai
        trong (tabs)/_layout.tsx) nên dưới ô soạn tin không còn gì chen vào.
      */}
      <KeyboardAvoidingView style={styles.than} behavior="padding">
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
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isMine={item.senderId === user?.id}
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
          onSend={() => guiMutation.mutate(noiDung.trim())}
          sending={guiMutation.isPending}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: colors.page },
  than: { flex: 1 },
  giua: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  danhSach: { padding: spacing.md },
});
