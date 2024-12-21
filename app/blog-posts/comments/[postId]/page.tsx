import BlogPost from './BlogPost';

// const domain = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function generateMetadata({ params }: { params: { postId: string } }) {
  try {
    const response = await fetch(`/api/blog-posts/${params.postId}`);
    const post = await response.json();

    return {
      title: (post.title === null) ? 'Deleted post - Scriptorium' : `${post.title} (by ${[post.authorUsername]}) - Scriptorium`,
      description: (post.title === null) ? 'This post has been deleted, but you can still see the comments.' : `View post "${post.title}" by ${[post.authorUsername]}`,
    };
  } catch {
    return {
      title: 'Post Not Found - Scriptorium',
      description: 'The requested post could not be found',
    };
  }
}

export default function Page({ params }: { params: { postId: string } }) {
  return <BlogPost params={params} />;
}