import { prisma } from '../../../../utils/db';
// import { authorize } from '@/utils/auth';

export async function PUT(req, { params }) {
  // await authorize(req, ['admin', 'user']);

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

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content }
    });

    return Response.json(updatedComment, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { status: 'error', error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  // await authorize(req, ['admin', 'user']);

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

    if (!comment || comment.isDeleted) {
      return Response.json(
        { status: 'error', error: 'Comment not found' },
        { status: 404 }
      );
    }

    const deletedComment = await prisma.comment.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: null,
        authorId: null,
        isHidden: false,
        hiddenAt: null,
        hiddenById: null
      }
    });

    return Response.json( { status: 'success' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { status: 'error', error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}