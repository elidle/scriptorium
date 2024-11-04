import { prisma } from '../../../../utils/db';
import {authorize} from "../../../middleware/auth";

// This function is used to report a post.
export async function POST(req) {
  await authorize(req);

  const { reporterId, postId, reason } = await req.json();

  if(!reporterId || !postId || !reason){
    return Response.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
  }
  if(typeof postId !== "number"){
    return Response.json({ status: 'error', message: 'Invalid postId' }, { status: 400 });
  }
  try{
    const reporter = await prisma.user.findUnique({
      where: {
        id: reporterId,
      }
    });
    if(!reporter){
      return Response.json({ status: 'error', message: 'Reporter not found' }, { status: 404 });
    }
    const existingPost = await prisma.blogPost.findUnique({
      where: {
        id: Number(postId),
      }
    });
    if (!existingPost || existingPost.isDeleted) {
      return Response.json({ status: 'error', message: 'Post not found' }, { status: 404 });
    }
    const report = await prisma.postReport.create({
      data: {
        reporterId: reporterId,
        postId: Number(postId),
        reason: reason,
      }
    });
  }
  catch(err){
    return Response.json({ status: 'error', message: 'Failed to report post' }, { status: 500 });
  }
  return Response.json({ status: 'success' }, { status: 201 });
}