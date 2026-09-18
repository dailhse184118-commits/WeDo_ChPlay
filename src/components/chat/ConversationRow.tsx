import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../ui/Card';
import { doiPhuong } from '../../lib/chat/doi-phuong';
import type { DirectConversation } from '../../lib/types';
import { colors, fontSize, radius, scaleWithFont, sizes, spacing } from '../../theme/tokens';

interface ConversationRowProps {
  conversation: DirectConversation;
  currentUserId: string;
  /** Người đối thoại có đang kết nối không. Lấy từ `onlineUserIds` của socket. */
  online: boolean;
  onPress: () => void;
}

/**
 * Một dòng trong danh sách tin nhắn riêng.
 *
 * Không dựng gì khi không tìm ra người đối thoại — tài khoản kia có thể vừa bị
 * xoá. Một dòng hỏng thì bỏ dòng đó, không được làm sập cả danh sách.
 */
export function ConversationRow({
  conversation,
  currentUserId,
  online,
  onPress,
}: ConversationRowProps) {
  const nguoiKia = doiPhuong(conversation, currentUserId);
  if (!nguoiKia) return null;

  const chuaDoc = conversation.unreadCount;
  const badgeLabel = chuaDoc > 99 ? '99+' : String(chuaDoc);

  return (
    <Card testID={`conversation-row-${conversation.id}`} onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {nguoiKia.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          {online ? <View testID="cham-online" style={styles.cham} /> : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {nguoiKia.fullName}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {online ? 'Đang hoạt động' : nguoiKia.email}
          </Text>
        </View>

        {chuaDoc > 0 ? (
          <View testID="unread-badge" style={styles.badge}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm + 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: sizes.projectAvatar,
    height: sizes.projectAvatar,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  avatarText: { fontWeight: '700', fontSize: fontSize.lg, color: colors.primary },
  /* Viền cùng màu nền thẻ để chấm không dính vào avatar khi hai màu gần nhau. */
  cham: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: scaleWithFont(12),
    height: scaleWithFont(12),
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
  body: { flex: 1, marginLeft: spacing.sm + 4 },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xxs },
  badge: {
    minWidth: scaleWithFont(24),
    minHeight: scaleWithFont(24),
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs + 2,
    marginLeft: spacing.sm,
  },
  badgeText: { color: colors.onPrimary, fontSize: fontSize.xs, fontWeight: '700' },
});
