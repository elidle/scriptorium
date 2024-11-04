import { prisma } from '../../../../utils/db';

// This function is used to report a comment.
export async function POST(req) {
  // const user = verifyToken(req.headers.get("authorization"));
  // if (!user) {
  //   return Response.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  // }
  const { reporterId, commentId, reason } = await req.json();
  if(!reporterId || !commentId || !reason){
    return Response.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
  }
  if(typeof commentId !== "number"){
    return Response.json({ status: 'error', message: 'Invalid commentId' }, { status: 400 });
  }
  try{
    const reporter = await prisma.user.findUnique({
      where: {
        id: reporterId,
      }
    });
    if(!reporter){
      return Response.json({ status: 'error', message: 'Reporter not found' }, { status: 400 });
    }
    const existingComment = await prisma.comment.findUnique({
      where: {
        id: Number(commentId),
      }
    });
    if (!existingComment || existingComment.isDeleted) {
      return Response.json({ status: 'error', message: 'Comment not found' }, { status: 400 });
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
    return Response.json({ status: 'error', message: 'Failed to report comment' }, { status: 500 });
  }
  return Response.json({ status: 'success' }, { status: 201 });
}