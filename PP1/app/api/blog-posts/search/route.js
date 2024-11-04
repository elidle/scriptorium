import { prisma } from '@/utils/db';
import { itemsRatingsToMetrics } from '@/utils/blog/metrics';
import { sortItems } from '@/utils/blog/sorts';

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;

  // Filter parameters
  const q = searchParams.get('q') || '';
  const tags = req.nextUrl.searchParams.getAll('tags');
  // TODO: Implement filtering by code template

  // Sorting parameter
  const sortBy = searchParams.get('sortBy') || 'new';

  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        ...(q && { 
          OR: [
            { title: { contains: q } },
            { content: { contains: q } }
          ]
        }),
        ...(tags.length > 0 && {
          tags: {
            some: {
              name: {
                in: tags
              }
            }
          },
        }),
        isDeleted: false,
        isHidden: false
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true
          }
        },
        ratings: {
          select: {
            value: true
          }
        }
      }
    });

    const postsWithMetrics = itemsRatingsToMetrics(posts);
    const sortedPosts = sortItems(postsWithMetrics, sortBy);

    const responsePosts = sortedPosts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.author?.id,
      authorUsername: post.author?.username,
      tags: post.tags.map(tag => ({ id: tag.id, name: tag.name })),
      createdAt: post.createdAt,
      score: post.metrics.totalScore
    }));

    return Response.json(responsePosts, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}