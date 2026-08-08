'use client';

import Link from 'next/link';
import {
  useParams,
  useRouter,
} from 'next/navigation';
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import {
  ApiError,
  apiRequest,
} from '@/lib/api';
import {
  type AssignIssueRequest,
  type CreateIssueCommentRequest,
  type Issue,
  type IssueComment,
  type IssueStatus,
} from '@/lib/issue-types';
import {
  type Project,
  type ProjectMember,
  type ProjectRole,
} from '@/lib/project-types';
import { AttachmentSection } from '@/components/issues/attachment-section';

export default function IssuePage() {
  const router = useRouter();

  const params = useParams<{
    projectId: string;
    issueId: string;
  }>();

  const projectId = params.projectId;
  const issueId = params.issueId;

  const {
    user,
    token,
    isLoading: isAuthLoading,
    logout,
  } = useAuth();

  const [project, setProject] =
    useState<Project | null>(null);

  const [issue, setIssue] =
    useState<Issue | null>(null);

  const [members, setMembers] = useState<
    ProjectMember[]
  >([]);

  const [comments, setComments] = useState<
    IssueComment[]
  >([]);

  const [commentContent, setCommentContent] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [isUpdatingIssue, setIsUpdatingIssue] =
    useState(false);

  const [
    isSubmittingComment,
    setIsSubmittingComment,
  ] = useState(false);

  const [
    deletingCommentId,
    setDeletingCommentId,
  ] = useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login');
    }
  }, [
    isAuthLoading,
    router,
    user,
  ]);

  const handleUnauthorized =
    useCallback((): void => {
      logout();
      router.replace('/login');
    }, [logout, router]);

  const loadIssuePage = useCallback(
    async (): Promise<void> => {
      if (!token) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [
          projectResponse,
          issueResponse,
          memberResponse,
          commentResponse,
        ] = await Promise.all([
          apiRequest<Project>(
            `/projects/${projectId}`,
            {
              token,
            },
          ),
          apiRequest<Issue>(
            `/projects/${projectId}` +
              `/issues/${issueId}`,
            {
              token,
            },
          ),
          apiRequest<ProjectMember[]>(
            `/projects/${projectId}/members`,
            {
              token,
            },
          ),
          apiRequest<IssueComment[]>(
            `/projects/${projectId}` +
              `/issues/${issueId}/comments`,
            {
              token,
            },
          ),
        ]);

        setProject(projectResponse);
        setIssue(issueResponse);
        setMembers(memberResponse);
        setComments(commentResponse);
      } catch (caughtError) {
        if (
          caughtError instanceof ApiError &&
          caughtError.status === 401
        ) {
          handleUnauthorized();
          return;
        }

        if (
          caughtError instanceof ApiError &&
          caughtError.status === 404
        ) {
          setError(
            'Issue not found or access denied',
          );
          return;
        }

        setError(
          caughtError instanceof ApiError
            ? caughtError.message
            : 'Unable to load the issue',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      handleUnauthorized,
      issueId,
      projectId,
      token,
    ],
  );

  useEffect(() => {
    if (
      !isAuthLoading &&
      user &&
      token
    ) {
      void loadIssuePage();
    }
  }, [
    isAuthLoading,
    loadIssuePage,
    token,
    user,
  ]);

  async function updateStatus(
    status: IssueStatus,
  ): Promise<void> {
    if (!token || !issue) {
      return;
    }

    setIsUpdatingIssue(true);
    setError(null);

    try {
      const updatedIssue =
        await apiRequest<Issue>(
          `/projects/${projectId}` +
            `/issues/${issue.id}`,
          {
            method: 'PATCH',
            token,
            body: {
              status,
            },
          },
        );

      setIssue(updatedIssue);
    } catch (caughtError) {
      if (
        caughtError instanceof ApiError &&
        caughtError.status === 401
      ) {
        handleUnauthorized();
        return;
      }

      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to update the status',
      );
    } finally {
      setIsUpdatingIssue(false);
    }
  }

  async function updateAssignee(
    assigneeId: string | null,
  ): Promise<void> {
    if (!token || !issue) {
      return;
    }

    setIsUpdatingIssue(true);
    setError(null);

    const request: AssignIssueRequest = {
      assigneeId,
    };

    try {
      const updatedIssue =
        await apiRequest<Issue>(
          `/projects/${projectId}` +
            `/issues/${issue.id}/assignee`,
          {
            method: 'PATCH',
            token,
            body: request,
          },
        );

      setIssue(updatedIssue);
    } catch (caughtError) {
      if (
        caughtError instanceof ApiError &&
        caughtError.status === 401
      ) {
        handleUnauthorized();
        return;
      }

      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to update the assignee',
      );
    } finally {
      setIsUpdatingIssue(false);
    }
  }

  async function handleCreateComment(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!token) {
      return;
    }

    const content = commentContent.trim();

    if (content.length === 0) {
      return;
    }

    setIsSubmittingComment(true);
    setError(null);

    const request: CreateIssueCommentRequest = {
      content,
    };

    try {
      const comment =
        await apiRequest<IssueComment>(
          `/projects/${projectId}` +
            `/issues/${issueId}/comments`,
          {
            method: 'POST',
            token,
            body: request,
          },
        );

      setComments((currentComments) => [
        ...currentComments,
        comment,
      ]);

      setCommentContent('');
    } catch (caughtError) {
      if (
        caughtError instanceof ApiError &&
        caughtError.status === 401
      ) {
        handleUnauthorized();
        return;
      }

      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to add the comment',
      );
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function deleteComment(
    commentId: string,
  ): Promise<void> {
    if (!token) {
      return;
    }

    setDeletingCommentId(commentId);
    setError(null);

    try {
      await apiRequest<void>(
        `/projects/${projectId}` +
          `/issues/${issueId}` +
          `/comments/${commentId}`,
        {
          method: 'DELETE',
          token,
        },
      );

      setComments((currentComments) =>
        currentComments.filter(
          (comment) =>
            comment.id !== commentId,
        ),
      );
    } catch (caughtError) {
      if (
        caughtError instanceof ApiError &&
        caughtError.status === 401
      ) {
        handleUnauthorized();
        return;
      }

      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to delete the comment',
      );
    } finally {
      setDeletingCommentId(null);
    }
  }

  function handleLogout(): void {
    logout();
    router.replace('/login');
  }

  if (
    isAuthLoading ||
    !user ||
    !token ||
    isLoading
  ) {
    return (
      <main className="page-loading">
        <div className="spinner" />
        <span>Loading issue...</span>
      </main>
    );
  }

  if (!project || !issue) {
    return (
      <main className="workspace-error-page">
        <div className="workspace-error-card">
          <span className="eyebrow">
            SiteFlow
          </span>

          <h1>Issue unavailable</h1>

          <p>
            {error ??
              'The issue could not be loaded.'}
          </p>

          <Link
            className="primary-link"
            href={`/projects/${projectId}`}
          >
            Back to project
          </Link>
        </div>
      </main>
    );
  }

  const membership = members.find(
    (member) => member.userId === user.id,
  );

  const accessRole: ProjectRole =
    project.ownerId === user.id
      ? 'OWNER'
      : membership?.role ?? 'CONTRACTOR';

  const canManageIssue =
    accessRole === 'OWNER' ||
    accessRole === 'ENGINEER';

  const assigneeOptions = [
    {
      id: project.ownerId,
      name:
        project.ownerId === user.id
          ? user.name
          : 'Project owner',
      role: 'Owner',
    },
    ...members.map((member) => ({
      id: member.userId,
      name: member.user.name,
      role:
        member.role === 'ENGINEER'
          ? 'Engineer'
          : 'Contractor',
    })),
  ];

  const assignee = assigneeOptions.find(
    (option) =>
      option.id === issue.assigneeId,
  );

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <Link
          className="brand brand-link"
          href="/projects"
        >
          <span className="brand-mark">
            SF
          </span>
          <span>SiteFlow</span>
        </Link>

        <div className="user-menu">
          <div>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        <nav className="breadcrumbs">
          <Link href="/projects">
            Projects
          </Link>

          <span>/</span>

          <Link href={`/projects/${projectId}`}>
            {project.name}
          </Link>

          <span>/</span>

          <span>{issue.title}</span>
        </nav>

        {error && (
          <div
            className="workspace-alert"
            role="alert"
          >
            {error}

            <button
              type="button"
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        )}

        <div className="issue-detail-layout">
          <article className="issue-detail-card">
            <div className="issue-detail-header">
              <div>
                <div className="issue-card-badges">
                  <span
                    className={`issue-status ${getStatusClass(
                      issue.status,
                    )}`}
                  >
                    {getStatusLabel(
                      issue.status,
                    )}
                  </span>

                  <span
                    className={`issue-priority ${issue.priority.toLowerCase()}`}
                  >
                    {getPriorityLabel(
                      issue.priority,
                    )}
                  </span>
                </div>

                <h1>{issue.title}</h1>
              </div>

              <span className="issue-reference">
                {issue.id.slice(0, 8)}
              </span>
            </div>

            <div className="issue-description">
              <span>Description</span>

              <p>
                {issue.description ||
                  'No description provided.'}
              </p>
            </div>

            <dl className="issue-properties">
              <div>
                <dt>Created</dt>
                <dd>
                  {formatDate(issue.createdAt)}
                </dd>
              </div>

              <div>
                <dt>Updated</dt>
                <dd>
                  {formatDate(issue.updatedAt)}
                </dd>
              </div>

              <div>
                <dt>Floor reference</dt>
                <dd>
                  {issue.floorId.slice(0, 8)}
                </dd>
              </div>

              <div>
                <dt>Assignee</dt>
                <dd>
                  {assignee?.name ??
                    'Unassigned'}
                </dd>
              </div>
            </dl>
          </article>

          <aside className="issue-controls-card">
            <div>
              <span className="eyebrow">
                Issue controls
              </span>

              <h2>Management</h2>
            </div>

            <label className="control-field">
              <span>Status</span>

              {canManageIssue ? (
                <select
                  value={issue.status}
                  onChange={(event) =>
                    void updateStatus(
                      event.target
                        .value as IssueStatus,
                    )
                  }
                  disabled={isUpdatingIssue}
                >
                  <option value="OPEN">
                    Open
                  </option>

                  <option value="IN_PROGRESS">
                    In progress
                  </option>

                  <option value="RESOLVED">
                    Resolved
                  </option>

                  <option value="CLOSED">
                    Closed
                  </option>
                </select>
              ) : (
                <strong>
                  {getStatusLabel(
                    issue.status,
                  )}
                </strong>
              )}
            </label>

            <label className="control-field">
              <span>Assignee</span>

              {canManageIssue ? (
                <select
                  value={
                    issue.assigneeId ?? ''
                  }
                  onChange={(event) =>
                    void updateAssignee(
                      event.target.value ||
                        null,
                    )
                  }
                  disabled={isUpdatingIssue}
                >
                  <option value="">
                    Unassigned
                  </option>

                  {assigneeOptions.map(
                    (option) => (
                      <option
                        key={option.id}
                        value={option.id}
                      >
                        {option.name} ·{' '}
                        {option.role}
                      </option>
                    ),
                  )}
                </select>
              ) : (
                <strong>
                  {assignee?.name ??
                    'Unassigned'}
                </strong>
              )}
            </label>

            {isUpdatingIssue && (
              <div className="control-loading">
                Saving changes...
              </div>
            )}
          </aside>
        </div>
