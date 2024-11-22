import { Typography } from "@mui/material";
import { MessageCircle, TriangleAlert } from "lucide-react";
import Link from 'next/link';
import { useAuth } from "../../contexts/AuthContext";

import UserAvatar from '../../components/UserAvatar';

import { Post } from "../../types/post";
import Voting from "@/app/blog-posts/Voting";

interface PostPreviewProps {
  post: Post;
  handleVote: (id: number, isUpvote: boolean) => Promise<void>;
  handleReportClick: (postId: number) => void;
}

export default function PostPreview({ post, handleVote, handleReportClick }: PostPreviewProps) {
  const { user } = useAuth();

  return (
    <article 
      key={post.id} 
      className="flex bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
    >
      {/* Vote section */}
      <div className="flex flex-col items-center p-2 bg-slate-900/50 rounded-l-lg">
        <Voting item={post} handleVote={handleVote} />
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-4 text-xs sm:text-sm">
          <UserAvatar username={post.authorUsername} userId={post.authorId} />

          {
            post.authorUsername[0] === '[' ? (
              <Typography className="text-slate-400">
                {post.authorUsername}
              </Typography>
            ) : (
              <Link href={`/users/${post.authorUsername}`}>
                <Typography className={`hover:text-blue-400 ${user?.id === post.authorId ? 'text-green-400' : 'text-slate-400'}`}>
                  {post.authorUsername}
                </Typography>
              </Link>
            )
          }

          <Typography className="text-slate-400">
            • {new Date(post.createdAt).toLocaleString()}
          </Typography>
        </div>
        
        <Link 
          href={`/blog-posts/comments/${post.id}`}
          className="flex-1 cursor-pointer"
        >
          <Typography variant="h6" className="text-slate-200 mb-2 text-base sm:text-xl">
            {post.title}
          </Typography>
          <Typography className="text-slate-300 mb-3 line-clamp-3 text-sm sm:text-base">
            {post.content}
          </Typography>
        </Link>

        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-slate-800 border border-slate-600 rounded-full text-xs text-blue-300"
            >
              {tag.name}
            </span>
          ))}
        </div>

        <div className="flex gap-4">
          <Link 
            href={`/blog-posts/comments/${post.id}`}
            className="flex items-center gap-1 text-slate-400 hover:text-blue-400"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle size={18} />
            <span className="text-sm">Comments</span>
          </Link>
          {user?.id !== post.authorId && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                handleReportClick(post.id);
              }} 
              className="flex items-center gap-1 text-slate-400 hover:text-blue-400"
            >
              <TriangleAlert size={18} />
              <span className="text-sm">Report</span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
} 