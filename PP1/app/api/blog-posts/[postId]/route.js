import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req, { params }) {
  const postId = Number(params.postId);

  if (!postId) {
    return new Response(JSON.stringify({ error: 'Invalid postId' }), { status: 400 });
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

    return new Response(JSON.stringify({
      post: cleanedPost,
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: `Failed to fetch blog post with ID ${postId}` }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
