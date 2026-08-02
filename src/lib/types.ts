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
