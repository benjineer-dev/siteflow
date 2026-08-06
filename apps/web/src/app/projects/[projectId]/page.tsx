'use client';
import {
  IssueBoard,
  type FloorOption,
} from '@/components/projects/issue-board';
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
  type Building,
  type CreateBuildingRequest,
  type CreateFloorRequest,
  type Floor,
  type Project,
  type ProjectMember,
  type ProjectRole,
} from '@/lib/project-types';

interface BuildingWithFloors extends Building {
  floors: Floor[];
  isLoadingFloors: boolean;
}

export default function ProjectPage() {
  const router = useRouter();

  const params = useParams<{
    projectId: string;
  }>();

  const projectId = params.projectId;

  const {
    user,
    token,
    isLoading: isAuthLoading,
    logout,
  } = useAuth();

  const [project, setProject] =
    useState<Project | null>(null);
const [members, setMembers] = useState<
  ProjectMember[]
>([]);
  const [buildings, setBuildings] = useState<
    BuildingWithFloors[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [buildingName, setBuildingName] =
    useState('');

  const [isCreatingBuilding, setIsCreatingBuilding] =
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

  const handleUnauthorized =
    useCallback((): void => {
      logout();
      router.replace('/login');
    }, [logout, router]);

  const loadFloorList = useCallback(
    async (
      buildingId: string,
    ): Promise<Floor[]> => {
      if (!token) {
        return [];
      }

      return apiRequest<Floor[]>(
        `/projects/${projectId}` +
          `/buildings/${buildingId}/floors`,
        {
          token,
        },
      );
    },
    [projectId, token],
  );

  const loadWorkspace = useCallback(
    async (): Promise<void> => {
      if (!token) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [
  projectResponse,
  buildingResponse,
  memberResponse,
] = await Promise.all([
  apiRequest<Project>(
    `/projects/${projectId}`,
    {
      token,
    },
  ),
  apiRequest<Building[]>(
    `/projects/${projectId}/buildings`,
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
]);

          setProject(projectResponse);
          setMembers(memberResponse);

        const buildingsWithLoadingState =
          buildingResponse.map(
            (building) => ({
              ...building,
              floors: [],
              isLoadingFloors: true,
            }),
          );

        setBuildings(
          buildingsWithLoadingState,
        );

        const floorLists = await Promise.all(
          buildingResponse.map(
            async (building) => ({
              buildingId: building.id,
              floors: await loadFloorList(
                building.id,
              ),
            }),
          ),
        );

        setBuildings((currentBuildings) =>
          currentBuildings.map((building) => {
            const floorList = floorLists.find(
              (item) =>
                item.buildingId === building.id,
            );

            return {
              ...building,
              floors: floorList?.floors ?? [],
              isLoadingFloors: false,
            };
          }),
        );
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
            'Project not found or access denied',
          );
          return;
        }

        setError(
          caughtError instanceof ApiError
            ? caughtError.message
            : 'Unable to load the project',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      handleUnauthorized,
      loadFloorList,
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
      void loadWorkspace();
    }
  }, [
    isAuthLoading,
    loadWorkspace,
    token,
    user,
  ]);

  async function handleCreateBuilding(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!token || !project) {
      return;
    }

    const name = buildingName.trim();

    if (name.length < 2) {
      return;
    }

    setIsCreatingBuilding(true);
    setError(null);

    const request: CreateBuildingRequest = {
      name,
    };

    try {
      const building =
        await apiRequest<Building>(
          `/projects/${project.id}/buildings`,
          {
            method: 'POST',
            token,
            body: request,
          },
        );

      setBuildings((currentBuildings) => [
        ...currentBuildings,
        {
          ...building,
          floors: [],
          isLoadingFloors: false,
        },
      ]);

      setBuildingName('');
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
          : 'Unable to create the building',
      );
    } finally {
      setIsCreatingBuilding(false);
    }
  }

  async function handleCreateFloor(
    buildingId: string,
    request: CreateFloorRequest,
  ): Promise<void> {
    if (!token) {
      return;
    }

    try {
      const floor =
        await apiRequest<Floor>(
          `/projects/${projectId}` +
            `/buildings/${buildingId}/floors`,
          {
            method: 'POST',
            token,
            body: request,
          },
        );

      setBuildings((currentBuildings) =>
        currentBuildings.map((building) =>
          building.id === buildingId
            ? {
                ...building,
                floors: [
                  ...building.floors,
                  floor,
                ].sort(
                  (firstFloor, secondFloor) =>
                    firstFloor.level -
                    secondFloor.level,
                ),
              }
            : building,
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

      throw caughtError;
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
        <span>Loading project...</span>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="workspace-error-page">
        <div className="workspace-error-card">
          <span className="eyebrow">
            SiteFlow
          </span>

          <h1>Project unavailable</h1>

          <p>
            {error ??
              'The project could not be loaded.'}
          </p>

          <Link
            className="primary-link"
            href="/projects"
          >
            Back to projects
          </Link>
        </div>
      </main>
    );
  }

    const isOwner = project.ownerId === user.id;
    const membership = members.find(
  (member) => member.userId === user.id,
);

const accessRole: ProjectRole = isOwner
  ? 'OWNER'
  : membership?.role ?? 'CONTRACTOR';

const canManageIssues =
  accessRole === 'OWNER' ||
  accessRole === 'ENGINEER';

const floorOptions: FloorOption[] =
  buildings
    .flatMap((building) =>
      building.floors.map((floor) => ({
        id: floor.id,
        level: floor.level,
        name: floor.name,
        buildingName: building.name,
      })),
    )
    .sort((firstFloor, secondFloor) => {
      const buildingComparison =
        firstFloor.buildingName.localeCompare(
          secondFloor.buildingName,
        );

      if (buildingComparison !== 0) {
        return buildingComparison;
      }

      return (
        firstFloor.level -
        secondFloor.level
      );
    });

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

          <span>{project.name}</span>
        </nav>

        <div className="project-workspace-heading">
          <div>
            <div className="workspace-title-row">
              <span className="eyebrow">
                Project workspace
              </span>

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

            <h1>{project.name}</h1>

            <p>
              {project.description ||
                'No project description.'}
            </p>
          </div>
        </div>

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

        <div className="workspace-section-heading">
          <div>
            <h2>Site structure</h2>

            <p>
              Buildings and floors included in
              this project.
            </p>
          </div>
        </div>

        {isOwner && (
          <form
            className="inline-create-form"
            onSubmit={handleCreateBuilding}
          >
            <input
              type="text"
              value={buildingName}
              onChange={(event) =>
                setBuildingName(
                  event.target.value,
                )
              }
              placeholder="Building name"
              minLength={2}
              maxLength={150}
              required
            />

            <button
              className="primary-button compact"
              type="submit"
              disabled={
                isCreatingBuilding ||
                buildingName.trim().length < 2
              }
            >
              {isCreatingBuilding
                ? 'Adding...'
                : 'Add building'}
            </button>
          </form>
        )}

        {buildings.length === 0 ? (
          <div className="empty-state workspace-empty">
            <div className="empty-icon">
              +
            </div>

            <h2>No buildings yet</h2>

            <p>
              {isOwner
                ? 'Add the first building to create the project structure.'
                : 'The project owner has not added any buildings.'}
            </p>
          </div>
        ) : (
          <div className="building-list">
            {buildings.map((building) => (
              <BuildingCard
                key={building.id}
                building={building}
                canManage={isOwner}
                onCreateFloor={
                  handleCreateFloor
                }
              />
            ))}
          </div>
              )}
              <IssueBoard
  projectId={projectId}
  token={token}
  floors={floorOptions}
  canManage={canManageIssues}
/>
      </section>
    </main>
  );
}