<AttachmentSection
  projectId={projectId}
  issueId={issueId}
  token={token}
  currentUserId={user.id}
  isProjectOwner={
    project.ownerId === user.id
  }
/>
        <section className="comments-section">
          <div className="workspace-section-heading">
            <div>
              <h2>Comments</h2>

              <p>
                Project discussion and progress
                updates.
              </p>
            </div>

            <span className="comment-count">
              {comments.length}
            </span>
          </div>

          <form
            className="comment-form"
            onSubmit={handleCreateComment}
          >
            <textarea
              value={commentContent}
              onChange={(event) =>
                setCommentContent(
                  event.target.value,
                )
              }
              placeholder="Write a comment"
              rows={4}
              maxLength={2000}
              required
            />

            <div className="comment-form-footer">
              <span>
                {commentContent.length}/2000
              </span>

              <button
                className="primary-button compact"
                type="submit"
                disabled={
                  isSubmittingComment ||
                  commentContent.trim().length ===
                    0
                }
              >
                {isSubmittingComment
                  ? 'Posting...'
                  : 'Post comment'}
              </button>
            </div>
          </form>

          {comments.length === 0 ? (
            <div className="comments-empty">
              No comments yet.
            </div>
          ) : (
            <div className="comment-list">
              {comments.map((comment) => {
                const authorName =
                  getCommentAuthorName(
                    comment.authorId,
                    user.id,
                    user.name,
                    project.ownerId,
                    members,
                  );

                const canDelete =
                  comment.authorId === user.id;

                return (
                  <article
                    className="comment-card"
                    key={comment.id}
                  >
                    <div className="comment-avatar">
                      {getInitials(authorName)}
                    </div>

                    <div className="comment-content">
                      <header>
                        <div>
                          <strong>
                            {authorName}
                          </strong>

                          <span>
                            {formatDateTime(
                              comment.createdAt,
                            )}
                          </span>
                        </div>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() =>
                              void deleteComment(
                                comment.id,
                              )
                            }
                            disabled={
                              deletingCommentId ===
                              comment.id
                            }
                          >
                            {deletingCommentId ===
                            comment.id
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>
                        )}
                      </header>

                      <p>{comment.content}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function getCommentAuthorName(
  authorId: string,
  currentUserId: string,
  currentUserName: string,
  ownerId: string,
  members: ProjectMember[],
): string {
  if (authorId === currentUserId) {
    return currentUserName;
  }

  if (authorId === ownerId) {
    return 'Project owner';
  }

  const member = members.find(
    (item) => item.userId === authorId,
  );

  return member?.user.name ?? 'Project member';
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function getStatusClass(
  status: IssueStatus,
): string {
  return status
    .toLowerCase()
    .replace('_', '-');
}

function getStatusLabel(
  status: IssueStatus,
): string {
  const labels: Record<IssueStatus, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
  };

  return labels[status];
}

function getPriorityLabel(
  priority: Issue['priority'],
): string {
  const labels: Record<
    Issue['priority'],
    string
  > = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical',
  };

  return labels[priority];
}