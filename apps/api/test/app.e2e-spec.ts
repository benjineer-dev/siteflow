import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
}

interface BuildingResponse {
  id: string;
  name: string;
  projectId: string;
}

interface FloorResponse {
  id: string;
  level: number;
  name: string | null;
  buildingId: string;
}

interface MemberResponse {
  id: string;
  projectId: string;
  userId: string;
  role: string;
}

interface IssueResponse {
  id: string;
  title: string;
  status: string;
  priority: string;
  floorId: string;
  authorId: string;
}

describe('SiteFlow API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
    await prisma.$disconnect();
    await app.close();
  });

  async function clearDatabase(): Promise<void> {
    if (!prisma) {
      return;
    }

    await prisma.$transaction([
      prisma.attachment.deleteMany(),
      prisma.issueComment.deleteMany(),
      prisma.issue.deleteMany(),
      prisma.floor.deleteMany(),
      prisma.building.deleteMany(),
      prisma.projectMember.deleteMany(),
      prisma.project.deleteMany(),
      prisma.user.deleteMany(),
    ]);
  }

  async function register(
    email: string,
    name: string,
  ): Promise<AuthResponse> {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        name,
        password: 'SiteFlow123',
      })
      .expect(201);

    return response.body as AuthResponse;
  }

  function bearer(token: string): string {
    return `Bearer ${token}`;
  }

  it('registers a user and returns the current user', async () => {
    const auth = await register(
      'owner@example.com',
      'Project Owner',
    );

    expect(auth.accessToken).toEqual(expect.any(String));
    expect(auth.user.email).toBe('owner@example.com');
    expect(auth.user).not.toHaveProperty('password');
    expect(auth.user).not.toHaveProperty('passwordHash');

    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(
        'Authorization',
        bearer(auth.accessToken),
      )
      .expect(200);

    expect(response.body).toMatchObject({
      id: auth.user.id,
      email: 'owner@example.com',
      name: 'Project Owner',
    });
  });

  it('rejects invalid registration input', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        name: 'A',
        password: '123',
        unexpectedField: true,
      })
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining([
        expect.any(String),
      ]),
    );
  });

  it('enforces project roles and issue permissions', async () => {
    const owner = await register(
      'owner@example.com',
      'Project Owner',
    );

    const engineer = await register(
      'engineer@example.com',
      'Site Engineer',
    );

    const contractor = await register(
      'contractor@example.com',
      'Contractor',
    );

    const outsider = await register(
      'outsider@example.com',
      'Outsider',
    );

    const projectResponse = await request(
      app.getHttpServer(),
    )
      .post('/api/projects')
      .set(
        'Authorization',
        bearer(owner.accessToken),
      )
      .send({
        name: 'North Residential Complex',
        description: 'SiteFlow test project',
      })
      .expect(201);

    const project =
      projectResponse.body as ProjectResponse;

    const buildingResponse = await request(
      app.getHttpServer(),
    )
      .post(
        `/api/projects/${project.id}/buildings`,
      )
      .set(
        'Authorization',
        bearer(owner.accessToken),
      )
      .send({
        name: 'Tower A',
      })
      .expect(201);

    const building =
      buildingResponse.body as BuildingResponse;

    const floorResponse = await request(
      app.getHttpServer(),
    )
      .post(
        `/api/projects/${project.id}` +
          `/buildings/${building.id}/floors`,
      )
      .set(
        'Authorization',
        bearer(owner.accessToken),
      )
      .send({
        level: 27,
        name: 'Residential floor',
      })
      .expect(201);

    const floor =
      floorResponse.body as FloorResponse;

    const engineerMemberResponse = await request(
      app.getHttpServer(),
    )
      .post(
        `/api/projects/${project.id}/members`,
      )
      .set(
        'Authorization',
        bearer(owner.accessToken),
      )
      .send({
        email: engineer.user.email,
        role: 'ENGINEER',
      })
      .expect(201);

    const engineerMember =
      engineerMemberResponse.body as MemberResponse;

    expect(engineerMember.userId).toBe(
      engineer.user.id,
    );
    expect(engineerMember.role).toBe('ENGINEER');

    await request(app.getHttpServer())
      .post(
        `/api/projects/${project.id}/members`,
      )
      .set(
        'Authorization',
        bearer(owner.accessToken),
      )
      .send({
        email: contractor.user.email,
        role: 'CONTRACTOR',
      })
      .expect(201);

    const issueResponse = await request(
      app.getHttpServer(),
    )
      .post(
        `/api/projects/${project.id}/issues`,
      )
      .set(
        'Authorization',
        bearer(engineer.accessToken),
      )
      .send({
        title: 'Cable is not secured',
        description:
          'Additional fastening is required.',
        priority: 'HIGH',
        floorId: floor.id,
      })
      .expect(201);

    const issue =
      issueResponse.body as IssueResponse;

    expect(issue).toMatchObject({
      title: 'Cable is not secured',
      priority: 'HIGH',
      status: 'OPEN',
      floorId: floor.id,
      authorId: engineer.user.id,
    });

    await request(app.getHttpServer())
      .post(
        `/api/projects/${project.id}/issues`,
      )
      .set(
        'Authorization',
        bearer(contractor.accessToken),
      )
      .send({
        title: 'Contractor-created issue',
        floorId: floor.id,
      })
      .expect(403);

    const contractorIssues = await request(
      app.getHttpServer(),
    )
      .get(
        `/api/projects/${project.id}/issues`,
      )
      .set(
        'Authorization',
        bearer(contractor.accessToken),
      )
      .expect(200);

    expect(contractorIssues.body.items).toHaveLength(1);
    expect(contractorIssues.body.items[0].id).toBe(
      issue.id,
    );

    await request(app.getHttpServer())
      .get(`/api/projects/${project.id}`)
      .set(
        'Authorization',
        bearer(outsider.accessToken),
      )
      .expect(404);
  });
});