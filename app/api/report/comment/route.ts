import { prisma } from '../../../../utils/db';
import { authorize } from "../../../middleware/auth";
import { ForbiddenError } from "../../../../errors/ForbiddenError";
import { UnauthorizedError } from '../../../../errors/UnauthorizedError';
import { CommentReportRequest, ApiResponse } from '@/app/types/report';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest): Promise<Response> {
  const { reporterId, commentId, reason } = await req.json() as CommentReportRequest;

  if (!reporterId || !commentId || !reason) {
    return Response.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
  }

  if (typeof commentId !== "number") {
    return Response.json({ status: 'error', message: 'Invalid commentId' }, { status: 400 });
  }

  try {
    await authorize(req, ['user', 'admin']);

    const reporter = await prisma.user.findUnique({
      where: { id: reporterId }
    });

    if (!reporter) {
      return Response.json({ status: 'error', message: 'Reporter not found' }, { status: 404 });
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!existingComment || existingComment.isDeleted) {
      return Response.json({ status: 'error', message: 'Comment not found' }, { status: 404 });
    }

    await prisma.commentReport.create({
      data: {
        reporterId,
        commentId,
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
      { status: 'error', message: 'Failed to report comment' },
      { status: 500 }
    );
  }
}