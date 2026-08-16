import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { MessageBubble } from '../../../components/chat/MessageBubble';
import { MessageComposer } from '../../../components/chat/MessageComposer';
import {
  TaskSuggestionSheet,
  type TaskSuggestionValues,
} from '../../../components/chat/TaskSuggestionSheet';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import {
  getProjectHistory,
  getProjectMessages,
  markProjectRead,
  requestTaskSuggestion,
  sendProjectMessage,
} from '../../../lib/api/chat';
import { MA_HET_LUOT_AI, getEntitlements } from '../../../lib/api/entitlements';
import { listProjects } from '../../../lib/api/projects';
import { trangThaiHanMuc } from '../../../lib/ai/han-muc';
import { ApiError } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/auth-context';
import { createTaskFromMessage } from '../../../lib/chat/create-task-from-message';
import { createLocalId } from '../../../lib/chat/local-id';
import { applyRecall, mergeMessages } from '../../../lib/chat/message-list';
import { activeTypers, applyTyping, typingLabel } from '../../../lib/chat/typing-state';
import { useSocket } from '../../../lib/socket/socket-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import type { ChatMessage, ChatTaskSuggestion, UserSummary } from '../../../lib/types';
import { colors, fontSize, spacing } from '../../../theme/tokens';

interface PendingItem {
  localId: string;
  content: string;
  failed: boolean;
}

