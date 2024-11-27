import CommentReport from './CommentReport';

const domain = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function generateMetadata({ params }: { params: { commentId: string } }) {
  try {
    const response = await fetch(`${domain}/api/comments/${params.commentId}`);
    const comment = await response.json();

    return {
      title: (comment.content === null) ? 'Deleted comment - Scriptorium' : `Reports for ${[comment.authorUsername]}'s comment - Scriptorium`,
      description: (comment.content === null) ? 'This comment has been deleted. You should not be here.' : `View reports for for ${[comment.authorUsername]}'s comment`,
    };
  } catch {
    return {
      title: 'Not Found - Scriptorium',
      description: 'The requested data could not be found',
    };
  }
}

export default function Page({ params }: { params: { commentId: string } }) {
  return <CommentReport params={params} />;
}