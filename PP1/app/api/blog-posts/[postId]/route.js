import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { itemRatingsToMetrics } from '@/app/utils/blog/metrics';

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

    const postWithMetrics = itemRatingsToMetrics(post);

    return NextResponse.json(postWithMetrics, {status: 200} );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}