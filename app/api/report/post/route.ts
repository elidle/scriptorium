import { prisma } from '../../../../utils/db';
import { authorize } from "../../../middleware/auth";
import { ForbiddenError } from "../../../../errors/ForbiddenError";
import { UnauthorizedError } from '../../../../errors/UnauthorizedError';
import { PostReportRequest, ApiResponse } from '@/app/types/report';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest): Promise<Response> {
  const { reporterId, postId, reason } = await req.json() as PostReportRequest;

  if (!reporterId || !postId || !reason) {
    return Response.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
  }

  if (typeof postId !== "number") {
    return Response.json({ status: 'error', message: 'Invalid postId' }, { status: 400 });
  }

  try {
    await authorize(req, ['user', 'admin']);

    const reporter = await prisma.user.findUnique({
      where: { id: reporterId }
    });

    if (!reporter) {
      return Response.json({ status: 'error', message: 'Reporter not found' }, { status: 404 });
    }

    const existingPost = await prisma.blogPost.findUnique({
      where: { id: postId }
    });

    if (!existingPost || existingPost.isDeleted) {
      return Response.json({ status: 'error', message: 'Post not found' }, { status: 404 });
    }

    await prisma.postReport.create({
      data: {
        reporterId,
        postId,
        reason
      }
    });

    const response: ApiResponse = { status: 'success' };
    return Response.json(response, { status: 201 });
  } catch (err) {
    if (err instanceof ForbiddenError || err instanceof UnauthorizedError) {
      return Response.json(
        { status: 'error', message: err.message },
        { status: err.statusCode }
      );
    }
    return Response.json(
      { status: 'error', message: 'Failed to report post' },
      { status: 500 }
    );
  }
}