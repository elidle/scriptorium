import { prisma } from '../../../../utils/db';
import { authorize } from "../../../middleware/auth";
import { ForbiddenError } from '../../../../errors/ForbiddenError';

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
      data: { 
        content, 
        updatedAt: new Date() 
      },
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
    if (error instanceof ForbiddenError) {
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

    const deletedComment = await prisma.comment.update({
      where: { id },
      data: {
        authorId: null,
        content: null,
        isDeleted: true,
        deletedAt: new Date(),
        isHidden: false,
        hiddenAt: null,
        hiddenById: null,
        updatedAt: new Date(),
      }
    });

    return Response.json( { status: 'success' }, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError) {
      return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}