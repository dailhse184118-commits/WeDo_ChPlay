import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '../../../components/ui/Card';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import { IconTile, type IconTileTone } from '../../../components/ui/IconTile';
import { useAuth } from '../../../lib/auth/auth-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, radius, sizes, spacing } from '../../../theme/tokens';

/** Số pixel thẻ danh tính chồng lên mép dưới của gradient header. */
const CARD_OVERLAP = 12;

/*
  Đặt qua biến môi trường chứ không nhúng cứng: trang chính sách còn chưa dựng
  xong, mà đưa một liên kết hỏng vào bản nộp Play thì bị từ chối ngay. Chưa cấu
  hình thì giấu hẳn dòng đó đi.
*/
const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL ?? '';

const APP_VERSION = Constants.expoConfig?.version ?? '';

interface MenuRowProps {
  icon: React.ComponentProps<typeof IconTile>['name'];
  tone: IconTileTone;
  label: string;
  hint?: string;
  onPress: () => void;
  testID: string;
  last?: boolean;
}

function MenuRow({ icon, tone, label, hint, onPress, testID, last }: MenuRowProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        last ? null : styles.menuDivider,
        pressed ? styles.menuPressed : null,
      ]}
    >
      <IconTile name={icon} tone={tone} />
      <View style={styles.menuBody}>
        <Text style={styles.menuLabel}>{label}</Text>
        {hint ? <Text style={styles.menuHint}>{hint}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { active } = useWorkspace();

  return (
    <View style={styles.screen}>
      <GradientHeader title="Tài khoản" />

      {/*
        Kéo cả khung cuộn lên, không phải chỉ kéo thẻ bên trong. ScrollView xén mọi
        thứ tràn ra ngoài khung nhìn của nó, nên lề âm đặt ở thẻ con sẽ bị cắt cụt
        ngay tại mép dưới header.
      */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/*
          Thẻ danh tính chồng lên gradient, avatar nằm vắt ngang mép trên của thẻ.

          Avatar phải là ANH EM của thẻ, không được là con. Trên Android, View có
          borderRadius cắt sạch mọi thành phần con tràn ra ngoài, nên avatar đặt
          position absolute bên trong thẻ sẽ biến mất hoàn toàn.
        */}
        <View style={styles.identityBlock}>
          <Card style={styles.identity}>
            <Text style={styles.name}>{user?.fullName ?? 'Đang tải…'}</Text>
            <Text testID="account-email" style={styles.email}>
              {user?.email ?? ''}
            </Text>

            <View style={styles.workspace}>
              <Ionicons name="briefcase-outline" size={14} color={colors.primary} />
              <Text style={styles.workspaceText}>{active?.name ?? '—'}</Text>
            </View>
          </Card>

          {/* Vẽ sau thẻ để nằm đè lên trên. */}
          <View style={styles.avatarFloat} pointerEvents="none">
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.fullName ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <Card style={styles.menu}>
          <MenuRow
            testID="account-notification-settings"
            icon="notifications-outline"
            tone="info"
            label="Cài đặt thông báo"
            hint="Chọn loại thông báo bạn muốn nhận"
            onPress={() => router.push('/account/notification-settings')}
          />
          {/*
            Google Play bắt buộc có đường xoá tài khoản NGAY TRONG APP, không được
            chỉ đưa link web. Đặt ngay cạnh Đăng xuất vì đó là chỗ người dùng tìm.
          */}
          {PRIVACY_POLICY_URL ? (
            <MenuRow
              testID="account-privacy"
              icon="shield-checkmark-outline"
              tone="done"
              label="Chính sách bảo mật"
              hint="Mở trong trình duyệt"
              onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
            />
          ) : null}
          <MenuRow
            testID="account-delete"
            icon="trash-outline"
            tone="rejected"
            label="Xoá tài khoản"
            hint="Xoá vĩnh viễn dữ liệu của bạn"
            onPress={() => router.push('/account/delete-account')}
          />
          <MenuRow
            testID="account-signout"
            icon="log-out-outline"
            tone="rejected"
            label="Đăng xuất"
            onPress={() => void signOut()}
            last
          />
        </Card>

        <Text style={styles.note}>WeDo {APP_VERSION}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  /*
    Khung cuộn kéo lên bằng phần chồng lên gradient cộng nửa avatar, để cả avatar
    nằm trong khung nhìn và không bị xén.
  */
  scrollView: { marginTop: -(CARD_OVERLAP + sizes.profileAvatar / 2) },
  /* Đệm trên bằng nửa avatar, nên mép trên của thẻ cắt ngang đúng giữa avatar. */
  identityBlock: { paddingTop: sizes.profileAvatar / 2 },
  identity: {
    alignItems: 'center',
    paddingTop: sizes.profileAvatar / 2 + spacing.md,
  },
  avatarFloat: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  avatar: {
    width: sizes.profileAvatar,
    height: sizes.profileAvatar,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 4,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontWeight: '700', fontSize: 30 },
  name: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  email: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  workspace: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  workspaceText: {
    marginLeft: spacing.xs + 2,
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  menu: { marginTop: spacing.md, paddingVertical: 0 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  // Đường kẻ trong thẻ nhạt hơn viền ngoài, để không cắt vụn khối trắng.
  menuDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  menuPressed: { opacity: 0.7 },
  menuBody: { flex: 1, marginLeft: spacing.sm + 4 },
  menuLabel: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  menuHint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  note: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 18,
  },
});
