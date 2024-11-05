import { prisma } from '../../../../../../utils/db';
import { authorize } from "../../../../../middleware/auth";
import { fetchCurrentPage } from '../../../../../../utils/pagination';
import { ForbiddenError } from '../../../../../../errors/ForbiddenError';

export async function GET(req, { params }) {
  try {
    const searchParams = req.nextUrl.searchParams;
    await authorize(req, ['admin']);

    let { id } = params;
    id = Number(id);
    if (!id) {
      return Response.json(
        { status: 'error', error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // Pagination parameters
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
      reportedBy: report.reporter.username ?? '[deleted]',
      reportedAt: report.createdAt
    }));

    const paginatedReports = fetchCurrentPage(reports, page, limit);

    const hasMore = paginatedReports.hasMore;
    const nextPage = hasMore ? page + 1 : null;

    return Response.json( { reports: paginatedReports.curPage, hasMore: hasMore, nextPage: nextPage }, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError) {
      return Response.json(
        { status: 'error', error: 'You are not authorized to view this page' },
        { status: 403 }
      );
    }
    return Response.json(
      { status: 'error', error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}