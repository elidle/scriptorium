import { prisma } from '@/utils/db';
import { itemsRatingsToMetrics } from '@/utils/blog/metrics';
import { sortItems } from '@/utils/blog/sorts';

export async function POST(req) {
  try {
    let { content, authorId, parentId, postId } = await req.json();
    authorId = Number(authorId);
    parentId = parentId ? Number(parentId) : null;
    postId = Number(postId);

    if (!content || !authorId || !postId) {
      return Response.json(
        { error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    const author = await prisma.user.findUnique({
      where: { id: authorId }
    });

    if (!author) {
      return Response.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }

    const blogPost = await prisma.blogPost.findUnique({
      where: { id: postId }
    });

    if (!blogPost) {
      return Response.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment) {
        return Response.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }

      if (parentComment.postId !== postId) {
        return Response.json(
          { error: 'Parent comment does not belong to the specified blog post' },
          { status: 400 }
        );
      }
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        author: { connect: { id: authorId } },
        post: { connect: { id: postId } },
        parent: parentId ? { connect: { id: parentId } } : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true
          }
        },
        parent: true
      }
    });

    return Response.json(newComment, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const postId = Number(searchParams.get('postId'));

    // Sorting parameter
    const sortBy = searchParams.get('sortBy') || 'new';

    if (!postId) {
      return Response.json(
        { error: 'Invalid or missing postId' },
        { status: 400 }
      );
    }

    const blogPost = await prisma.blogPost.findUnique({
      where: { id: postId }
    });

    if (!blogPost) {
      return Response.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        postId: true,
        parentId: true,
        isHidden: true,
        author: {
          select: {
            id: true,
            username: true
          }
        },
        // Get immediate replies only (can be paginated/fetched separately if needed)
        replies: {
          where: {
            isDeleted: false,
            isHidden: false
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                username: true
              }
            },
            ratings: {
              select: {
                value: true
              }
            }
          }
        },
        ratings: {
          select: {
            value: true
          }
        }
      }
    });

    const commentsWithMetrics = itemsRatingsToMetrics(comments);

    const topLevelComments = commentsWithMetrics.filter(comment => !comment.parentId);
    const replies = commentsWithMetrics.filter(comment => comment.parentId);

    const sortedTopLevelComments = sortItems(topLevelComments, sortBy);
    const sortedReplies = sortItems(replies, 'old');

    const allSortedComments = [...sortedTopLevelComments, ...sortedReplies];

    const commentTree = buildCommentTree(allSortedComments);
    
    const optimizeComment = (comment) => ({
      id: comment.id,
      content: comment.isHidden 
        ? "This comment has been hidden by a moderator."
        : comment.content,
      authorId: comment.author.id,
      authorUsername: comment.author.username,
      createdAt: comment.createdAt,
      score: comment.metrics.totalScore,
      replies: comment.replies?.map(reply => optimizeComment(reply)) || []
    });

    const responseCommentTree = commentTree.map(comment => optimizeComment(comment));

    return Response.json(responseCommentTree, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

function buildCommentTree(comments) {
  const commentMap = new Map();
  const rootComments = [];

  comments.forEach(comment => {
    comment.replies = [];
    commentMap.set(comment.id, comment);
  });

  comments.forEach(comment => {
    if (comment.parentId) {
      const parentComment = commentMap.get(comment.parentId);
      if (parentComment) {
        parentComment.replies.push(comment);
      }
    } else {
      rootComments.push(comment);
    }
  });

  return rootComments;
}

function hideContent(comment) {
  return {
    ...comment,
    content: comment.isHidden 
      ? '[This comment has been hidden by a moderator.]' 
      : comment.content,
    replies: comment.replies.map(reply => hideContent(reply))
  };
}