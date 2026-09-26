import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '../ui/Avatar';
import { tapFeedback } from '../../lib/haptics';
import { duongDanTepDinhKem, laAnh } from '../../lib/chat/tep-dinh-kem';
import type { ChatAttachment, UserSummary } from '../../lib/types';
import { colors, fontSize, gradients, lineHeight, radius, scale, shadows, spacing } from '../../theme/tokens';

/** Đường kính avatar cạnh bong bóng. Cũng là bề rộng chỗ chừa khi giữa chuỗi. */
const CO_AVATAR = scale(30);

/** Cạnh của một ô ảnh đính kèm trong bong bóng. */
const CO_ANH = scale(180);

/**
 * Hình dạng tối thiểu mà bong bóng thật sự đọc tới.
 *
 * Trước đây nhận thẳng `ChatMessage`, nên không dựng được tin nhắn riêng — thứ
 * không có `projectId` lẫn `workspaceId`, và gọi người gửi là `sender`.
 * Component chưa bao giờ đụng tới những trường ấy; bắt buộc phải có chúng chỉ
 * là ràng buộc thừa.
 *
 * `ChatMessage` thoả kiểu này về mặt cấu trúc, nên mọi chỗ gọi cũ không phải
 * sửa một dòng nào.
 */
export interface BongBongMessage {
  id: string;
  content: string;
  createdAt: string;
  deletedAt?: string | null;
  author?: UserSummary | null;
  task?: { title: string } | null;
  attachments?: ChatAttachment[];
}

