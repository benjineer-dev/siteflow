'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react';
import {
  ApiError,
  apiRequest,
} from '@/lib/api';
import {
  type CreateIssueRequest,
  type Issue,
  type IssueListResponse,
  type IssuePriority,
  type IssueStatus,
} from '@/lib/issue-types';

const ISSUES_PER_PAGE = 10;

export interface FloorOption {
  id: string;
  level: number;
  name: string | null;
  buildingName: string;
}

interface IssueBoardProps {
  projectId: string;
  token: string;
  floors: FloorOption[];
  canManage: boolean;
}

export function IssueBoard({
  projectId,
  token,
  floors,
  canManage,
}: IssueBoardProps) {
  const [issues, setIssues] = useState<Issue[]>(
    [],
  );

  const [searchInput, setSearchInput] =
    useState('');

  const [search, setSearch] = useState('');

  const [status, setStatus] = useState<
    IssueStatus | ''
  >('');

  const [priority, setPriority] = useState<
    IssuePriority | ''
  >('');

  const [floorId, setFloorId] = useState('');

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [totalPages, setTotalPages] =
    useState(0);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [
    isCreateModalOpen,
    setIsCreateModalOpen,
  ] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [status, priority, floorId]);

  const loadIssues = useCallback(
    async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      const parameters = new URLSearchParams({
        page: String(page),
        limit: String(ISSUES_PER_PAGE),
      });

      if (search) {
        parameters.set('search', search);
      }

      if (status) {
        parameters.set('status', status);
      }

      if (priority) {
        parameters.set('priority', priority);
      }

      if (floorId) {
        parameters.set('floorId', floorId);
      }

      try {
        const response =
          await apiRequest<IssueListResponse>(
            `/projects/${projectId}/issues?${parameters.toString()}`,
            {
              token,
            },
          );

        setIssues(response.items);
        setTotal(response.meta.total);
        setTotalPages(
          response.meta.totalPages,
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof ApiError
            ? caughtError.message
            : 'Unable to load issues',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      floorId,
      page,
      priority,
      projectId,
      search,
      status,
      token,
    ],
  );

  useEffect(() => {
    void loadIssues();
  }, [loadIssues]);

  function handleCreated(): void {
    setIsCreateModalOpen(false);

    if (page !== 1) {
      setPage(1);
      return;
    }

    void loadIssues();
  }

  function clearFilters(): void {
    setSearchInput('');
    setSearch('');
    setStatus('');
    setPriority('');
    setFloorId('');
    setPage(1);
  }

  const hasFilters = Boolean(
    search || status || priority || floorId,
  );

  return (
    <section className="issues-section">
      <div className="workspace-section-heading issue-heading">
        <div>
          <h2>Issues</h2>

          <p>
            Track site defects and outstanding
            work.
          </p>
        </div>

        {canManage && (
          <button
            className="primary-button compact"
            type="button"
            onClick={() =>
              setIsCreateModalOpen(true)
            }
            disabled={floors.length === 0}
          >
            Create issue
          </button>
        )}
      </div>

      {canManage && floors.length === 0 && (
        <div className="issue-notice">
          Add a building and floor before creating
          an issue.
        </div>
      )}

      <div className="issue-toolbar">
        <div className="search-field issue-search">
          <span aria-hidden="true">⌕</span>

          <input
            type="search"
            value={searchInput}
            onChange={(event) =>
              setSearchInput(event.target.value)
            }
            placeholder="Search issues"
            aria-label="Search issues"
          />
        </div>

        <select
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value as
                | IssueStatus
                | '',
            )
          }
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">
            In progress
          </option>
          <option value="RESOLVED">
            Resolved
          </option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          value={priority}
          onChange={(event) =>
            setPriority(
              event.target.value as
                | IssuePriority
                | '',
            )
          }
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">
            Critical
          </option>
        </select>

        <select
          value={floorId}
          onChange={(event) =>
            setFloorId(event.target.value)
          }
          aria-label="Filter by floor"
        >
          <option value="">All floors</option>

          {floors.map((floor) => (
            <option
              key={floor.id}
              value={floor.id}
            >
              {getFloorLabel(floor)}
            </option>
          ))}
        </select>
      </div>

      <div className="issue-results-row">
        <span>
          {total}{' '}
          {total === 1 ? 'issue' : 'issues'}
        </span>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      {error ? (
        <div className="project-error issue-error">
          <strong>
            Issues could not be loaded
          </strong>

          <p>{error}</p>

          <button
            className="secondary-button"
            type="button"
            onClick={() => void loadIssues()}
          >
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <IssueSkeleton />
      ) : issues.length === 0 ? (
        <IssueEmptyState
          hasFilters={hasFilters}
          canManage={canManage}
          canCreate={floors.length > 0}
          onClearFilters={clearFilters}
          onCreate={() =>
            setIsCreateModalOpen(true)
          }
        />
      ) : (
        <>
          <div className="issue-list">
            {issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                floors={floors}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              className="pagination"
              aria-label="Issue pages"
            >
              <button
                className="secondary-button"
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((currentPage) =>
                    Math.max(
                      1,
                      currentPage - 1,
                    ),
                  )
                }
              >
                Previous
              </button>

              <span>
                Page {page} of {totalPages}
              </span>

              <button
                className="secondary-button"
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((currentPage) =>
                    Math.min(
                      totalPages,
                      currentPage + 1,
                    ),
                  )
                }
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}

      <CreateIssueModal
        isOpen={isCreateModalOpen}
        projectId={projectId}
        token={token}
        floors={floors}
        onClose={() =>
          setIsCreateModalOpen(false)
        }
        onCreated={handleCreated}
      />
    </section>
  );
}

