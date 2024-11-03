import { prisma } from '@/utils/db';

export async function PUT(req, { params }) {
  try {
    let { content } = await req.json();
    let { id } = params;
    id = Number(id);
    console.log("Received request to update comment with ID: ", id);

    if (!id || !content ) {
      return Response.json(
        { error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment || comment.isDeleted) {
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

export async function DELETE(req, { params }) {
  try {
    let { id } = params;
    id = Number(id);
    console.log("Received request to delete comment with ID: ", id);

    if (!id) {
      return Response.json(
        { error: 'Missing or invalid ID' },
        { status: 400 }
      );
    }

    if (!comment || comment.isDeleted) {
      return Response.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    const deletedComment = await prisma.comment.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: null,
        authorId: null
      }
    });

    return Response.json(deletedComment, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}