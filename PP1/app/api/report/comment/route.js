import { prisma } from '../../../../utils/db';
import {authorize} from "../../../middleware/auth";
import {ForbiddenError} from "../../../../errors/ForbiddenError.js";
import { UnauthorizedError } from '../../../../errors/UnauthorizedError.js';

// This function is used to report a comment.
export async function POST(req) {

  const { reporterId, commentId, reason } = await req.json();
  if(!reporterId || !commentId || !reason){
    return Response.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
  }
  if(typeof commentId !== "number"){
    return Response.json({ status: 'error', message: 'Invalid commentId' }, { status: 400 });
  }
  try{
    // Authorize user
    await authorize(req, ['user', 'admin']);
    const reporter = await prisma.user.findUnique({
      where: {
        id: reporterId,
      }
    });
    if(!reporter){
      return Response.json({ status: 'error', message: 'Reporter not found' }, { status: 404 });
    }
    const existingComment = await prisma.comment.findUnique({
      where: {
        id: Number(commentId),
      }
    });
    if (!existingComment || existingComment.isDeleted) {
      return Response.json({ status: 'error', message: 'Comment not found' }, { status: 404 });
    }
    const report = await prisma.commentReport.create({
      data: {
        reporterId: reporterId,
        commentId: Number(commentId),
        reason: reason,
      }
    });
  }
  catch(err){
    if (err instanceof ForbiddenError || err instanceof UnauthorizedError) {
      return Response.json({ status: "error", message: err.message }, { status: err.statusCode });
    }
    return Response.json({ status: 'error', message: 'Failed to report comment' }, { status: 500 });
  }
  return Response.json({ status: 'success' }, { status: 201 });
}