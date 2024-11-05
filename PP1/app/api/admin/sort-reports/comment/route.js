import { prisma } from '../../../../../utils/db';
import { authorize } from "../../../../middleware/auth";
import { fetchCurrentPage } from '../../../../../utils/pagination';
import { ForbiddenError } from '../../../../../errors/ForbiddenError';

export async function GET(req) {
  try {
    const searchParams = req.nextUrl.searchParams;
    // await authorize(req, ['admin']);

    // Pagination parameters
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '10');

    if (!page || !limit) {
      return Response.json(
        { status: 'error', error: 'Invalid page parameter' },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        reports: {
          some: {}
        },
        isDeleted: false,
        isHidden: false
      },
      include: {
        author: {
          select: {
            username: true
          }
        },
        _count: {
          select: {
            reports: true
          }
        }
      },
      orderBy: {
        reports: {
          _count: 'desc'
        }
      }
    });

    const paginatedComments = fetchCurrentPage(comments, page, limit);

    const curPage = paginatedComments.curPage.map(comment => ({
      id: comment.id,
      content: comment.content,
      authorId: comment.author?.id,
      authorUsername: comment.author?.username,
      postId: comment.postId,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      reportCount: comment._count.report
    }));

    const hasMore = paginatedComments.hasMore;
    const nextPage = hasMore ? page + 1 : null;

    return Response.json( { comments: curPage, hasMore: hasMore, nextPage: nextPage }, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError) {
      return Response.json(
        { status: 'error', error: 'You are not authorized to view this page' },
        { status: 403 }
      );
    }
    return Response.json(
      { status: 'error', error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}