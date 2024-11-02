import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET({ params }) {
  const postId = Number(params.postId);

  if (!postId) {
    return new NextResponse.json(
        { error: 'Invalid postId' }, 
        { status: 400 }
    );
  }

  try {
    const post = await prisma.blogPost.findUnique({
      where: {
        id: postId
      },
      include: {
        tags: { 
          select: { 
            tag: { 
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        codeLinks: true,
        ratings: {
          select: {
            value: true
          }
        }
      }
    });

    const upvotes = post.ratings.filter(r => r.value === 1).length;
    const downvotes = post.ratings.filter(r => r.value === -1).length;
    const totalVotes = upvotes + downvotes;
    const totalScore = upvotes - downvotes;

    let controversyScore = 0;
    if (totalVotes > 0) {
      const upvoteRatio = upvotes / totalVotes;
      controversyScore = (1 - Math.abs(0.5 - upvoteRatio)) * Math.log10(Math.max(totalVotes, 1));
    }

   const postWithMetrics = {
      ...post,
      metrics: {
        upvotes,
        downvotes,
        totalVotes,
        totalScore,
        controversyScore,
        upvoteRatio: totalVotes > 0 ? (upvotes / totalVotes) : 0
      }
    };

    const { ratings, ...cleanedPost } = postWithMetrics;

    return NextResponse.json(cleanedPost, {status: 200} );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}