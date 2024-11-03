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
            name: true,
            email: true
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

export async function PUT(req) {
  try {
    let { id, content } = await req.json();
    id = Number(id);

    if (!id || !content ) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      return Response.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content }
    });

    return Response.json(updatedComment, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Failed to update comment' },
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
      include: {
        author: {
          select: {
            id: true,
            username: true
          }
        },
        parent: true,
        ratings: {
          select: {
            value: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const commentsWithMetrics = itemsRatingsToMetrics(comments);

    const topLevelComments = commentsWithMetrics.filter(comment => !comment.parentId);
    const replies = commentsWithMetrics.filter(comment => comment.parentId);

    const sortedTopLevelComments = sortItems(topLevelComments, sortBy);
    const sortedReplies = sortItems(replies, 'old');

    const allSortedComments = [...sortedTopLevelComments, ...sortedReplies];

    const commentTree = buildCommentTree(allSortedComments);

    return Response.json(commentTree, { status: 200 });
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