interface IssueCardProps {
  issue: Issue;
  floors: FloorOption[];
}

function IssueCard({
  issue,
  floors,
}: IssueCardProps) {
  const floor = floors.find(
    (item) => item.id === issue.floorId,
  );

  const createdAt = new Intl.DateTimeFormat(
    'en',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(new Date(issue.createdAt));

  return (
    <article className="issue-card">
      <div className="issue-card-main">
        <div className="issue-card-badges">
          <span
            className={`issue-status ${getStatusClass(
              issue.status,
            )}`}
          >
            {getStatusLabel(issue.status)}
          </span>

          <span
            className={`issue-priority ${issue.priority.toLowerCase()}`}
          >
            {getPriorityLabel(issue.priority)}
          </span>
        </div>

        <h3>{issue.title}</h3>

        <p>
          {issue.description ||
            'No description provided.'}
        </p>
      </div>

      <div className="issue-card-meta">
        <div>
          <span>Location</span>
          <strong>
            {floor
              ? getFloorLabel(floor)
              : 'Unknown floor'}
          </strong>
        </div>

        <div>
          <span>Assignee</span>
          <strong>
            {issue.assigneeId
              ? 'Assigned'
              : 'Unassigned'}
          </strong>
        </div>

        <div>
          <span>Created</span>
          <strong>{createdAt}</strong>
        </div>
      </div>
    </article>
  );
}

interface CreateIssueModalProps {
  isOpen: boolean;
  projectId: string;
  token: string;
  floors: FloorOption[];
  onClose: () => void;
  onCreated: () => void;
}

function CreateIssueModal({
  isOpen,
  projectId,
  token,
  floors,
  onClose,
  onCreated,
}: CreateIssueModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] =
    useState('');

  const [priority, setPriority] =
    useState<IssuePriority>('MEDIUM');

  const [floorId, setFloorId] =
    useState('');

  const [error, setError] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!floorId && floors[0]) {
      setFloorId(floors[0].id);
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    );

    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );

      document.body.style.overflow = '';
    };
  }, [
    floorId,
    floors,
    isOpen,
    onClose,
  ]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const normalizedTitle = title.trim();

    if (
      normalizedTitle.length < 3 ||
      !floorId
    ) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const request: CreateIssueRequest = {
      title: normalizedTitle,
      floorId,
      priority,
      ...(description.trim()
        ? {
            description: description.trim(),
          }
        : {}),
    };

    try {
      await apiRequest<Issue>(
        `/projects/${projectId}/issues`,
        {
          method: 'POST',
          token,
          body: request,
        },
      );

      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setFloorId(floors[0]?.id ?? '');

      onCreated();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to create the issue',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBackdropClick(
    event: MouseEvent<HTMLDivElement>,
  ): void {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-issue-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              New issue
            </span>

            <h2 id="create-issue-title">
              Record site issue
            </h2>
          </div>

          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form
          className="project-form"
          onSubmit={handleSubmit}
        >
          <label>
            <span>Title</span>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Cable tray requires support"
              minLength={3}
              maxLength={200}
              autoFocus
              required
            />
          </label>

          <label>
            <span>Description</span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="Describe the issue and required work"
              maxLength={2000}
              rows={5}
            />
          </label>

          <div className="issue-form-grid">
            <label>
              <span>Priority</span>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target
                      .value as IssuePriority,
                  )
                }
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">
                  Medium
                </option>
                <option value="HIGH">
                  High
                </option>
                <option value="CRITICAL">
                  Critical
                </option>
              </select>
            </label>

            <label>
              <span>Floor</span>

              <select
                value={floorId}
                onChange={(event) =>
                  setFloorId(
                    event.target.value,
                  )
                }
                required
              >
                {floors.map((floor) => (
                  <option
                    key={floor.id}
                    value={floor.id}
                  >
                    {getFloorLabel(floor)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <div
              className="form-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              className="primary-button modal-submit"
              type="submit"
              disabled={
                isSubmitting ||
                title.trim().length < 3 ||
                !floorId
              }
            >
              {isSubmitting
                ? 'Creating...'
                : 'Create issue'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface IssueEmptyStateProps {
  hasFilters: boolean;
  canManage: boolean;
  canCreate: boolean;
  onClearFilters: () => void;
  onCreate: () => void;
}

function IssueEmptyState({
  hasFilters,
  canManage,
  canCreate,
  onClearFilters,
  onCreate,
}: IssueEmptyStateProps) {
  return (
    <div className="empty-state issue-empty">
      <div className="empty-icon">
        {hasFilters ? '⌕' : '!'}
      </div>

      <h2>
        {hasFilters
          ? 'No matching issues'
          : 'No issues recorded'}
      </h2>

      <p>
        {hasFilters
          ? 'Change or clear the current filters.'
          : 'There are no site issues in this project.'}
      </p>

      {hasFilters ? (
        <button
          className="primary-button empty-action"
          type="button"
          onClick={onClearFilters}
        >
          Clear filters
        </button>
      ) : (
        canManage &&
        canCreate && (
          <button
            className="primary-button empty-action"
            type="button"
            onClick={onCreate}
          >
            Create issue
          </button>
        )
      )}
    </div>
  );
}

function IssueSkeleton() {
  return (
    <div className="issue-list">
      {Array.from({ length: 4 }).map(
        (_, index) => (
          <div
            className="issue-card issue-skeleton"
            key={index}
          >
            <div className="skeleton line short" />
            <div className="skeleton line wide" />
            <div className="skeleton line" />
          </div>
        ),
      )}
    </div>
  );
}

function getFloorLabel(
  floor: FloorOption,
): string {
  const level =
    floor.level === 0
      ? 'G'
      : floor.level < 0
        ? `B${Math.abs(floor.level)}`
        : String(floor.level);

  return `${floor.buildingName} · ${level}${
    floor.name ? ` · ${floor.name}` : ''
  }`;
}

function getStatusClass(
  status: IssueStatus,
): string {
  return status.toLowerCase().replace(
    '_',
    '-',
  );
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
  priority: IssuePriority,
): string {
  const labels: Record<IssuePriority, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical',
  };

  return labels[priority];
}