interface MessageBubbleProps {
  message: BongBongMessage;
  isMine: boolean;
  isPending?: boolean;
  isFailed?: boolean;
  /**
   * Tin cuối trong chuỗi tin liên tiếp của cùng một người. Chỉ tin đó đeo
   * avatar; các tin trên chừa đúng chỗ trống để bong bóng không lệch bậc thang.
   */
  hienAvatar?: boolean;
  /** Tin đầu chuỗi. Chỉ tin đó có tên người gửi phía trên bong bóng. */
  hienTen?: boolean;
  /** Gốc máy chủ để ghép với đường dẫn tương đối của tệp đính kèm. */
  goc?: string;
  /**
   * Header xác thực để tải ảnh. Đường tải tệp nằm sau `JwtAuthGuard`, thiếu
   * header thì máy chủ trả 401 và ảnh thành ô trống — xem `useHeaderTep`.
   */
  headers?: Record<string, string>;
  onLongPress: () => void;
  onRetry?: () => void;
  onXemAnh?: (url: string) => void;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function MessageBubble({
  message,
  isMine,
  isPending = false,
  isFailed = false,
  hienAvatar = true,
  hienTen = true,
  goc = '',
  headers,
  onLongPress,
  onRetry,
  onXemAnh,
}: MessageBubbleProps) {
  const recalled = Boolean(message.deletedAt);
  const dinhKem = recalled ? [] : message.attachments ?? [];

  const handleLongPress = () => {
    if (recalled) return;
    // Rung nhẹ khi nhấn giữ. tapFeedback không bao giờ ném lỗi nên thiếu mô-tơ rung
    // hay thiếu module native cũng không chặn được bảng thao tác.
    void tapFeedback();
    onLongPress();
  };

  return (
    <View style={[styles.hang, isMine ? styles.hangMine : styles.hangTheirs]}>
      {/*
        Chỗ của avatar luôn được giữ, kể cả khi không vẽ gì vào đó: bỏ hẳn thì
        các bong bóng trong cùng một chuỗi lệch nhau theo bậc thang.
      */}
      {!isMine ? (
        hienAvatar ? (
          <Avatar
            testID={`message-avatar-${message.id}`}
            hoTen={message.author?.fullName ?? ''}
            anhUrl={message.author?.avatarUrl}
            co={CO_AVATAR}
          />
        ) : (
          <View testID={`message-avatar-cho-trong-${message.id}`} style={styles.choTrong} />
        )
      ) : null}

      <View style={[styles.wrapper, isMine ? styles.wrapperMine : styles.wrapperTheirs]}>
        {!isMine && hienTen && message.author ? (
          <Text style={styles.author}>{message.author.fullName}</Text>
        ) : null}

        <Pressable
          testID={`message-${message.id}`}
          accessibilityRole="button"
          accessibilityHint={recalled ? undefined : 'Nhấn giữ để xem thao tác với tin nhắn này'}
          onLongPress={handleLongPress}
          delayLongPress={350}
          style={[
            styles.bubble,
            isMine
              ? { ...styles.bubbleMine, experimental_backgroundImage: gradients.header }
              : styles.bubbleTheirs,
            isPending ? styles.bubblePending : null,
            isFailed ? styles.bubbleFailed : null,
          ]}
        >
          {recalled ? (
            <Text style={[styles.recalled, isMine ? styles.recalledMine : null]}>
              Tin nhắn đã được thu hồi
            </Text>
          ) : null}

          {dinhKem.length > 0 ? (
            <View style={styles.oDinhKem}>
              {dinhKem.map((tep) =>
                laAnh(tep) ? (
                  <Pressable
                    key={tep.id}
                    testID={`dinh-kem-anh-${tep.id}`}
                    accessibilityRole="imagebutton"
                    accessibilityLabel={`Ảnh ${tep.originalName}`}
                    onPress={() => onXemAnh?.(duongDanTepDinhKem(tep, goc))}
                  >
                    <Image
                      source={{ uri: duongDanTepDinhKem(tep, goc), headers }}
                      style={styles.anh}
                      contentFit="cover"
                      transition={120}
                    />
                  </Pressable>
                ) : (
                  <View key={tep.id} style={styles.theTep}>
                    <Ionicons name="document-outline" size={18} color={colors.primary} />
                    <Text
                      style={[styles.tenTep, isMine ? styles.tenTepMine : null]}
                      numberOfLines={2}
                    >
                      {tep.originalName}
                    </Text>
                  </View>
                ),
              )}
            </View>
          ) : null}

          {/*
            Tin chỉ có ảnh thì `content` rỗng. Dựng một `<Text>` rỗng cho ra một
            dòng trắng chen giữa ảnh và giờ.
          */}
          {!recalled && message.content ? (
            <Text
              testID={`message-content-${message.id}`}
              style={[
                styles.content,
                isMine ? styles.contentMine : null,
                dinhKem.length > 0 ? styles.contentDuoiAnh : null,
              ]}
            >
              {message.content}
            </Text>
          ) : null}

          {message.task ? (
            <View style={styles.taskStrip}>
              <View style={styles.taskTick}>
                <Ionicons name="checkmark" size={14} color={colors.primary} />
              </View>
              <View style={styles.taskBody}>
                <Text style={styles.taskLabel}>Đã tạo công việc</Text>
                <Text style={styles.taskTitle} numberOfLines={3}>
                  {message.task.title}
                </Text>
              </View>
            </View>
          ) : null}

          <Text style={[styles.time, isMine ? styles.timeMine : null]}>
            {isPending ? 'Đang gửi…' : formatTime(message.createdAt)}
          </Text>
        </Pressable>

        {isFailed && onRetry ? (
          <Pressable testID={`retry-${message.id}`} onPress={onRetry} style={styles.retry}>
            <Text style={styles.retryText}>Gửi lại</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hang: {
    flexDirection: 'row',
    // Neo đáy: avatar đứng ngang dòng cuối của bong bóng, không phải dòng đầu.
    alignItems: 'flex-end',
    gap: spacing.xs,
    marginVertical: spacing.xs,
    maxWidth: '92%',
  },
  hangMine: { alignSelf: 'flex-end' },
  hangTheirs: { alignSelf: 'flex-start' },
  choTrong: { width: CO_AVATAR },
  // `flexShrink` để bong bóng co lại nhường chỗ avatar thay vì tràn ra ngoài.
  wrapper: { flexShrink: 1 },
  wrapperMine: { alignItems: 'flex-end' },
  wrapperTheirs: { alignItems: 'flex-start' },
  author: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginLeft: spacing.sm + 4,
  },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  // Một góc bo nhỏ để bong bóng "trỏ" về phía người gửi.
  bubbleMine: { borderBottomRightRadius: radius.sm, backgroundColor: colors.primary },
  bubbleTheirs: {
    borderBottomLeftRadius: radius.sm,
    backgroundColor: colors.background,
    boxShadow: shadows.bubble,
  },
  bubblePending: { opacity: 0.6 },
  bubbleFailed: { borderWidth: 1, borderColor: colors.danger },
  content: { fontSize: fontSize.md, color: colors.text, lineHeight: lineHeight.md },
  contentMine: { color: colors.onPrimary },
  contentDuoiAnh: { marginTop: spacing.sm },
  oDinhKem: { gap: spacing.xs },
  anh: {
    width: CO_ANH,
    height: CO_ANH,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  theTep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  tenTep: { flex: 1, fontSize: fontSize.xs, color: colors.text },
  // Thẻ tệp có nền sáng trên cả hai màu bong bóng, nên chữ luôn màu tối.
  tenTepMine: { color: colors.text },
  recalled: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic' },
  recalledMine: { color: 'rgba(255,255,255,0.85)' },
  // Nhãn công việc là một dải nền sáng nằm TRONG bong bóng, đọc được trên cả hai nền.
  taskStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm + 4,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  taskTick: {
    width: scale(24),
    height: scale(24),
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  taskBody: { flex: 1 },
  taskLabel: { fontSize: fontSize.xxs, color: colors.primary, fontWeight: '700' },
  taskTitle: { fontSize: fontSize.xs, color: colors.text, marginTop: spacing.xxs, lineHeight: lineHeight.xs },
  time: { fontSize: fontSize.xxs, color: colors.textMuted, marginTop: spacing.xs, alignSelf: 'flex-end' },
  timeMine: { color: 'rgba(255,255,255,0.8)' },
  retry: { marginTop: spacing.xs },
  retryText: { fontSize: fontSize.xs, color: colors.danger, fontWeight: '600' },
});
