export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export type TaskAssignmentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_ACCEPTED'
  | 'TASK_REJECTED'
  | 'TASK_SUBMITTED'
  | 'TASK_REVIEW_APPROVED'
  | 'TASK_REVIEW_REJECTED'
  | 'TASK_DEADLINE_REMINDER'
  | 'MEETING_SCHEDULED'
  | 'SUBSCRIPTION_RENEWAL_DUE'
  | 'PAYMENT_CONFIRMED';

export type PlatformRole = 'USER' | 'ADMIN';

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface UserProfile extends UserSummary {
  dob?: string | null;
  platformRole?: PlatformRole;
  createdAt?: string;
}

/** Hình dạng phản hồi của POST /auth/login và POST /auth/register. */
export interface AuthResponse {
  message: string;
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string | null;
    platformRole?: PlatformRole;
  };
}

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: UserSummary;
}

export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  workspaceId: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  members?: Array<{ id: string; role: string; user: UserSummary }>;
  _count?: { tasks: number; members?: number };
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  completedAt?: string | null;
  assignmentStatus?: TaskAssignmentStatus | null;
  rejectionReason?: string | null;
  projectId?: string | null;
  workspaceId: string;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: UserSummary | null;
  project?: Pick<Project, 'id' | 'name' | 'status'> | null;
}

export interface ChatMessage {
  id: string;
  content: string;
  workspaceId: string;
  projectId: string;
  authorId: string;
  taskId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  author?: UserSummary;
  task?: Pick<
    Task,
    'id' | 'title' | 'status' | 'assignmentStatus' | 'projectId' | 'workspaceId'
  > | null;
  replyTo?: Pick<ChatMessage, 'id' | 'content' | 'deletedAt'> & {
    author?: UserSummary;
  };
  pinnedAt?: string | null;
}

/** Kết quả phân tích của AI. Mọi trường ngoài ba trường đầu đều có thể vắng. */
export interface ChatTaskSuggestion {
  hasTask: boolean;
  title: string;
  description?: string;
  assigneeHint?: string;
  assigneeId?: string;
  assigneeName?: string;
  /** Dạng 'YYYY-MM-DD'. */
  dueDate?: string;
  /** Dạng 'HH:mm'. */
  dueTime?: string;
  confidence: 'low' | 'medium' | 'high';
  reason?: string;
  model?: string;
}

export interface ChatHistoryPage {
  items: ChatMessage[];
  nextCursor?: string | null;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  dedupeKey?: string | null;
  actionUrl?: string | null;
  readAt?: string | null;
  userId: string;
  actorId?: string | null;
  workspaceId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  createdAt: string;
  actor?: UserSummary | null;
  task?: Pick<Task, 'id' | 'title' | 'status' | 'assignmentStatus'> | null;
}

export interface NotificationPreferences {
  notifyTaskAssignment: boolean;
  notifyTaskReview: boolean;
  notifyDeadlineReminder: boolean;
  notifyMeeting: boolean;
}
