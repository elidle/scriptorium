import { Typography } from "@mui/material";
import { MessageCircle, Share2, TriangleAlert, FileCode } from "lucide-react";
import Link from 'next/link';
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import UserAvatar from '../../components/UserAvatar';
import { Post } from "../../types/post";
import Voting from "@/app/blog-posts/Voting";
import { useToast } from "@/app/contexts/ToastContext";

interface PostPreviewProps {
  post: Post;
  handleVote: (id: number, isUpvote: boolean) => Promise<void>;
  handleReportClick: (postId: number) => void;
}

export default function PostPreview({ post, handleVote, handleReportClick }: PostPreviewProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  const handleShare = async (id: number) => {
    try {
      const url = `${window.location.origin}/blog-posts/comments/${id}`;
      await navigator.clipboard.writeText(url);
      showToast({
        message: `Post link copied to clipboard!`,
        type: 'success'
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast({
        message: 'Failed to copy link to clipboard',
        type: 'error'
      });
    }
  };

  return (
    <article
      key={post.id}
      className={`flex rounded-lg border transition-all
        ${isDarkMode 
          ? 'bg-slate-800 border-slate-700 hover:border-slate-600' 
          : 'bg-white border-slate-200 hover:border-slate-300'}`}
    >
      {/* Vote section */}
      <div className={`flex flex-col items-center p-2 rounded-l-lg
        ${isDarkMode 
          ? 'bg-slate-900/50' 
          : 'bg-slate-50'}`}>
        <Voting item={post} handleVote={handleVote} />
      </div>

      <Link
        href={`/blog-posts/comments/${post.id}`}
        className="flex-1 cursor-pointer"
      >
        <div className="p-3">
          <div className="flex items-center gap-2 mb-4">
            <UserAvatar username={post.authorUsername} userId={post.authorId} />

            {post.authorUsername[0] === '[' ? (
              <Typography className={`${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {post.authorUsername}
              </Typography>
            ) : (
              <Link href={`/users/${post.authorUsername}`}>
                <Typography className={`hover:text-blue-400 ${
                  user?.id === post.authorId 
                    ? 'text-green-500' 
                    : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {post.authorUsername}
                </Typography>
              </Link>
            )}

            <Typography className={`${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              • {new Date(post.createdAt).toLocaleString()}
            </Typography>
          </div>

          <Typography variant="h6" className={`mb-2 ${
            isDarkMode ? 'text-slate-200' : 'text-slate-900'
          }`}>
            {post.title}
          </Typography>
          <Typography className={`mb-3 line-clamp-3 ${
            isDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`}>
            {post.content}
          </Typography>

          {/* Tags and Templates Section */}
          <div className="space-y-2 mb-3" onClick={(e) => e.stopPropagation()}>
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 rounded-full text-xs border ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-600 text-blue-300' 
                        : 'bg-slate-50 border-slate-200 text-blue-600'
                    }`}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Code Templates */}
            {post.codeTemplates && post.codeTemplates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.codeTemplates.map((template) => (
                  <Link
                    key={template.id}
                    href={`/code-templates/${template.author.username}/${template.id}`}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                      isDarkMode
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/30'
                        : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300'
                    } border`}
                  >
                    <FileCode size={14} />
                    {template.title}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Link
              href={`/blog-posts/comments/${post.id}`}
              className={`flex items-center gap-1 ${
                isDarkMode
                  ? 'text-slate-400 hover:text-blue-400'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle size={18}/>
              <span className="text-sm">Comments</span>
            </Link>
            {user?.id !== post.authorId && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleReportClick(post.id);
                }}
                className={`flex items-center gap-1 ${
                  isDarkMode
                    ? 'text-slate-400 hover:text-blue-400'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                <TriangleAlert size={18}/>
                <span className="text-sm">Report</span>
              </button>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                handleShare(post.id);
              }}
              className={`flex items-center gap-1 ${
                isDarkMode
                  ? 'text-slate-400 hover:text-blue-400'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <Share2 size={18}/>
              <span className="text-sm">Share</span>
            </button>
          </div>
        </div>
      </Link>
    </article>
  );
}