export default function ChatThreadScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  /* Ngăn xếp có thể rỗng nếu vào thẳng từ liên kết, lúc đó rơi về danh sách dự án. */
  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/chat');
  }, [router]);

  const { user } = useAuth();
  const { active } = useWorkspace();
  const { socket } = useSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [members, setMembers] = useState<UserSummary[]>([]);
  const [projectName, setProjectName] = useState('Trò chuyện');

  const [typingBy, setTypingBy] = useState<Record<string, number>>({});
  const [typingTick, setTypingTick] = useState(0);
  const typingSentAt = useRef(0);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [sheetSubmitting, setSheetSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState<ChatTaskSuggestion | undefined>(undefined);
  const [sourceMessageId, setSourceMessageId] = useState<string | null>(null);

  /*
    Hạn mức AI của tháng. Đây là thứ người dùng trả tiền để có, và cũng là thứ
    duy nhất bị tính lượt — nhưng trước đây mobile không hề nhắc tới nó: người
    dùng chạm trần rồi nhận một băng đỏ khó hiểu.

    Đọc ở màn chat vì đây đúng là nơi tiêu lượt: nhấn giữ tin nhắn để AI đọc hộ.
  */
  const hanMucQuery = useQuery({
    queryKey: ['entitlements', active?.id],
    queryFn: () => getEntitlements(active?.id),
    enabled: Boolean(active?.id),
  });

  const hanMuc = hanMucQuery.data
    ? trangThaiHanMuc(hanMucQuery.data.usage.aiDetections)
    : null;

  /**
   * Idempotency-Key cho lần xin đề xuất đang diễn ra.
   *
   * TỪNG lưu theo messageId và dùng lại mãi, nhưng máy chủ coi khoá đã dùng là
   * trùng lặp và trả lỗi *"Yêu cầu AI này đang được xử lý hoặc đã kết thúc"* —
   * chứ không trả lại kết quả cũ. Hệ quả: nhấn giữ lần hai cùng một tin nhắn là
   * gặp màn báo lỗi, không cách nào xem lại đề xuất.
   *
   * Nay mỗi lần nhấn giữ sinh một khoá mới. Khoá vẫn giữ nguyên trong suốt một
   * lần gọi, nên vẫn chặn được việc mạng chập chờn gọi AI hai lần.
   */
  const idempotencyKeys = useRef(new Map<string, string>());

  /** Công việc đã tạo nhưng chưa gắn được, để thử lại đúng bước gắn thay vì tạo trùng. */
  const orphanTaskId = useRef<string | null>(null);

  const newIdempotencyKey = useCallback((messageId: string) => {
    const created = createLocalId();
    idempotencyKeys.current.set(messageId, created);
    return created;
  }, []);

  // Tải tin nhắn ban đầu, tên dự án và danh sách thành viên.
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [list, projects] = await Promise.all([
          getProjectMessages(projectId),
          listProjects(active?.id),
        ]);
        if (cancelled) return;

        const sorted = mergeMessages([], list);
        setMessages(sorted);
        setCursor(sorted.length ? sorted[0].createdAt : null);

        const project = projects.find((item) => item.id === projectId);
        if (project) {
          setProjectName(project.name);
          setMembers((project.members ?? []).map((member) => member.user));
        }

        await markProjectRead(projectId);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Không tải được tin nhắn.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, active?.id]);

  // Vào phòng và lắng nghe sự kiện. Huỷ listener khi rời, nếu không mở lại
  // sẽ đăng ký chồng và mỗi tin hiện nhiều lần.
  useEffect(() => {
    if (!socket || !projectId) return;

    socket.emit('join:project', { projectId });

    const onMessage = (incoming: ChatMessage) => {
      if (incoming.projectId !== projectId) return;
      setMessages((current) => mergeMessages(current, [incoming]));
    };
    const onUpdated = (incoming: ChatMessage) => {
      if (incoming.projectId !== projectId) return;
      setMessages((current) => mergeMessages(current, [incoming]));
    };
    const onRecalled = (incoming: ChatMessage) => {
      if (incoming.projectId !== projectId) return;
      setMessages((current) => applyRecall(current, incoming));
    };
    const onTyping = (payload: { projectId: string; typing: boolean; userId: string }) => {
      if (payload.projectId !== projectId) return;
      if (payload.userId === user?.id) return;
      setTypingBy((current) => applyTyping(current, payload.userId, payload.typing, Date.now()));
    };

    socket.on('message:project', onMessage);
    socket.on('message:project:updated', onUpdated);
    socket.on('message:project:recalled', onRecalled);
    socket.on('typing:project', onTyping);

    return () => {
      socket.off('message:project', onMessage);
      socket.off('message:project:updated', onUpdated);
      socket.off('message:project:recalled', onRecalled);
      socket.off('typing:project', onTyping);
    };
  }, [socket, projectId, user?.id]);

  // Nhịp đếm để chữ "đang nhập" tự biến mất khi quá hạn, kể cả khi không có sự kiện mới.
  useEffect(() => {
    if (Object.keys(typingBy).length === 0) return;
    const timer = setInterval(() => setTypingTick((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [typingBy]);

  const loadMore = useCallback(async () => {
    if (!projectId || !cursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const page = await getProjectHistory(projectId, cursor);
      if (page.items.length) {
        setMessages((current) => mergeMessages(current, page.items));
        setCursor(page.nextCursor ?? null);
      } else {
        setCursor(null);
      }
    } catch {
      // Cuộn lên mà hỏng thì im lặng; người dùng cuộn lại là thử lại.
      // Không chặn màn hình vì tin nhắn hiện có vẫn đọc được.
    } finally {
      setLoadingMore(false);
    }
  }, [projectId, cursor, loadingMore]);

  const doSend = useCallback(
    async (content: string, localId: string) => {
      if (!projectId) return;
      setSending(true);
      try {
        const saved = await sendProjectMessage(projectId, content);
        setMessages((current) => mergeMessages(current, [saved]));
        setPending((current) => current.filter((item) => item.localId !== localId));
      } catch {
        setPending((current) =>
          current.map((item) => (item.localId === localId ? { ...item, failed: true } : item)),
        );
      } finally {
        setSending(false);
      }
    },
    [projectId],
  );

  const handleDraftChange = useCallback(
    (value: string) => {
      setDraft(value);
      if (!socket || !projectId) return;

      const now = Date.now();
      // Tiết lưu: chỉ báo mỗi 2 giây, tránh bắn sự kiện theo từng phím gõ.
      if (now - typingSentAt.current > 2000) {
        typingSentAt.current = now;
        socket.emit('typing:project', { projectId, typing: true });
      }
    },
    [socket, projectId],
  );

  const handleSend = useCallback(() => {
    const content = draft.trim();
    if (!content) return;

    const localId = createLocalId();
    setPending((current) => [...current, { localId, content, failed: false }]);
    setDraft('');

    typingSentAt.current = 0;
    socket?.emit('typing:project', { projectId, typing: false });

    void doSend(content, localId);
  }, [draft, doSend, socket, projectId]);

  const handleLongPress = useCallback(
    async (messageId: string) => {
      if (!projectId) return;

      setSourceMessageId(messageId);
      setSuggestion(undefined);
      setSheetError('');
      setSheetOpen(true);
      setSheetLoading(true);
      orphanTaskId.current = null;

      try {
        const result = await requestTaskSuggestion(
          projectId,
          messageId,
          newIdempotencyKey(messageId),
        );
        setSuggestion(result);
        // Vừa tiêu một lượt. Đọc lại để con số hiện ra khớp thực tế ngay.
        void hanMucQuery.refetch();
      } catch (err) {
        /*
          Hết lượt là trường hợp riêng, không phải lỗi kỹ thuật. Máy chủ có trả
          câu tiếng Việt nhưng thiếu hai thứ người dùng cần nhất: bao giờ có lại,
          và còn cách nào khác để tạo việc. Đọc lại hạn mức rồi dựng câu đầy đủ.
        */
        if (err instanceof ApiError && err.code === MA_HET_LUOT_AI) {
          const moi = await hanMucQuery.refetch();
          const trangThai = moi.data
            ? trangThaiHanMuc(moi.data.usage.aiDetections)
            : null;
          setSheetError(trangThai?.loiNhan ?? err.message);
        } else {
          setSheetError(err instanceof Error ? err.message : 'Không phân tích được tin nhắn.');
        }
        setSuggestion({ hasTask: false, title: '', confidence: 'low' });
      } finally {
        setSheetLoading(false);
      }
    },
    [projectId, newIdempotencyKey, hanMucQuery],
  );

  const handleConfirm = useCallback(
    async (values: TaskSuggestionValues) => {
      if (!projectId || !sourceMessageId || !active?.id) return;

      setSheetSubmitting(true);
      setSheetError('');

      const result = await createTaskFromMessage({
        projectId,
        workspaceId: active.id,
        messageId: sourceMessageId,
        title: values.title,
        description: values.description,
        assigneeId: values.assigneeId,
        dueDate: values.dueDate,
        dueTime: values.dueTime,
        ...(orphanTaskId.current ? { existingTaskId: orphanTaskId.current } : {}),
      });

      setSheetSubmitting(false);

      if (result.outcome === 'created-and-linked') {
        orphanTaskId.current = null;
        setMessages((current) => mergeMessages(current, [result.message]));
        setSheetOpen(false);
        /*
          Danh sách "Việc của tôi" đang nằm trong bộ nhớ đệm của react-query. Không
          báo hỏng thì việc vừa tạo sẽ không xuất hiện cho tới lần kéo làm mới sau.
        */
        void queryClient.invalidateQueries({ queryKey: ['tasks'] });
        void queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });

        Alert.alert('Đã tạo công việc', result.task.title ?? values.title, [
          { text: 'Đóng', style: 'cancel' },
          { text: 'Xem công việc', onPress: () => router.push(`/tasks/${result.task.id}`) },
        ]);
        return;
      }

      if (result.outcome === 'created-not-linked') {
        // Công việc ĐÃ được tạo thật. Giữ lại id để lần thử tiếp theo chỉ gắn,
        // không tạo thêm công việc trùng.
        orphanTaskId.current = result.task.id;
        setSheetError(
          'Đã tạo công việc nhưng chưa gắn được vào tin nhắn. Bấm "Tạo công việc" để thử gắn lại — sẽ không tạo thêm công việc mới.',
        );
        return;
      }

      setSheetError(result.error.message);
    },
    [projectId, sourceMessageId, active?.id, router, queryClient],
  );

  // Danh sách hiển thị: tin thật cộng tin đang gửi, đảo ngược cho FlatList inverted.
  const display = useMemo(() => {
    const pendingAsMessages: ChatMessage[] = pending.map((item) => ({
      id: item.localId,
      content: item.content,
      workspaceId: active?.id ?? '',
      projectId: projectId ?? '',
      authorId: user?.id ?? '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    return [...messages, ...pendingAsMessages].reverse();
  }, [messages, pending, active?.id, projectId, user?.id]);

  const pendingById = new Map(pending.map((item) => [item.localId, item]));

  const typingText = useMemo(() => {
    void typingTick;
    const ids = activeTypers(typingBy, Date.now());
    const names = ids
      .map((id) => members.find((member) => member.id === id)?.fullName)
      .filter((name): name is string => Boolean(name));
    return typingLabel(names);
  }, [typingBy, typingTick, members]);

  if (loading) {
    return (
      <View style={styles.screen}>
        <GradientHeader title={projectName} onBack={goBack} dense />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Trạng thái "đang gõ" vẫn nằm sát ô soạn tin, không đưa lên header. */}
      <GradientHeader title={projectName} onBack={goBack} dense />

      {/*
        `behavior="padding"` cho CẢ Android, không chỉ iOS.

        Trước đây Android để `undefined`, tức phó mặc cho hệ điều hành tự thu
        cửa sổ. Cách đó chạy tốt cho tới khi bật `edgeToEdgeEnabled` — từ Expo
        SDK 53 app vẽ tràn ra sau thanh hệ thống, Android không thu cửa sổ như
        cũ nữa, và ô soạn tin nằm khuất hẳn sau bàn phím. Người dùng gõ mà không
        nhìn thấy mình gõ gì.

        Không cần `keyboardVerticalOffset`: thanh tab đã bị ẩn ở màn này (khai
        trong (tabs)/_layout.tsx) nên dưới ô soạn tin không còn gì chen vào.
      */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {loadError ? <ErrorBanner message={loadError} /> : null}

        {/*
          Nhắc trước khi chạm trần, không phải sau. Người dùng đang giữa việc mà
          bị chặn đột ngột thì khó chịu hơn nhiều so với biết trước còn mấy lượt.
          Im lặng khi còn dư dả — nhắc quá sớm thì họ học cách phớt lờ.
        */}
        {hanMuc && hanMuc.muc !== 'du' ? (
          <View style={hanMuc.muc === 'het' ? styles.hanMucHet : styles.hanMucSapHet}>
            <Text style={styles.hanMucChu}>{hanMuc.loiNhan}</Text>
          </View>
        ) : null}

        <FlatList
          inverted
          data={display}
          keyExtractor={(item) => item.id}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={styles.more} color={colors.primary} /> : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Chưa có tin nhắn nào</Text>
              <Text style={styles.emptyBody}>
                Gửi tin nhắn đầu tiên. Nhấn giữ một tin nhắn bất kỳ để biến nó thành công việc.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const pendingItem = pendingById.get(item.id);
            return (
              <MessageBubble
                message={item}
                isMine={item.authorId === user?.id}
                isPending={Boolean(pendingItem) && !pendingItem?.failed}
                isFailed={Boolean(pendingItem?.failed)}
                onLongPress={() => void handleLongPress(item.id)}
                onRetry={
                  pendingItem
                    ? () => {
                        setPending((current) =>
                          current.map((p) =>
                            p.localId === pendingItem.localId ? { ...p, failed: false } : p,
                          ),
                        );
                        void doSend(pendingItem.content, pendingItem.localId);
                      }
                    : undefined
                }
              />
            );
          }}
        />

        {typingText ? <Text style={styles.typing}>{typingText}</Text> : null}

        <MessageComposer
          value={draft}
          onChangeText={handleDraftChange}
          onSend={handleSend}
          sending={sending}
        />
      </KeyboardAvoidingView>

      <TaskSuggestionSheet
        visible={sheetOpen}
        loading={sheetLoading}
        suggestion={suggestion}
        members={members}
        sourceMessage={messages.find((m) => m.id === sourceMessageId)?.content}
        currentUserId={user?.id}
        error={sheetError || undefined}
        submitting={sheetSubmitting}
        onConfirm={handleConfirm}
        onDismiss={() => setSheetOpen(false)}
        onReport={() =>
          Alert.alert('Cảm ơn phản hồi', 'Chúng tôi đã ghi nhận rằng đề xuất này chưa chính xác.')
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  /*
    Sắp hết dùng màu cảnh báo, hết hẳn dùng màu lỗi — đây là hai mức khác nhau
    và người dùng cần phân biệt được bằng mắt trước khi kịp đọc chữ.
  */
  hanMucSapHet: {
    backgroundColor: '#fff7e6',
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hanMucHet: {
    backgroundColor: '#fdecea',
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hanMucChu: { fontSize: fontSize.sm, color: colors.text, lineHeight: fontSize.sm * 1.5 },
  // Nền khung chat xám nhạt để bong bóng trắng của người khác nổi lên.
  flex: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  more: { marginVertical: spacing.md },
  empty: { paddingTop: spacing.xl, alignItems: 'center', transform: [{ scaleY: -1 }] },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyBody: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
  typing: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    fontStyle: 'italic',
  },
});
