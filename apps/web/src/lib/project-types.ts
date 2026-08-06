export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProjectListResponse {
  items: Project[];
  meta: PaginationMeta;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}
export interface Building {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Floor {
  id: string;
  level: number;
  name: string | null;
  buildingId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuildingRequest {
  name: string;
}

export interface CreateFloorRequest {
  level: number;
  name?: string;
}