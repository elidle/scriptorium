import { prisma } from '../../../../utils/db';
import { authorize } from "../../../middleware/auth";
import { ForbiddenError } from '../../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../../errors/UnauthorizedError';

export async function PUT(req, { params }) {
  try {
    let { content } = await req.json();
    let { id } = params;
    id = Number(id);
    console.log("Received request to update comment with ID: ", id);

    if (!id || !content ) {
      return Response.json(
        { status: 'error', error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment || comment.isDeleted) {
      return Response.json(
        { status: 'error', error: 'Comment not found' },
        { status: 404 }
      );
    }

    await authorize(req, ['user', 'admin'], comment.authorId);

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content },
      select: {
        id: true,
        authorId: true,
        author: { select: { username: true } }, 
        content: true,
        postId: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return Response.json(updatedComment, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      return Response.json({ status: "error", message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    let { id } = params;
    id = Number(id);
    console.log("Received request to delete comment with ID: ", id);

    if (!id) {
      return Response.json(
        { status: 'error', error: 'Missing or invalid ID' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment || comment.isDeleted) {
      return Response.json(
        { status: 'error', error: 'Comment not found' },
        { status: 404 }
      );
    }

    await authorize(req, ['user', 'admin'], comment.authorId);

    await prisma.comment.update({
      where: { id },
      data: {
        authorId: null,
        content: null,
        isDeleted: true,
        deletedAt: new Date(),
        isHidden: false,
        hiddenAt: null,
        hiddenById: null
      }
    });

    return Response.json( { status: 'success' }, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

export async function GET(req, { params }) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = Number(searchParams.get('userId'));

    let canViewHidden = false;

    if (userId) {
      await authorize(req, ['user', 'admin'], userId);
    }

    let { id } = params;
    id = Number(id);

    if (!id) {
      return Response.json(
        { status: 'error', error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        content: true,
        authorId: true,
        createdAt: true,
        isHidden: true,
        isDeleted: true,
        author: {
          select: { username: true }
        },
        ratings: {
          select: {
            value: true,
            ...(userId && { userId: true })
          }
        },
        postId: true
      }
    });

    if (!comment) {
      return Response.json(
        { status: 'error', error: 'Comment not found' },
        { status: 404 }
      );
    }

    // set can view hidden
    // either user is admin, or user is the author of the post

    if (userId) {
      // at this point userId matches the logged in user
      // check for adminship first
      try {
        await authorize(req, ['admin']);
        canViewHidden = true;
      } catch {
        // not admin, check if user is author
        canViewHidden = userId === comment.authorId;
      }
    }

    const processComment = (c) => ({
      id: c.id,
      content: c.isHidden
        ? `[This comment has been hidden by a moderator.]${canViewHidden ? '\n\n' + c.content : ''}`
        : c.content,
      authorId: c.authorId,
      authorUsername: c.author?.username ?? "[deleted]",
      createdAt: c.createdAt,
      score: c.ratings.reduce((sum, r) => sum + r.value, 0),
      allowAction: !c.isDeleted && !c.isHidden,
      userVote: userId ? c.ratings.find(r => r.userId === userId)?.value || 0 : 0,
      postId: c.postId
    });

    return Response.json(processComment(comment), { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { status: 'error', error: 'Failed to fetch comment' },
      { status: 500 }
    );
  }
}