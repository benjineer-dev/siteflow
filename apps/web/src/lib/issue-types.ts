import type { PaginationMeta } from './project-types';

export type IssueStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export type IssuePriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  floorId: string;
  authorId: string;
  assigneeId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IssueListResponse {
  items: Issue[];
  meta: PaginationMeta;
}

export interface CreateIssueRequest {
  title: string;
  description?: string;
  priority?: IssuePriority;
  floorId: string;
}
export interface IssueComment {
  id: string;
  content: string;
  issueId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueCommentRequest {
  content: string;
}

export interface AssignIssueRequest {
  assigneeId: string | null;
}