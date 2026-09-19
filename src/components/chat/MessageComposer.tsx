import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TepChon } from '../../lib/api/tasks';
import { colors, fontSize, radius, scale, scaleWithFont, spacing } from '../../theme/tokens';

/** Cạnh một ô ảnh trong dải xem trước. */
const CO_XEM_TRUOC = scale(64);

interface MessageComposerProps {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  /**
   * Ảnh đang chờ gửi. Truyền mảng (kể cả rỗng) thì hai nút ảnh mới hiện —
   * màn hình nào chưa nối luồng gửi ảnh thì không mọc ra nút bấm vô tác dụng.
   */
  anhDaChon?: TepChon[];
  onChup?: () => void;
  onChonAnh?: () => void;
  /** Bỏ một ảnh khỏi dải chờ gửi, theo vị trí. */
  onBoAnh?: (viTri: number) => void;
}

export function MessageComposer({
  value,
  onChangeText,
  onSend,
  sending = false,
  anhDaChon,
  onChup,
  onChonAnh,
  onBoAnh,
}: MessageComposerProps) {
  const coAnh = Array.isArray(anhDaChon);
  const anh = anhDaChon ?? [];

  /*
    Có ảnh thì gửi được dù chưa gõ chữ nào: ảnh tự nó đã là nội dung. Giữ điều
    kiện cũ "phải có chữ" thì chụp xong nút Gửi vẫn mờ.
  */
  const canSend = (value.trim().length > 0 || anh.length > 0) && !sending;

  /*
    Chừa chỗ cho thanh điều hướng của Android.

    `edgeToEdgeEnabled` cho app vẽ TRÀN xuống dưới thanh điều hướng. Máy vuốt
    cử chỉ chỉ chừa ~16dp nên gần như không thấy gì, nhưng máy dùng ba nút chừa
    tới ~48dp — ô nhập nằm lọt dưới thanh nút và bấm không trúng. Người dùng
    báo ngày 19/09/2026: không thể chạm vào để gõ chữ.

    Trừ đi chiều cao bàn phím: lúc bàn phím mở thì nó đã phủ kín thanh điều
    hướng rồi, chừa thêm nữa là hở một khoảng trống ngay trên bàn phím. Hai màn
    chat chống bàn phím bằng hai cách khác nhau, nên đặt ở ĐÂY thì cả hai cùng
    đúng mà không phải sửa chỗ nào khác.
  */
  const insets = useSafeAreaInsets();
  const caoBanPhim = useKeyboardState((trangThai) => trangThai.height);

  return (
    <View
      testID="composer-root"
      style={[styles.khoi, { paddingBottom: Math.max(insets.bottom - caoBanPhim, 0) }]}
    >
      {anh.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daiXemTruoc}
        >
          {anh.map((tep, viTri) => (
            <View key={`${tep.uri}-${viTri}`} style={styles.oXemTruoc}>
              <Image
                testID={`composer-xem-truoc-${viTri}`}
                source={{ uri: tep.uri }}
                style={styles.anhXemTruoc}
                contentFit="cover"
              />
              <Pressable
                testID={`composer-bo-anh-${viTri}`}
                accessibilityRole="button"
                accessibilityLabel={`Bỏ ảnh ${viTri + 1}`}
                onPress={() => {
                  if (!sending) onBoAnh?.(viTri);
                }}
                hitSlop={8}
                style={styles.nutBoAnh}
              >
                <Ionicons name="close" size={12} color={colors.onPrimary} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.bar}>
        {coAnh ? (
          <View style={styles.nutAnh}>
            <Pressable
              testID="composer-chup"
              accessibilityRole="button"
              accessibilityLabel="Chụp ảnh"
              accessibilityState={{ disabled: sending }}
              onPress={() => {
                if (!sending) onChup?.();
              }}
              hitSlop={6}
              style={[styles.nutTron, sending ? styles.nutMo : null]}
            >
              <Ionicons name="camera-outline" size={22} color={colors.primary} />
            </Pressable>

            <Pressable
              testID="composer-chon-anh"
              accessibilityRole="button"
              accessibilityLabel="Chọn ảnh từ máy"
              accessibilityState={{ disabled: sending }}
              onPress={() => {
                if (!sending) onChonAnh?.();
              }}
              hitSlop={6}
              style={[styles.nutTron, sending ? styles.nutMo : null]}
            >
              <Ionicons name="image-outline" size={22} color={colors.primary} />
            </Pressable>
          </View>
        ) : null}

        <TextInput
          testID="composer-input"
          accessibilityLabel="Soạn tin nhắn"
          value={value}
          onChangeText={onChangeText}
          placeholder="Nhập tin nhắn…"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
          maxLength={2000}
          // Từ điển tiếng Anh của Android gạch đỏ toàn bộ tiếng Việt.
          spellCheck={false}
          autoCorrect={false}
        />

        <Pressable
          testID="composer-send"
          accessibilityRole="button"
          accessibilityLabel="Gửi"
          accessibilityState={{ disabled: !canSend }}
          onPress={() => {
            if (canSend) onSend();
          }}
          style={[styles.send, canSend ? null : styles.sendDisabled]}
        >
          {sending ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Text style={styles.sendText}>Gửi</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  khoi: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: spacing.sm,
  },
  nutAnh: { flexDirection: 'row', alignItems: 'center' },
  nutTron: {
    width: scale(40),
    minHeight: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutMo: { opacity: 0.4 },
  daiXemTruoc: { gap: spacing.sm, paddingTop: spacing.sm, paddingHorizontal: spacing.xs },
  oXemTruoc: { width: CO_XEM_TRUOC, height: CO_XEM_TRUOC },
  anhXemTruoc: {
    width: CO_XEM_TRUOC,
    height: CO_XEM_TRUOC,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  nutBoAnh: {
    position: 'absolute',
    top: -scale(4),
    right: -scale(4),
    width: scale(20),
    height: scale(20),
    borderRadius: radius.pill,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  send: {
    marginLeft: spacing.sm,
    minWidth: scale(64),
    minHeight: scaleWithFont(44),
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: colors.onPrimary, fontWeight: '700', fontSize: fontSize.sm },
});
