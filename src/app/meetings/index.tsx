import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { GradientHeader } from '../../components/ui/GradientHeader';
import { TheCuocHop } from '../../components/meetings/TheCuocHop';
import { danhSachCuocHop, type CuocHop } from '../../lib/api/meetings';
import { chiaHaiNhom } from '../../lib/meetings/sap-xep';
import { useRefetchOnScreenFocus } from '../../lib/use-refetch-on-focus';
import { useWorkspace } from '../../lib/workspace/workspace-context';
import { colors, fontSize, lineHeight, radius, spacing } from '../../theme/tokens';

export default function ManDanhSachHop() {
  const router = useRouter();
  const { active } = useWorkspace();

  const hopQuery = useQuery({
    queryKey: ['meetings', active?.id],
    queryFn: () => danhSachCuocHop(active!.id),
    enabled: Boolean(active?.id),
  });

  useRefetchOnScreenFocus(hopQuery.refetch);

  const sections = useMemo(() => {
    const { sapToi, daQua } = chiaHaiNhom(hopQuery.data ?? [], new Date());
    const ra: Array<{ title: string; data: CuocHop[] }> = [];
    if (sapToi.length) ra.push({ title: 'Sắp tới', data: sapToi });
    if (daQua.length) ra.push({ title: 'Đã qua', data: daQua });
    return ra;
  }, [hopQuery.data]);

  const trong = !hopQuery.isLoading && sections.length === 0;

  return (
    <View style={styles.man}>
      <GradientHeader
        title="Cuộc họp"
        subtitle={active?.name}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/calendar'))}
      />

      {/*
        Hiện nút cho MỌI người, không tự đoán ai là Leader. Danh sách dự án trả
        về cho mobile không phải lúc nào cũng kèm vai trò của người đang đăng
        nhập, nên đoán sai là giấu mất nút của đúng người được phép. Máy chủ từ
        chối bằng một câu tiếng Việt nói rõ lý do, và màn tạo hiện thẳng câu đó.
      */}
      <Pressable
        testID="meeting-new"
        accessibilityRole="button"
        onPress={() => router.push('/meetings/new')}
        style={({ pressed }) => [styles.taoMoi, pressed ? styles.nhan : null]}
      >
        <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
        <Text style={styles.taoMoiChu}>Tạo cuộc họp</Text>
      </Pressable>

      <View style={styles.than}>
        {/*
          Chỉ dội băng đỏ khi KHÔNG có gì để xem. Còn dữ liệu cũ trong bộ nhớ
          đệm thì một lượt gọi hỏng không phải chuyện chặn đường — che lên danh
          sách vẫn đọc được là làm người dùng tưởng app hỏng.
        */}
        {hopQuery.isError && !hopQuery.data ? (
          <ErrorBanner message="Không tải được danh sách cuộc họp." />
        ) : null}

        {hopQuery.isLoading ? (
          <View style={styles.giua}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : trong ? (
          <View style={styles.giua}>
            <Ionicons name="videocam-outline" size={48} color={colors.textMuted} />
            <Text style={styles.trongTieuDe}>Chưa có cuộc họp nào</Text>
            <Text style={styles.trongMoTa}>
              Leader của dự án là người lên lịch họp. Cuộc họp được tạo sẽ hiện ở
              đây và trên tab Lịch.
            </Text>
          </View>
        ) : (
          <SectionList
            testID="meeting-list"
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.cuon}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={hopQuery.isRefetching}
                onRefresh={() => void hopQuery.refetch()}
                tintColor={colors.primary}
              />
            }
            renderSectionHeader={({ section }) => (
              <Text style={styles.tieuDeNhom}>{section.title}</Text>
            )}
            renderItem={({ item }) => (
              <TheCuocHop
                testID={`meeting-${item.id}`}
                hop={item}
                onPress={() => router.push(`/meetings/${item.id}`)}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nhan: { opacity: 0.6 },
  taoMoi: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.md,
  },
  taoMoiChu: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary },
  man: { flex: 1, backgroundColor: colors.page },
  than: { flex: 1 },
  giua: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  trongTieuDe: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  trongMoTa: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: lineHeight.sm,
  },
  cuon: { padding: spacing.md, paddingBottom: spacing.xl },
  tieuDeNhom: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
});
