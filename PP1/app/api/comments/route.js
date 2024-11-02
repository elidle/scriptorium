import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    let { content, authorId, parentId, postId } = await req.json();
    authorId = Number(authorId);
    parentId = parentId ? Number(parentId) : null;
    postId = Number(postId);

    if (!content || !authorId || !postId) {
      return NextResponse.json(
        { error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    const author = await prisma.user.findUnique({
      where: { id: authorId }
    });

    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }

    const blogPost = await prisma.blogPost.findUnique({
      where: { id: postId }
    });

    if (!blogPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }

      if (parentComment.postId !== postId) {
        return NextResponse.json(
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

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const postId = Number(searchParams.get('postId'));

    if (!postId) {
      return NextResponse.json(
        { error: 'Invalid or missing postId' },
        { status: 400 }
      );
    }

    const blogPost = await prisma.blogPost.findUnique({
      where: { id: postId }
    });

    if (!blogPost) {
      return NextResponse.json(
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

    const commentsWithMetrics = comment.map(comment => {
      const upvotes = comment.ratings.filter(r => r.value === 1).length;
      const downvotes = comment.ratings.filter(r => r.value === -1).length;
      const totalVotes = upvotes + downvotes;
      const totalScore = upvotes - downvotes;
      
      let controversyScore = 0;
      if (totalVotes > 0) {
        const upvoteRatio = upvotes / totalVotes;
        controversyScore = (1 - Math.abs(0.5 - upvoteRatio)) * Math.log10(Math.max(totalVotes, 1));
      }

      return {
        ...comment,
        metrics: {
          upvotes,
          downvotes,
          totalVotes,
          totalScore,
          controversyScore,
          upvoteRatio: totalVotes > 0 ? (upvotes / totalVotes) : 0
        }
      }
    })

    const { ratings, ...cleanedComments } = commentsWithMetrics;

    return NextResponse.json(cleanedComments, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}