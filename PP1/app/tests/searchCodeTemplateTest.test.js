import { GET } from '../api/code-template/search/route';
import { prisma } from '../../utils/db';

jest.mock('../../utils/db', () => ({
  prisma: {
    codeTemplate: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/code-template/search', () => {
  const mockRequest = (searchParams) => ({
    nextUrl: {
      searchParams: new URLSearchParams(searchParams),
    },
  });

  it('returns templates based on query and tags', async () => {
    const req = mockRequest({ q: 'test', tags: 'tag1,tag2', userId: '1' });
    prisma.codeTemplate.findMany.mockResolvedValue([{ id: 1, title: 'test' }]);

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual([{ id: 1, title: 'test' }]);
  });

  it('returns templates when no query is provided', async () => {
    const req = mockRequest({ tags: 'tag1,tag2', userId: '1' });
    prisma.codeTemplate.findMany.mockResolvedValue([{ id: 1, title: 'test' }]);

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual([{ id: 1, title: 'test' }]);
  });

  it('returns error when prisma throws an error', async () => {
    const req = mockRequest({ q: 'test', tags: 'tag1,tag2', userId: '1' });
    prisma.codeTemplate.findMany.mockRejectedValue(new Error('Database error'));

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ status: 'error', message: 'Failed to fetch templates' });
  });

  it('skips userId if not provided', async () => {
    const req = mockRequest({ q: 'test', tags: 'tag1,tag2' });
    prisma.codeTemplate.findMany.mockResolvedValue([{ id: 1, title: 'test' }]);

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual([{ id: 1, title: 'test' }]);
  });

  it('skips tags if not provided', async () => {
    const req = mockRequest({ q: 'test', userId: '1' });
    prisma.codeTemplate.findMany.mockResolvedValue([{ id: 1, title: 'test' }]);

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual([{ id: 1, title: 'test' }]);
  });
});