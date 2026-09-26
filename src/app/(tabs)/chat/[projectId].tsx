import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { MessageBubble } from '../../../components/chat/MessageBubble';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { EmptyChat } from '../../../components/chat/EmptyChat';
import { ImageViewer } from '../../../components/chat/ImageViewer';
import { MessageComposer } from '../../../components/chat/MessageComposer';
import {
  TaskSuggestionSheet,
  type TaskSuggestionValues,
} from '../../../components/chat/TaskSuggestionSheet';
import { useBangThaoTac, type ThaoTac } from '../../../components/moderation/BangThaoTac';
import { PhieuBaoCao, type DoiTuongBaoCao } from '../../../components/moderation/PhieuBaoCao';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import {
  SO_TIN_MOI_NHAT,
  getProjectHistory,
  getProjectMessages,
  markProjectRead,
  requestTaskSuggestion,
  sendProjectFiles,
  sendProjectMessage,
} from '../../../lib/api/chat';
import type { TepChon } from '../../../lib/api/tasks';
import { MA_HET_LUOT_AI, getEntitlements } from '../../../lib/api/entitlements';
import { listProjects } from '../../../lib/api/projects';
import { useDongYAI } from '../../../lib/ai/dong-y-ai';
import { trangThaiHanMuc } from '../../../lib/ai/han-muc';
import { ApiError } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/auth-context';
import { createTaskFromMessage } from '../../../lib/chat/create-task-from-message';
import { createLocalId } from '../../../lib/chat/local-id';
import { applyRecall, mergeMessages } from '../../../lib/chat/message-list';
import { idsHienAvatar, idsHienTen } from '../../../lib/chat/nhom-tin';
import { useDongBoKhungChat } from '../../../lib/chat/use-dong-bo-khung-chat';
import { useHeaderTep } from '../../../lib/chat/use-header-tep';
import { locTinNguoiDaChan } from '../../../lib/moderation/loc-chan';
import { useChanNguoi, useNguoiDaChan } from '../../../lib/moderation/use-kiem-duyet';
import { laLeaderDuAn } from '../../../lib/tasks/task-permissions';
import { baoLoi, moTaTep } from '../../../lib/observability/sentry';
import { chonAnh, chupAnh } from '../../../lib/images/pick-images';
import { activeTypers, applyTyping, typingLabel } from '../../../lib/chat/typing-state';
import { useSocket } from '../../../lib/socket/socket-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import type { ChatMessage, ChatTaskSuggestion, UserSummary } from '../../../lib/types';
import { colors, fontSize, spacing } from '../../../theme/tokens';

