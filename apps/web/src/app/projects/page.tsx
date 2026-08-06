'use client';

import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { CreateProjectModal } from '@/components/projects/create-project-modal';
import {
  ApiError,
  apiRequest,
} from '@/lib/api';
import {
  type Project,
  type ProjectListResponse,
} from '@/lib/project-types';
import Link from 'next/link';

const PROJECTS_PER_PAGE = 9;

export default function ProjectsPage() {
  const router = useRouter();

  const {
    user,
    token,
    isLoading: isAuthLoading,
    logout,
  } = useAuth();

  const [projects, setProjects] = useState<
    Project[]
  >([]);

  const [searchInput, setSearchInput] =
    useState('');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] =
    useState(0);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login');
    }
  }, [
    isAuthLoading,
    router,
    user,
  ]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchInput]);

  const loadProjects = useCallback(
    async (): Promise<void> => {
      if (!token) {
        return;
      }

      setIsLoading(true);
      setError(null);

      const parameters = new URLSearchParams({
        page: String(page),
        limit: String(PROJECTS_PER_PAGE),
      });

      if (search) {
        parameters.set('search', search);
      }

      try {
        const response =
          await apiRequest<ProjectListResponse>(
            `/projects?${parameters.toString()}`,
            {
              token,
            },
          );

        setProjects(response.items);
        setTotal(response.meta.total);
        setTotalPages(
          response.meta.totalPages,
        );
      } catch (caughtError) {
        if (
          caughtError instanceof ApiError &&
          caughtError.status === 401
        ) {
          logout();
          router.replace('/login');
          return;
        }

        if (caughtError instanceof ApiError) {
          setError(caughtError.message);
        } else {
          setError(
            'Unable to load projects',
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      logout,
      page,
      router,
      search,
      token,
    ],
  );

  useEffect(() => {
    if (
      !isAuthLoading &&
      user &&
      token
    ) {
      void loadProjects();
    }
  }, [
    isAuthLoading,
    loadProjects,
    token,
    user,
  ]);

  function handleLogout(): void {
    logout();
    router.replace('/login');
  }

  function handleProjectCreated(): void {
    if (page !== 1) {
      setPage(1);
    }

    if (search || searchInput) {
      setSearch('');
      setSearchInput('');
      return;
    }

    void loadProjects();
  }

  if (isAuthLoading || !user || !token) {
    return (
      <main className="page-loading">
        <div className="spinner" />
        <span>Checking session...</span>
      </main>
    );
  }

  return (
    <>
      <main className="dashboard">
        <header className="dashboard-header">
          <div className="brand">
            <span className="brand-mark">
              SF
            </span>
            <span>SiteFlow</span>
          </div>

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
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                Workspace
              </span>

              <h1>Projects</h1>

              <p>
                Manage your construction projects
                and site activity.
              </p>
            </div>

            <button
              className="primary-button compact"
              type="button"
              onClick={() =>
                setIsCreateModalOpen(true)
              }
            >
              Create project
            </button>
          </div>

          <div className="project-toolbar">
            <div className="search-field">
              <span aria-hidden="true">⌕</span>

              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
                placeholder="Search projects"
                aria-label="Search projects"
              />
            </div>

            <div className="project-count">
              {total}{' '}
              {total === 1
                ? 'project'
                : 'projects'}
            </div>
          </div>

          {error ? (
            <ProjectError
              message={error}
              onRetry={() =>
                void loadProjects()
              }
            />
          ) : isLoading ? (
            <ProjectSkeleton />
          ) : projects.length === 0 ? (
            <ProjectEmptyState
              hasSearch={Boolean(search)}
              onCreate={() =>
                setIsCreateModalOpen(true)
              }
              onClearSearch={() =>
                setSearchInput('')
              }
            />
          ) : (
            <>
              <div className="project-grid">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    currentUserId={user.id}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  className="pagination"
                  aria-label="Project pages"
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
                    disabled={
                      page >= totalPages
                    }
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
        </section>
      </main>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        token={token}
        onClose={() =>
          setIsCreateModalOpen(false)
        }
        onCreated={handleProjectCreated}
      />
    </>
  );
}

interface ProjectCardProps {
  project: Project;
  currentUserId: string;
}

function ProjectCard({
  project,
  currentUserId,
}: ProjectCardProps) {
  const createdAt = new Intl.DateTimeFormat(
    'en',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(new Date(project.createdAt));

  const isOwner =
    project.ownerId === currentUserId;

  return (
  <Link
    className="project-card"
    href={`/projects/${project.id}`}
  >
      <div className="project-card-top">
        <div className="project-card-icon">
          {getProjectInitials(project.name)}
        </div>

        <span
          className={
            isOwner
              ? 'role-badge owner'
              : 'role-badge member'
          }
        >
          {isOwner ? 'Owner' : 'Member'}
        </span>
      </div>

      <div className="project-card-content">
        <h2>{project.name}</h2>

        <p>
          {project.description ||
            'No description provided.'}
        </p>
      </div>

      <footer className="project-card-footer">
        <span>Created {createdAt}</span>

        <span aria-hidden="true">→</span>
      </footer>
    </Link>
  );
}

interface ProjectEmptyStateProps {
  hasSearch: boolean;
  onCreate: () => void;
  onClearSearch: () => void;
}

function ProjectEmptyState({
  hasSearch,
  onCreate,
  onClearSearch,
}: ProjectEmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        {hasSearch ? '⌕' : '+'}
      </div>

      <h2>
        {hasSearch
          ? 'No matching projects'
          : 'No projects yet'}
      </h2>

      <p>
        {hasSearch
          ? 'Try a different project name or description.'
          : 'Create a project to start managing site issues.'}
      </p>

      <button
        className="primary-button empty-action"
        type="button"
        onClick={
          hasSearch
            ? onClearSearch
            : onCreate
        }
      >
        {hasSearch
          ? 'Clear search'
          : 'Create project'}
      </button>
    </div>
  );
}

interface ProjectErrorProps {
  message: string;
  onRetry: () => void;
}

function ProjectError({
  message,
  onRetry,
}: ProjectErrorProps) {
  return (
    <div className="project-error">
      <strong>Projects could not be loaded</strong>
      <p>{message}</p>

      <button
        className="secondary-button"
        type="button"
        onClick={onRetry}
      >
        Try again
      </button>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div
      className="project-grid"
      aria-label="Loading projects"
    >
      {Array.from({ length: 6 }).map(
        (_, index) => (
          <div
            className="project-card skeleton-card"
            key={index}
          >
            <div className="skeleton square" />
            <div className="skeleton line wide" />
            <div className="skeleton line" />
            <div className="skeleton line short" />
          </div>
        ),
      )}
    </div>
  );
}

function getProjectInitials(
  projectName: string,
): string {
  const words = projectName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}