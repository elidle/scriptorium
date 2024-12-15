import { prisma } from '../../../../../utils/db';
import { authorize } from "../../../../middleware/auth";
import { fetchCurrentPage } from '../../../../../utils/pagination';
import { ForbiddenError } from '../../../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../../../errors/UnauthorizedError';
import { NextRequest } from 'next/server';

import { PostReports } from '@/app/types/post';

interface PostReportsResponse {
  id: number;
  title: string;
  content: string;
  authorId: number | null;
  authorUsername: string | null;
  createdAt: Date;
  reportCount: number;
}

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const searchParams = req.nextUrl.searchParams;
    await authorize(req, ['admin']);

    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '10');

    if (!page || !limit) {
      return Response.json(
        { status: 'error', error: 'Invalid page parameter' },
        { status: 400 }
      );
    }

    const posts = await prisma.blogPost.findMany({
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
            id: true,
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

    const paginatedPosts = fetchCurrentPage(posts, page, limit);

    const curPage = paginatedPosts.curPage.map((post: PostReports) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.author?.id,
      authorUsername: post.author?.username,
      createdAt: post.createdAt,
      reportCount: post._count.reports
    })) as PostReportsResponse[];

    const hasMore = paginatedPosts.hasMore;
    const nextPage = hasMore ? page + 1 : null;

    return Response.json({ posts: curPage, hasMore, nextPage }, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      return Response.json(
        { status: 'error', error: error.message },
        { status: error.statusCode }
      );
    }
    return Response.json(
      { status: 'error', error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}