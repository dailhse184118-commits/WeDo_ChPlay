import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '../../../components/ui/Card';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import { IconTile, type IconTileTone } from '../../../components/ui/IconTile';
import { useAuth } from '../../../lib/auth/auth-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, radius, sizes, spacing } from '../../../theme/tokens';

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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Thẻ danh tính chồng lên gradient, avatar nhô hẳn lên trên mép thẻ. */}
        <Card overlap={44} style={styles.identity}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.fullName ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.name}>{user?.fullName ?? 'Đang tải…'}</Text>
          <Text testID="account-email" style={styles.email}>
            {user?.email ?? ''}
          </Text>

          <View style={styles.workspace}>
            <Ionicons name="briefcase-outline" size={14} color={colors.primary} />
            <Text style={styles.workspaceText}>{active?.name ?? '—'}</Text>
          </View>
        </Card>

        <Card style={styles.menu}>
          <MenuRow
            testID="account-notification-settings"
            icon="notifications-outline"
            tone="info"
            label="Cài đặt thông báo"
            hint="Chọn loại thông báo bạn muốn nhận"
            onPress={() => router.push('/account/notification-settings')}
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

        <Text style={styles.note}>
          Chính sách bảo mật và xoá tài khoản sẽ được bổ sung ở bản tiếp theo.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  identity: { alignItems: 'center', paddingTop: spacing.xl + spacing.sm },
  avatarWrap: { position: 'absolute', top: -56, alignSelf: 'center' },
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