const GOC_MAY_CHU = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

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
  const { xinDongYRoiChay } = useDongYAI();
  const { active } = useWorkspace();
  const { socket } = useSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const [anhChoGui, setAnhChoGui] = useState<TepChon[]>([]);
  const [anhDangXem, setAnhDangXem] = useState<string | null>(null);

  const headerTep = useHeaderTep();

  /*
    Mốc phân trang là MÃ của tin cũ nhất đã tải — máy chủ tìm theo id. Bản cũ gửi
    thời điểm tạo, không khớp tin nào, nên cuộn lên không bao giờ ra tin cũ hơn.
    `undefined` = chưa nạp lần nào; `null` = đã hết lịch sử.
  */
  const [cursor, setCursor] = useState<string | null | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);

  const [typingBy, setTypingBy] = useState<Record<string, number>>({});
  const [typingTick, setTypingTick] = useState(0);
  const typingSentAt = useRef(0);

  // Tên và thành viên dùng chung bộ nhớ đệm với danh sách dự án — mở khung chat không tốn thêm lượt gọi.
  const projectsQuery = useQuery({
    queryKey: ['projects', active?.id],
    queryFn: () => listProjects(active?.id),
    enabled: Boolean(active?.id),
  });
  const project = projectsQuery.data?.find((item) => item.id === projectId);
  const projectName = project?.name ?? 'Trò chuyện';
  const members = useMemo<UserSummary[]>(
    () => (project?.members ?? []).map((member) => member.user),
    [project],
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [sheetSubmitting, setSheetSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState<ChatTaskSuggestion | undefined>(undefined);
  const [sourceMessageId, setSourceMessageId] = useState<string | null>(null);

  /* Tin đang bị báo cáo. `null` là phiếu báo cáo đang đóng. */
  const [doiTuongBaoCao, setDoiTuongBaoCao] = useState<DoiTuongBaoCao | null>(null);
  const { moBang, bang: bangThaoTac } = useBangThaoTac();
  const { hoiRoiChan } = useChanNguoi();
  /*
    Người mình đã chặn. Máy chủ bỏ tin của họ khỏi các lượt GET, nhưng tin tới
    qua socket thì không — lọc lại lúc dựng danh sách (xem `display`).
  */
  const daChan = useNguoiDaChan();

  /*
    Màn này là một tab ẩn, sống suốt phiên: mở dự án khác vẫn là CÙNG một màn,
    chỉ đổi tham số. Xoá sạch trạng thái của dự án cũ ngay trong lượt dựng —
    không đợi hiệu ứng — để không có khung hình nào hiện tin dự án cũ dưới tên
    dự án mới. Gồm cả ô soạn tin: bản nháp hay ảnh chọn cho nhóm này mà nằm sẵn
    ở nhóm kia là bấm Gửi nhầm nhóm.
  */
  const [duAnCuaTin, setDuAnCuaTin] = useState(projectId);
  if (duAnCuaTin !== projectId) {
    setDuAnCuaTin(projectId);
    setMessages([]);
    setPending([]);
    setCursor(undefined);
    setTypingBy({});
    setLoading(true);
    setLoadError('');
    setDraft('');
    setAnhChoGui([]);
    setAnhDangXem(null);
    setSheetOpen(false);
    setDoiTuongBaoCao(null);
    setSending(false);
  }

  /*
    Dự án đang hiện, đọc được trong lời gọi bất đồng bộ để bỏ kết quả đã lỗi thời.
    Cập nhật ở hiệu ứng bố cục — chạy liền sau lượt dựng, trước mọi lời gọi bất
    đồng bộ kịp trả về — để không có khe nào kết quả cũ lọt qua.
  */
  const duAnDangHien = useRef(projectId);
  /*
    Thế hệ của màn: tăng mỗi lần đổi dự án. So dự án thôi là chưa đủ — đi A→B→A
    thì dự án khớp lại nhưng trạng thái của A đã bị dọn sạch hai lần.
  */
  const theHe = useRef(0);
  /* Thế hệ của mốc phân trang: tăng khi phân trang lại, để trang cũ về muộn bị bỏ. */
  const theHeMoc = useRef(0);
  useLayoutEffect(() => {
    duAnDangHien.current = projectId;
    theHe.current += 1;
    theHeMoc.current += 1;
    typingSentAt.current = 0;
  }, [projectId]);

  /* Danh sách tin đang giữ, để lượt nạp lại biết trang mới có nối liền vào không. */
  const tinDangGiu = useRef<ChatMessage[]>([]);
  useLayoutEffect(() => {
    tinDangGiu.current = messages;
  }, [messages]);

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

  /*
    Đưa huy hiệu chưa đọc ở danh sách về 0 — CHỈ sau khi máy chủ đã ghi nhận
    đọc. Huỷ lượt đếm đang bay trước: nó có thể đã rời máy chủ trước lúc ghi
    nhận và về sau, kéo huy hiệu lên lại 1.
  */
  const dangXemRef = useRef<() => boolean>(() => false);
  const datChuaDocVe0 = useCallback(
    async (duAn: string) => {
      await queryClient.cancelQueries({ queryKey: ['chat-unread', duAn] });
      queryClient.setQueryData(['chat-unread', duAn], { count: 0 });
      /*
        Không còn đang xem: từ lúc máy chủ ghi nhận đọc tới giờ có thể đã có tin
        mới tới mà người dùng chưa thấy. Số 0 vừa đặt chỉ là tạm — hỏi lại máy chủ.
      */
      if (!dangXemRef.current()) void queryClient.invalidateQueries({ queryKey: ['chat-unread', duAn] });
    },
    [queryClient],
  );

  const baoDaDoc = useCallback(
    (duAn: string) =>
      markProjectRead(duAn)
        .then(() => datChuaDocVe0(duAn))
        .catch(() => {
          // Không báo được thì huy hiệu còn 1 — đúng với máy chủ, lần mở sau tự khớp.
        }),
    [datChuaDocVe0],
  );

  /* Dự án đang có tin chờ báo đã đọc (xem `danhDauDaDocSau`), và hẹn giờ của nó. */
  const henDanhDau = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duAnChoBaoDoc = useRef<string | null>(null);

  /*
    Rời màn khi còn tin chờ báo: báo ngay, không bỏ. Tin đó đã hiện trước mắt lúc
    người dùng đang xem — bấm Quay lại trong nhịp gom không làm nó thành "chưa đọc".
  */
  const chotKhiRoi = useCallback(() => {
    const duAn = duAnChoBaoDoc.current;
    if (henDanhDau.current) clearTimeout(henDanhDau.current);
    henDanhDau.current = null;
    duAnChoBaoDoc.current = null;
    if (duAn) void baoDaDoc(duAn);
  }, [baoDaDoc]);

  /* Chỉ lượt nạp mới nhất được ghi kết quả — lượt cũ về sau không đè lượt mới. */
  const luotNap = useRef(0);

  /*
    Nạp 40 tin mới nhất rồi GỘP vào danh sách đang có, không thay thế: thay thế là
    xoá mất tin socket vừa tới giữa chừng và các trang cũ đã cuộn lên tải.
    Máy chủ tính lượt GET này là "đã đọc", nên xong là huy hiệu về 0.

    Trừ khi trang mới KHÔNG nối vào phần đang giữ: lỡ hơn 40 tin lúc mất kết nối
    thì tin cũ nhất của trang mới không có trong tay. Gộp thẳng là để một khoảng
    trống không nhìn thấy — tin cũ nhảy thẳng sang tin thứ 41 — mà cuộn lên cũng
    không lấp được vì mốc phân trang nằm dưới đáy khoảng trống. Khi đó bỏ phần cũ
    hơn trang mới và phân trang lại từ đây; cuộn lên sẽ tải đúng khoảng đã lỡ.
  */
  const napLai = useCallback(async () => {
    const duAn = projectId;
    if (!duAn) return;

    const luot = ++luotNap.current;
    try {
      const list = await getProjectMessages(duAn);
      if (luot !== luotNap.current || duAnDangHien.current !== duAn) return;

      const cuNhat = list[0];
      const lienMach =
        !cuNhat ||
        list.length < SO_TIN_MOI_NHAT ||
        tinDangGiu.current.length === 0 ||
        tinDangGiu.current.some((tin) => tin.id === cuNhat.id);

      if (lienMach) {
        setMessages((current) => mergeMessages(current, list));
        // Chỉ đặt mốc ở lần nạp đầu; nạp lại không được kéo mốc về làm mất trang cũ.
        setCursor((current) => (current === undefined ? (cuNhat?.id ?? null) : current));
      } else {
        const moc = new Date(cuNhat.createdAt).getTime();
        // Giữ tin socket mới hơn trang (tới giữa lúc nạp), bỏ khối cũ trước khoảng trống.
        setMessages((current) =>
          mergeMessages(
            current.filter((tin) => new Date(tin.createdAt).getTime() > moc),
            list,
          ),
        );
        setCursor(cuNhat.id);
        // Trang cũ nào đang tải dở thuộc mốc cũ — bỏ khi nó về (xem `loadMore`).
        theHeMoc.current += 1;
      }
      setLoadError('');
      void datChuaDocVe0(duAn);
    } catch (err) {
      if (luot === luotNap.current && duAnDangHien.current === duAn) {
        setLoadError(err instanceof Error ? err.message : 'Không tải được tin nhắn.');
      }
    } finally {
      if (luot === luotNap.current && duAnDangHien.current === duAn) setLoading(false);
    }
  }, [projectId, datChuaDocVe0]);

  /*
    Nạp mỗi lần màn được đưa lên, khi app trở lại tiền cảnh và khi socket nối lại
    — xem `useDongBoKhungChat`. Kèm chặn banner của đúng dự án đang xem.
  */
  const { dangXem, dangMo } = useDongBoKhungChat({
    khoaManDangMo: projectId ? `du-an:${projectId}` : null,
    socket,
    napLai,
    onRoi: chotKhiRoi,
  });
  useLayoutEffect(() => {
    dangXemRef.current = dangXem;
  }, [dangXem]);

  /*
    Tin tới qua socket lúc đang xem thì báo máy chủ đã đọc — bản web vẫn làm vậy,
    mobile thì không, nên huy hiệu hiện lại ngay khi quay ra. Gom lại một nhịp:
    mười tin liền nhau chỉ tốn một lượt gọi. Người dùng rời màn trước khi tới
    nhịp thì `chotKhiRoi` báo ngay.
  */
  const danhDauDaDocSau = useCallback(
    (duAn: string) => {
      if (henDanhDau.current) clearTimeout(henDanhDau.current);
      duAnChoBaoDoc.current = duAn;
      henDanhDau.current = setTimeout(() => {
        henDanhDau.current = null;
        duAnChoBaoDoc.current = null;
        if (!dangXem() || duAnDangHien.current !== duAn) return;
        void baoDaDoc(duAn);
      }, 800);
    },
    [dangXem, baoDaDoc],
  );

  useEffect(
    () => () => {
      if (henDanhDau.current) clearTimeout(henDanhDau.current);
    },
    [],
  );

  // Vào phòng và lắng nghe sự kiện. Huỷ listener khi rời, nếu không mở lại
  // sẽ đăng ký chồng và mỗi tin hiện nhiều lần.
  useEffect(() => {
    if (!socket || !projectId) return;

    /*
      Xin vào phòng mỗi lần socket nối (lại): máy chủ quên sạch phòng của socket
      cũ. Trước đây chỉ xin một lần lúc mở màn, nên dự án ngoài workspace đang
      chọn mất realtime từ lần rớt mạng đầu tiên.
    */
    const vaoPhong = () => socket.emit('join:project', { projectId });
    vaoPhong();

    /*
      Màn đã rời (vẫn sống vì là tab) thì KHÔNG gộp tin mới — lần focus sau nạp lại
      đủ. Gộp vào là làm hỏng phép kiểm liền mạch của `napLai`: lỡ một khoảng lúc
      app nằm nền, rồi tin mới dồn vào màn ẩn, lúc mở lại trang 40 tin mới nhất
      toàn là những tin đó — tin cũ nhất của trang "có trong tay", khoảng đã lỡ bị
      coi là liền mạch và mất luôn.
    */
    const onMessage = (incoming: ChatMessage) => {
      if (incoming.projectId !== projectId || !dangMo()) return;
      setMessages((current) => mergeMessages(current, [incoming]));
      if (incoming.authorId !== user?.id && dangXem()) danhDauDaDocSau(projectId);
    };
    /* Sửa tin: lúc màn đã rời chỉ cập nhật tin đang có, không thêm tin mới vào. */
    const onUpdated = (incoming: ChatMessage) => {
      if (incoming.projectId !== projectId) return;
      setMessages((current) =>
        dangMo() || current.some((tin) => tin.id === incoming.id)
          ? mergeMessages(current, [incoming])
          : current,
      );
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

    socket.on('connect', vaoPhong);
    socket.on('message:project', onMessage);
    socket.on('message:project:updated', onUpdated);
    socket.on('message:project:recalled', onRecalled);
    socket.on('typing:project', onTyping);

    return () => {
      socket.off('connect', vaoPhong);
      socket.off('message:project', onMessage);
      socket.off('message:project:updated', onUpdated);
      socket.off('message:project:recalled', onRecalled);
      socket.off('typing:project', onTyping);
    };
  }, [socket, projectId, user?.id, dangXem, dangMo, danhDauDaDocSau]);

  // Nhịp đếm để chữ "đang nhập" tự biến mất khi quá hạn, kể cả khi không có sự kiện mới.
  useEffect(() => {
    if (Object.keys(typingBy).length === 0) return;
    const timer = setInterval(() => setTypingTick((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [typingBy]);

  const loadMore = useCallback(async () => {
    if (!projectId || !cursor || loadingMore) return;

    const moc = theHeMoc.current;
    setLoadingMore(true);
    try {
      const page = await getProjectHistory(projectId, cursor);
      /*
        Trong lúc chờ đã đổi dự án, hoặc đã phân trang lại vì phát hiện khoảng trống:
        trang này thuộc mốc cũ. Gộp vào là kéo mốc về dưới khoảng trống, mất nó lần nữa.
      */
      if (duAnDangHien.current !== projectId || theHeMoc.current !== moc) return;
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

  /*
    Gửi xong mà người dùng đã sang dự án khác thì KHÔNG ghi vào màn: màn giờ là
    khung chat của nhóm kia, ghi vào là tin nhóm này hiện nhầm sang nhóm kia. Tin
    đã tới máy chủ, mở lại dự án cũ là thấy. Gửi hỏng thì báo bằng hộp thoại — ô
    tin "gửi lỗi, bấm để gửi lại" đã bị dọn cùng dự án cũ.
  */
  const doSend = useCallback(
    async (content: string, localId: string) => {
      const duAn = projectId;
      if (!duAn) return;
      const theHeLucGui = theHe.current;
      setSending(true);
      try {
        const saved = await sendProjectMessage(duAn, content);
        // Quay lại đúng dự án này (A→B→A) thì gộp vẫn đúng: tin thuộc về A.
        if (duAnDangHien.current !== duAn) return;
        setMessages((current) => mergeMessages(current, [saved]));
        setPending((current) => current.filter((item) => item.localId !== localId));
      } catch {
        // Đã đổi dự án (kể cả A→B→A): bong bóng "gửi lỗi" đã bị dọn — phải báo bằng hộp thoại.
        if (theHe.current !== theHeLucGui) {
          Alert.alert('Chưa gửi được tin nhắn', `"${content}" chưa tới nhóm. Mở lại dự án đó để gửi lại.`);
          return;
        }
        setPending((current) =>
          current.map((item) => (item.localId === localId ? { ...item, failed: true } : item)),
        );
      } finally {
        // Không động vào cờ "đang gửi" của dự án khác — nó có lượt gửi riêng của nó.
        if (theHe.current === theHeLucGui) setSending(false);
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

  /*
    Ảnh KHÔNG đi qua đường lạc quan như tin chữ.

    Tin chữ hiện ngay rồi mới gửi, vì nội dung đã nằm sẵn trong tay. Ảnh thì
    phải tải lên xong máy chủ mới trả về đường dẫn để dựng — bịa một bong bóng
    trước cho ra một ô trống nằm chờ, không nhanh hơn chút nào.
  */
  const doSendAnh = useCallback(
    async (files: TepChon[], content: string) => {
      const duAn = projectId;
      if (!duAn) return;
      const theHeLucGui = theHe.current;
      setSending(true);
      setLoadError('');
      try {
        // Mỗi tệp thành một tin nhắn riêng — xem `taiNhieuTepLen`.
        const saved = await sendProjectFiles(duAn, files, content);
        // Đã sang dự án khác: không ghi ảnh vào màn, cũng không xoá ô soạn tin của nhóm kia.
        if (duAnDangHien.current !== duAn) return;
        setMessages((current) => mergeMessages(current, saved));
        setAnhChoGui([]);
        setDraft('');
      } catch (loi) {
        /*
          Bao ve Sentry TRUOC khi hien cau tieng Viet cho nguoi dung. Khong co
          dong nay thi cau loi that bien mat, va do dung la ly do khong ai lan
          ra duoc vi sao khong gui duoc anh ngay 19/09.
        */
        baoLoi(loi, 'gui-anh-chat-du-an', {
          soTep: files.length,
          tep: files.map(moTaTep),
          coChuThich: content.trim().length > 0,
        });
        const cauLoi = loi instanceof Error ? loi.message : 'Không gửi được ảnh.';
        if (theHe.current !== theHeLucGui) {
          Alert.alert('Chưa gửi được ảnh', `${cauLoi} Ảnh chưa tới nhóm trước — mở lại dự án đó để gửi lại.`);
          return;
        }
        setLoadError(cauLoi);
      } finally {
        if (theHe.current === theHeLucGui) setSending(false);
      }
    },
    [projectId],
  );

  const nhanAnh = useCallback(async (lay: () => Promise<TepChon[]>) => {
    setLoadError('');
    try {
      const them = await lay();
      if (them.length === 0) return;

      setAnhChoGui((hienCo) => [...hienCo, ...them]);
    } catch (loi) {
      baoLoi(loi, 'chon-anh-chat-du-an');
      setLoadError(loi instanceof Error ? loi.message : 'Không mở được ảnh.');
    }
  }, []);

  const handleSend = useCallback(() => {
    typingSentAt.current = 0;
    socket?.emit('typing:project', { projectId, typing: false });

    if (anhChoGui.length > 0) {
      void doSendAnh(anhChoGui, draft);
      return;
    }

    const content = draft.trim();
    if (!content) return;

    const localId = createLocalId();
    setPending((current) => [...current, { localId, content, failed: false }]);
    setDraft('');

    void doSend(content, localId);
  }, [draft, anhChoGui, doSend, doSendAnh, socket, projectId]);

  /**
   * Điểm DUY NHẤT bắt đầu gửi một tin nhắn cho AI đề xuất công việc.
   *
   * Mọi đường vào luồng AI phải đi qua hàm này, để hộp thoại xin đồng ý dùng AI
   * chỉ cần bọc đúng một chỗ.
   */
  const batDauGoiYAI = useCallback(
    async (tin: ChatMessage) => {
      if (!projectId) return;
      const messageId = tin.id;

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

  /*
    Máy chủ chỉ cho Leader dự án hoặc chủ không gian làm việc dùng AI
    (`ensureProjectLeader`), nên chỉ bày mục AI cho đúng những người đó.

    Dự án không có trong danh sách của không gian đang chọn — mở từ thông báo của
    không gian khác chẳng hạn — thì không biết chắc vai trò. Khi đó vẫn hiện, như
    trước giờ, và để máy chủ quyết: giấu nhầm là Leader thật mất tính năng.
  */
  const duocDungAI = !project || laLeaderDuAn(user?.id ?? '', project, active);

  /*
    Nhấn giữ một tin mở bảng thao tác. Trước đây nhấn giữ là gọi AI ngay — tức
    không có đường nào để báo cáo hay chặn một tin nhắn xấu (Guideline 1.2).

    Tin của chính mình thì không có Báo cáo và Chặn. Tin còn đang gửi chưa tồn
    tại trên máy chủ nên không có thao tác nào.
  */
  const moThaoTacTin = useCallback(
    (tin: ChatMessage) => {
      if (pending.some((item) => item.localId === tin.id)) return;

      const tenNguoiGui =
        tin.author?.fullName ??
        members.find((member) => member.id === tin.authorId)?.fullName ??
        '';
      const thaoTac: ThaoTac[] = [];

      if (duocDungAI) {
        thaoTac.push({
          khoa: 'ai',
          nhan: 'Tạo công việc bằng AI',
          // Chưa đồng ý dùng AI thì hỏi trước, không gửi gì — xem `useDongYAI`.
          onChon: () => xinDongYRoiChay(() => void batDauGoiYAI(tin)),
        });
      }

      if (tin.authorId !== user?.id) {
        thaoTac.push({
          khoa: 'bao-cao',
          nhan: 'Báo cáo tin nhắn',
          onChon: () =>
            setDoiTuongBaoCao({
              targetType: 'PROJECT_MESSAGE',
              targetId: tin.id,
              tenNguoi: tenNguoiGui || undefined,
            }),
        });
        thaoTac.push({
          khoa: 'chan',
          nhan: 'Chặn người này',
          nguyHiem: true,
          onChon: () =>
            hoiRoiChan({
              id: tin.authorId,
              fullName: tenNguoiGui,
              avatarUrl: tin.author?.avatarUrl,
            }),
        });
      }

      moBang({ tieuDe: tenNguoiGui || undefined, thaoTac });
    },
    [pending, members, duocDungAI, batDauGoiYAI, xinDongYRoiChay, user?.id, hoiRoiChan, moBang],
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
          {
            text: 'Xem công việc',
            /* Mang theo khung chat này để Quay lại ở màn công việc về đúng đây. */
            onPress: () =>
              router.push({
                pathname: '/tasks/[taskId]',
                params: { taskId: result.task.id, tu: 'chat', chatId: projectId },
              }),
          },
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
    // Lọc theo dự án cho chắc: tin lạc dự án khác không bao giờ được hiện ở đây.
    const cuaDuAn = messages.filter((tin) => tin.projectId === projectId);
    // Không thể đuổi người khỏi dự án chung, nên chặn nghĩa là ẩn tin của họ với mình.
    const khongBiChan = locTinNguoiDaChan(cuaDuAn, daChan, (tin) => tin.authorId);
    return [...khongBiChan, ...pendingAsMessages].reverse();
  }, [messages, pending, active?.id, projectId, user?.id, daChan]);

  /*
    Tính trên thứ tự thời gian, tức đảo lại `display` — xem `idsHienAvatar`.
    Gộp cả tin đang gửi để tin vừa gõ không nhảy ra một khối riêng rồi lại nhập
    vào chuỗi khi máy chủ nhận xong.
  */
  const nhom = useMemo(() => {
    const theoThoiGian = [...display]
      .reverse()
      .map((tin) => ({ id: tin.id, nguoiGuiId: tin.authorId }));

    return { avatar: idsHienAvatar(theoThoiGian), ten: idsHienTen(theoThoiGian) };
  }, [display]);

  const pendingById = new Map(pending.map((item) => [item.localId, item]));

  const typingText = useMemo(() => {
    void typingTick;
    const ids = activeTypers(typingBy, Date.now()).filter((id) => !daChan.has(id));
    const names = ids
      .map((id) => members.find((member) => member.id === id)?.fullName)
      .filter((name): name is string => Boolean(name));
    return typingLabel(names);
  }, [typingBy, typingTick, members, daChan]);

  // Vòng quay chỉ khi CHƯA có gì để xem. Nạp lại lúc quay về màn thì chạy ngầm.
  if (loading && messages.length === 0) {
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
        `KeyboardAvoidingView` này lấy từ `react-native-keyboard-controller`,
        KHÔNG phải từ `react-native`.

        Bản của React Native tính phần chồng lấn bằng
        `frame.y + frame.height - keyboardY`, tức phụ thuộc vào việc Android báo
        đúng khung bàn phím qua `keyboardDidShow`. Dưới edge-to-edge, bàn phím
        của mỗi hãng báo mỗi kiểu, nên ô soạn tin bị che trên một số máy mà
        không phải máy khác — người kiểm thử báo 18/09/2026.

        Bản này đọc thẳng `WindowInsetsAnimation` của hệ điều hành nên không còn
        phụ thuộc cấu hình máy. `automaticOffset` để nó tự đo vị trí của chính
        mình dưới header gradient, khỏi phải chỉnh `keyboardVerticalOffset` bằng
        tay cho từng màn.
      */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding" automaticOffset>
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
          testID="khung-tin"
          inverted
          data={display}
          keyExtractor={(item) => item.id}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={styles.more} color={colors.primary} /> : null
          }
          ListEmptyComponent={
            <EmptyChat
              title="Chưa có tin nhắn nào"
              // Chỉ hứa tính năng AI với người thật sự dùng được nó — xem `duocDungAI`.
              body={
                duocDungAI
                  ? 'Gửi tin nhắn đầu tiên. Nhấn giữ một tin nhắn bất kỳ để nhờ AI biến nó thành công việc.'
                  : 'Gửi tin nhắn đầu tiên cho cả nhóm.'
              }
            />
          }
          renderItem={({ item }) => {
            const pendingItem = pendingById.get(item.id);
            return (
              <MessageBubble
                message={item}
                isMine={item.authorId === user?.id}
                isPending={Boolean(pendingItem) && !pendingItem?.failed}
                isFailed={Boolean(pendingItem?.failed)}
                hienAvatar={nhom.avatar.has(item.id)}
                hienTen={nhom.ten.has(item.id)}
                goc={GOC_MAY_CHU}
                headers={headerTep}
                onXemAnh={setAnhDangXem}
                onLongPress={() => moThaoTacTin(item)}
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
          anhDaChon={anhChoGui}
          onChup={() => void nhanAnh(chupAnh)}
          onChonAnh={() => void nhanAnh(chonAnh)}
          onBoAnh={(viTri) => setAnhChoGui((hienCo) => hienCo.filter((_, i) => i !== viTri))}
        />
      </KeyboardAvoidingView>

      <ImageViewer url={anhDangXem} headers={headerTep} onDong={() => setAnhDangXem(null)} />

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
      />

      {bangThaoTac}
      <PhieuBaoCao doiTuong={doiTuongBaoCao} onDong={() => setDoiTuongBaoCao(null)} />
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
  typing: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    fontStyle: 'italic',
  },
});
