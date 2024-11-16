import { prisma } from '../../../utils/db';
import { itemsRatingsToMetrics } from '../../../utils/blog/metrics';
import { sortItems } from '../../../utils/blog/sorts';
import { fetchCurrentPage } from '../../../utils/pagination';
import { authorize } from "../../middleware/auth";
import { ForbiddenError } from "../../../errors/ForbiddenError";

export async function POST(req) {
  try {
    let { content, authorId, parentId, postId } = await req.json();
    authorId = Number(authorId);
    parentId = parentId ? Number(parentId) : null;
    postId = Number(postId);

    if (!content || !authorId || !postId) {
      return Response.json(
        { status: 'error', error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    await authorize(req, ['user', 'admin'], authorId);

    const author = await prisma.user.findUnique({
      where: { id: authorId }
    });

    if (!author) {
      return Response.json(
        { status: 'error', error: 'Author not found' },
        { status: 404 }
      );
    }

    const blogPost = await prisma.blogPost.findUnique({
      where: { id: postId }
    });

    if (!blogPost) {
      return Response.json(
        { status: 'error', error: 'Blog post not found' },
        { status: 404 }
      );
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment || parentComment.isDeleted) {
        return Response.json(
          { status: 'error', error: 'Parent comment not found' },
          { status: 404 }
        );
      }

      if (parentComment.postId !== postId) {
        return Response.json(
          { status: 'error', error: 'Parent comment does not belong to the specified blog post' },
          { status: 400 }
        );
      }
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        author: { connect: { id: authorId } },
        post: { connect: { id: postId } },
        ...(parentId && { parent: { connect: { id: parentId } } })
      },
      select: {
        id: true,
        authorId: true,
        author: { select: { username: true } }, 
        content: true,
        postId: true,
        parentId: true,
        createdAt: true,
      }
    });

    return Response.json(newComment, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError) {
      return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to add comment' },
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

    if (!['new', 'old', 'top', 'controversial'].includes(sortBy)) {
      return Response.json(
        { status: 'error', error: 'Invalid sort parameter' },
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

    if (!postId) {
      return Response.json(
        { status: 'error', error: 'Invalid or missing postId' },
        { status: 400 }
      );
    }

    const blogPost = await prisma.blogPost.findUnique({
      where: { id: postId }
    });

    if (!blogPost) {
      return Response.json(
        { status: 'error', error: 'Blog post not found' },
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
        isDeleted: true,
        author: {
          select: {
            id: true,
            username: true
          }
        },
        replies: {
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
      authorId: comment.author?.id ?? null,
      authorUsername: comment.author?.username ?? "[deleted]",
      createdAt: comment.createdAt,
      score: comment.metrics.totalScore,
      allowVoting: !comment.isDeleted && !comment.isHidden,
      replies: comment.replies?.map(reply => optimizeComment(reply)) || []
    });

    const paginatedCommentTree = fetchCurrentPage(commentTree, page, limit);
    const curPage = paginatedCommentTree.curPage.map(comment => optimizeComment(comment));
    const hasMore = paginatedCommentTree.hasMore;
    const nextPage = hasMore ? page + 1 : null;

    return Response.json( { comments: curPage, hasMore: hasMore, nextPage: nextPage}, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { status: 'error', error: 'Failed to fetch comments' },
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