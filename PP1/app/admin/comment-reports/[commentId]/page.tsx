import CommentReport from './CommentReport';

export async function generateMetadata({ params }: { params: { commentId: string } }) {
  try {
    const response = await fetch(`http://localhost:3000/api/comments/${params.commentId}`);
    const comment = await response.json();

    return {
      title: (comment.content === null) ? 'Deleted comment - Scriptorium' : `Reports for ${[comment.authorUsername]}'s comment - Scriptorium`,
      description: (comment.content === null) ? 'This comment has been deleted. You should not be here.' : `View reports for for ${[comment.authorUsername]}'s comment`,
    };
  } catch (error) {
    return {
      title: 'Not Found - Scriptorium',
      description: 'The requested data could not be found',
    };
  }
}

export default function Page({ params }: { params: { commentId: string } }) {
  return <CommentReport params={params} />;
}