interface BuildingCardProps {
  building: BuildingWithFloors;
  canManage: boolean;
  onCreateFloor: (
    buildingId: string,
    request: CreateFloorRequest,
  ) => Promise<void>;
}

function BuildingCard({
  building,
  canManage,
  onCreateFloor,
}: BuildingCardProps) {
  const [level, setLevel] =
    useState('');

  const [name, setName] =
    useState('');

  const [error, setError] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const parsedLevel = Number(level);

    if (
      !Number.isInteger(parsedLevel)
    ) {
      setError(
        'Floor level must be a whole number',
      );
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onCreateFloor(
        building.id,
        {
          level: parsedLevel,
          ...(name.trim()
            ? {
                name: name.trim(),
              }
            : {}),
        },
      );

      setLevel('');
      setName('');
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to create the floor',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="building-card">
      <header className="building-card-header">
        <div>
          <span className="building-label">
            Building
          </span>

          <h3>{building.name}</h3>
        </div>

        <span className="floor-count">
          {building.floors.length}{' '}
          {building.floors.length === 1
            ? 'floor'
            : 'floors'}
        </span>
      </header>

      {building.isLoadingFloors ? (
        <div className="floor-loading">
          Loading floors...
        </div>
      ) : building.floors.length === 0 ? (
        <div className="floor-empty">
          No floors added
        </div>
      ) : (
        <div className="floor-list">
          {building.floors.map((floor) => (
            <div
              className="floor-row"
              key={floor.id}
            >
              <div className="floor-level">
                {formatFloorLevel(
                  floor.level,
                )}
              </div>

              <div>
                <strong>
                  {floor.name ||
                    `Level ${floor.level}`}
                </strong>

                <span>
                  Floor level {floor.level}
                </span>
              </div>

              <span className="floor-arrow">
                →
              </span>
            </div>
          ))}
        </div>
      )}

      {canManage && (
        <form
          className="floor-create-form"
          onSubmit={handleSubmit}
        >
          <div className="floor-form-fields">
            <label>
              <span>Level</span>

              <input
                type="number"
                value={level}
                onChange={(event) =>
                  setLevel(event.target.value)
                }
                placeholder="1"
                step="1"
                required
              />
            </label>

            <label>
              <span>Name</span>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Ground floor"
                maxLength={100}
              />
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

          <button
            className="secondary-button add-floor-button"
            type="submit"
            disabled={
              isSubmitting ||
              level.trim() === ''
            }
          >
            {isSubmitting
              ? 'Adding...'
              : 'Add floor'}
          </button>
        </form>
      )}
    </article>
  );
}

function formatFloorLevel(
  level: number,
): string {
  if (level === 0) {
    return 'G';
  }

  if (level < 0) {
    return `B${Math.abs(level)}`;
  }

  return String(level);
}