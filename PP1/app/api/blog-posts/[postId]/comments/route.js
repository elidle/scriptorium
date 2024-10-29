import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req, { params }) {
  try {
    let { content, authorId, parentId } = await req.json();
    authorId = Number(authorId);
    parentId = Number(parentId);

    const pathSegments = req.nextUrl.pathname.split('/');
    const postId = Number(pathSegments[pathSegments.indexOf('blog-posts') + 1]);

    if (!content || !authorId || !postId) {
      return new Response(JSON.stringify({ error: 'Invalid or missing required fields' }), { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        author: { connect: { id: authorId } },
        post: { connect: { id: postId } },
        parent: parentId ? { connect: { id: parentId } } : undefined,
      },
    });

    return new Response(JSON.stringify(newComment), { status: 201 });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to add comment' });
  }
}

export async function GET(req, { params }) {
  try {
    const pathSegments = req.nextUrl.pathname.split('/');
    const postId = Number(pathSegments[pathSegments.indexOf('blog-posts') + 1]);

    if (!postId) {
      return new Response(JSON.stringify({ error: 'Invalid or missing postId' }), { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        author: true,
        parent: true,
      },
    });

    return new Response(JSON.stringify(comments), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to fetch comments' }), { status: 500 });
  }
}
