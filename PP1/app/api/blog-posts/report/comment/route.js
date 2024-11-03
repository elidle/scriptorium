import { prisma } from '../../../../../utils/db';

// This function is used to report a comment.
export async function POST(req) {
  // const user = verifyToken(req.headers.get("authorization"));
  // if (!user) {
  //   return new Response(JSON.stringify({ status: 'error', message: 'Unauthorized' }), { status: 401 });
  // }
  const { reporterId, commentId, reason } = await req.json();
  if(!reporterId || !commentId || !reason){
    return new Response(JSON.stringify({ status: 'error', message: 'Missing required fields' }), { status: 400 });
  }
  if(typeof commentId !== "number"){
    return new Response(JSON.stringify({ status: 'error', message: 'Invalid commentId' }), { status: 400 });
  }
  try{
    const report = await prisma.commentReport.create({
      data: {
        reporterId: reporterId,
        commentId: Number(commentId),
        reason: reason,
      }
    });
  }
  catch(err){
    return new Response(JSON.stringify({ status: 'error', message: 'Failed to report comment' }), { status: 500 });
  }
  return new Response(JSON.stringify({ status: 'success' }), { status: 200 });
}