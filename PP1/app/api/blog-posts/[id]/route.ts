import { NextRequest } from 'next/server';
import { prisma } from '../../../../utils/db';
import { itemRatingsToMetrics } from '../../../../utils/blog/metrics';
import { authorize } from '../../../middleware/auth';
import { ForbiddenError } from '../../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../../errors/UnauthorizedError';
import { BlogPostRequest, Post } from '@/app/types/post';
import { Tag } from '@/app/types/tag';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    console.log("Received request to update post with ID: ", id);

    if (!id) {
      return Response.json(
        { status: 'error', error: 'Missing or invalid ID' },
        { status: 400 }
      );
    }

    const { title, content, tags, codeTemplateIds } = await req.json() as BlogPostRequest;

    const post = await prisma.blogPost.findUnique({ where: { id } });

    if (!post || post.isDeleted) {
      return Response.json(
        { status: 'error', error: 'Post not found' },
        { status: 404 }
      );
    }

    await authorize(req, ['user', 'admin'], post.authorId);

    if (codeTemplateIds) {
      for (const templateId of codeTemplateIds) {
        const currentTemplate = await prisma.codeTemplate.findUnique({
          where: { id: Number(templateId) }
        });
        if (!currentTemplate) {
          return Response.json(
            { status: 'error', error: 'Code template not found' },
            { status: 404 }
          );
        }
      }
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(tags && {
          tags: {
            set: [],
            connectOrCreate: tags.map(tag => ({
              where: { name: tag.toLowerCase() },
              create: { name: tag.toLowerCase() }
            }))
          }
        }),
        ...(codeTemplateIds && {
          codeTemplates: {
            set: [],
            connect: codeTemplateIds.map(id => ({ id: Number(id) }))
          }
        })
      },
      select: {
        id: true,
        authorId: true,
        title: true,
        content: true,
        tags: true,
        codeTemplates: {
          select: {
            id: true,
            title: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    return Response.json(updatedPost, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to update blog posts' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    console.log("Received request to delete post with ID: ", id);

    if (!id) {
      return Response.json(
        { status: 'error', error: 'Missing or invalid ID' },
        { status: 400 }
      );
    }

    const post = await prisma.blogPost.findUnique({ where: { id } });

    if (!post || post.isDeleted) {
      return Response.json(
        { status: 'error', error: 'Post not found' },
        { status: 404 }
      );
    }

    await authorize(req, ['user', 'admin'], post.authorId);

    await prisma.blogPost.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: null,
        title: null,
        authorId: null,
        tags: {
          set: []
        },
        codeTemplates: {
          set: []
        },
        isHidden: false,
        hiddenAt: null,
        hiddenById: null
      }
    });

    return Response.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = Number(searchParams.get('userId'));
    console.log("Received request to fetch post from user: ", userId);

    let canViewHidden = false;

    if (userId) {
      await authorize(req, ['user', 'admin'], userId);
    }

    const id = Number(params.id);

    if (!id) {
      return Response.json(
        { status: 'error', error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        isHidden: true,
        isDeleted: true,
        author: {
          select: {
            id: true,
            username: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true
          }
        },
        ratings: {
          select: {
            value: true,
            ...(userId && {
              userId: true
            })
          }
        },
        codeTemplates: {
          select: {
            id: true,
            title: true,
            code: true,
            language: true,
            explanation: true,
            tags: true,
            author: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });

    if (!post) {
      return Response.json(
        { status: 'error', error: 'Post not found' },
        { status: 404 }
      );
    }

    if (userId) {
      try {
        await authorize(req, ['admin']);
        canViewHidden = true;
      } catch {
        canViewHidden = userId === post.author?.id;
      }
    }

    const postWithVote = {
      ...post,
      userVote: userId ? post.ratings.find(rating => rating.userId === userId)?.value || 0 : 0
    };
    const postWithMetrics = itemRatingsToMetrics(postWithVote);

    const responsePost: Post = {
      id: postWithMetrics.id,
      title: post.isHidden
        ? `[Hidden post] ${canViewHidden ? post.title : ''}`
        : postWithMetrics.title,
      content: post.isHidden
        ? `[This post has been hidden by a moderator.]${canViewHidden ? '\n\n' + postWithMetrics.content : ''}`
        : postWithMetrics.content,
      authorId: postWithMetrics.author?.id ?? null,
      authorUsername: postWithMetrics.author?.username ?? "[deleted]",
      tags: postWithMetrics.tags.map((tag: Tag) => ({ id: tag.id, name: tag.name })),
      createdAt: postWithMetrics.createdAt,
      score: postWithMetrics.metrics.totalScore,
      userVote: postWithMetrics.userVote,
      allowAction: !post.isDeleted && !post.isHidden,
      author: postWithMetrics.author || { id: 0, username: '[deleted]' },
      codeTemplates: postWithMetrics.codeTemplates
    };

    return Response.json(responsePost, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { status: 'error', error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}