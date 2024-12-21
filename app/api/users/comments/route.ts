import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../utils/db';
import { ForbiddenError } from '../../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../../errors/UnauthorizedError';
import { RawComment } from '@/app//types/comment';

interface CommentWithPost extends RawComment {
  post: {
    title: string;
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
        return NextResponse.json(
          { status: 'error', message: 'Missing or invalid username' }, 
          { status: 400 }
        );
    }
    
    try { 
        const user = await prisma.user.findUnique({
            where: { username }
        });
        
        if (!user) {
            return NextResponse.json(
              { status: 'error', message: 'User not found' },
              { status: 404 }
            );
        }

        const comments = await prisma.comment.findMany({
            where: { authorId: user.id },
            include: {
                post: {
                    select: {
                        title: true,
                    },
                },
                author: true,
                ratings: true,
            },
        }) as CommentWithPost[];

        if (!comments || comments.length === 0) {
            return NextResponse.json(
              { status: 'success', message: 'No comments found', data: [] },
              { status: 200 }
            );
        }

        return NextResponse.json(
          { status: 'success', comments },
          { status: 200 }
        );
    } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
            return NextResponse.json(
              { status: 'error', message: error.message },
              { status: error.statusCode }
            );
        }

        console.error('Error fetching comments:', error);
        return NextResponse.json(
          { status: 'error', message: 'Internal server error' },
          { status: 500 }
        );
    }
}