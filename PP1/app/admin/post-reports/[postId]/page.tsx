import PostReport from './PostReport';

const domain = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function generateMetadata({ params }: { params: { postId: string } }) {
  try {
    const response = await fetch(`${domain}/api/blog-posts/${params.postId}`);
    const post = await response.json();

    return {
      title: (post.title === null) ? 'Deleted post - Scriptorium' : `Reports for ${post.title} (by ${[post.authorUsername]}) - Scriptorium`,
      description: (post.title === null) ? 'This post has been deleted. You should not be here.' : `View reports for post "${post.title}" by ${[post.authorUsername]}`,
    };
  } catch {
    return {
      title: 'Not Found - Scriptorium',
      description: 'The requested data could not be found',
    };
  }
}

export default function Page({ params }: { params: { postId: string } }) {
  return <PostReport params={params} />;
}