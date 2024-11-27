import { prisma } from '../../../../../../utils/db';
import { authorize } from "../../../../../middleware/auth";
import { fetchCurrentPage } from '../../../../../../utils/pagination';
import { ForbiddenError } from '../../../../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../../../../errors/UnauthorizedError';
import { NextRequest } from 'next/server';

interface PostReportResponse {
  id: number;
  reason: string;
  reporterId: number;
  reporterUsername: string;
  createdAt: Date;
}

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const searchParams = req.nextUrl.searchParams;
    await authorize(req, ['admin']);

    const id = Number(params.id);
    if (!id) {
      return Response.json(
        { status: 'error', error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '10');

    if (!page || !limit) {
      return Response.json(
        { status: 'error', error: 'Invalid page parameter' },
        { status: 400 }
      );
    }

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        reports: {
          include: {
            reporter: {
              select: {
                id: true,
                username: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            reports: true
          }
        }
      }
    });

    if (!post || post.isDeleted) {
      return Response.json(
        { status: 'error', error: 'Post not found' },
        { status: 404 }
      );
    }

    const reports = post.reports.map(report => ({
      id: report.id,
      reason: report.reason,
      reporterId: report.reporter.id,
      reporterUsername: report.reporter.username,
      createdAt: report.createdAt
    })) as PostReportResponse[];

    const paginatedReports = fetchCurrentPage(reports, page, limit);

    const hasMore = paginatedReports.hasMore;
    const nextPage = hasMore ? page + 1 : null;

    return Response.json({ reports: paginatedReports.curPage, hasMore, nextPage }, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      return Response.json(
        { status: 'error', error: error.message },
        { status: error.statusCode }
      );
    }
    return Response.json(
      { status: 'error', error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}