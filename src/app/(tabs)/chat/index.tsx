import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueries, useQuery } from '@tanstack/react-query';

import { ProjectRow } from '../../../components/chat/ProjectRow';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { getProjectUnreadCount } from '../../../lib/api/chat';
import { listProjects } from '../../../lib/api/projects';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, spacing } from '../../../theme/tokens';

/** Giới hạn để tránh N+1 request bắn cùng lúc trên mạng di động. */
const MAX_UNREAD_QUERIES = 6;

export default function ChatListScreen() {
  const router = useRouter();
  const { active } = useWorkspace();
  const workspaceId = active?.id;

  const projectsQuery = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => listProjects(workspaceId),
    enabled: Boolean(workspaceId),
  });

  const projects = projectsQuery.data ?? [];
  const tracked = projects.slice(0, MAX_UNREAD_QUERIES);

  // Chỉ hỏi số chưa đọc cho một số dự án đầu tiên. Các dự án còn lại hiện badge 0
  // cho tới khi người dùng mở, thay vì bắn hàng chục request cùng lúc.
  const unreadQueries = useQueries({
    queries: tracked.map((project) => ({
      queryKey: ['chat-unread', project.id],
      queryFn: () => getProjectUnreadCount(project.id),
      staleTime: 15_000,
    })),
  });

  const unreadById = new Map<string, number>();
  tracked.forEach((project, index) => {
    unreadById.set(project.id, unreadQueries[index]?.data?.count ?? 0);
  });

  const openProject = useCallback(
    (projectId: string) => router.push(`/chat/${projectId}`),
    [router],
  );

  if (projectsQuery.isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.heading}>Trò chuyện</Text>

      {projectsQuery.isError ? (
        <ErrorBanner
          message={
            projectsQuery.error instanceof Error
              ? projectsQuery.error.message
              : 'Không tải được danh sách dự án.'
          }
        />
      ) : null}

      <FlatList
        data={projects}
        keyExtractor={(project) => project.id}
        renderItem={({ item }) => (
          <ProjectRow
            project={item}
            unreadCount={unreadById.get(item.id) ?? 0}
            onPress={() => openProject(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={projectsQuery.isRefetching}
            onRefresh={() => projectsQuery.refetch()}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          projectsQuery.isError ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Chưa có dự án nào</Text>
              <Text style={styles.emptyBody}>
                Không gian làm việc này chưa có dự án. Tạo dự án trên web WeDo, rồi quay lại đây để
                trò chuyện cùng nhóm.
              </Text>
            </View>
          )
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  empty: { paddingTop: spacing.xl, alignItems: 'center' },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyBody: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
});
