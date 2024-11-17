"use client";
import {
  Typography,
  IconButton,
  Avatar,
  Button,
  Collapse,
  TextField,
} from "@mui/material";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  MessageCircle,
  TriangleAlert,
  ChevronUp
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchAuth } from "../../../utils/auth";
import { useRouter } from 'next/navigation';

interface Tag {
  id: number;
  name: string;
}

interface BlogPost {
  id: number;
  title: string;
  content: string;
  authorId: string;
  authorUsername: string;
  tags: Tag[];
  createdAt: string;
  score: number;
  allowAction: boolean;
  userVote: number;
}

interface Comment {
  id: number;
  content: string;
  authorId: number;
  authorUsername: string;
  createdAt: string;
  score: number;
  replies: Comment[];
  allowAction: boolean;
  userVote: number;
}

interface CommentItemProps {
  comment: Comment;
  post: BlogPost;
  handleVote: (increment: boolean, commentId: number | null) => void;
  handleReportClick: (commentId: number | null) => void;
  fetchComments: (refresh: boolean) => void;
}

export default function CommentItem({ comment, post, handleVote, handleReportClick, fetchComments }: CommentItemProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Reply states
  const [isReplying, setIsReplying] = useState(false);
  const toggleReplying = () => setIsReplying(!isReplying);
  const [replyContent, setReplyContent] = useState('');
  const [replyError, setReplyError] = useState('');

  const { user, accessToken, setAccessToken } = useAuth();

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyContent.trim()) {
      setReplyError('Reply cannot be empty');
      return;
    }

    if (!user || !accessToken) {
      router.push('/auth/login');
      return;
    }

    try {
      const url = '/api/comments';
      const options: RequestInit = {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'access-token': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          authorId: user.id,
          content: replyContent,
          postId: post.id,
          parentId: comment.id,
        }),
      };

      let response = await fetchAuth({url, options, user, setAccessToken, router});
      if (!response) return;

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create comment');
      }

      fetchComments(true);
      setReplyError('');
    } catch (err) {
      console.error('Error creating reply:', err);
      setReplyError(err instanceof Error ? err.message : 'Failed to create reply');
    } finally {
      setReplyContent('');
      setIsReplying(false);
    }
  };

  return (
    <div className="ml-2 sm:ml-4 border-l border-slate-700 pl-2 sm:pl-4">
      {/* Header with voting and user info */}
      <div className="flex items-center gap-2 mb-2">
        <Avatar sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 } }}>
          {comment.authorUsername[0].toUpperCase()}
        </Avatar>
        <Typography className="text-sm text-slate-400">
          {comment.authorUsername} • {new Date(comment.createdAt).toLocaleString()}
        </Typography>

        <IconButton 
          className={`group ${comment.userVote === 1 ? '!text-red-400' : '!text-slate-400'}`} 
          onClick={() => handleVote(true, comment.id)}
          disabled={!comment.allowAction}
          sx={{ opacity: comment.allowAction ? '1 !important' : '0.5 !important' }}
        >
          <ArrowUpCircle className="group-hover:!text-red-400" size={20} />
        </IconButton>
        <span className="text-sm font-medium text-slate-300">{comment.score}</span>
        <IconButton 
          className={`group ${comment.userVote === -1 ? '!text-blue-400' : '!text-slate-400'}`} 
          onClick={() => handleVote(false, comment.id)}
          disabled={!comment.allowAction}
          sx={{ opacity: comment.allowAction ? '1 !important' : '0.5 !important' }}
        >
          <ArrowDownCircle className="group-hover:!text-blue-400" size={20} />
        </IconButton>
      </div>

      {/* Comment content */}
      <Typography className="text-slate-300 mb-2 mt-2 ml-10" sx={{ whiteSpace: "pre-wrap" }}>{comment.content}</Typography>

      {/* Action buttons */}
      <div className="flex items-center gap-4 ml-10 mb-2">
        {comment.replies.length > 0 && (
          <button
            onClick={toggleCollapse}
            className="flex items-center gap-1 text-slate-400 hover:text-blue-400"
          >
            <ChevronUp
              size={16}
              className={`transition-transform duration-300 ${
                isCollapsed ? "rotate-0" : "rotate-180"
              }`}
            />
            <span className="text-xs">
              {isCollapsed ? "Show Replies" : "Hide Replies"}
            </span>
          </button>
        )}
        <button
          onClick={() => toggleReplying()}
          className={`flex items-center gap-1 text-slate-400 ${comment.allowAction ? 'hover:text-blue-400' : 'opacity-50'}`}
          disabled={!comment.allowAction}
        >
          <MessageCircle size={16} />
          <span className="text-xs">Reply</span>
        </button>
        <button
          onClick={() => { if (comment.allowAction) handleReportClick(comment.id)}}
          className={`flex items-center gap-1 text-slate-400 ${comment.allowAction ? 'hover:text-blue-400' : 'opacity-50'}`}
          disabled={!comment.allowAction}
        >
          <TriangleAlert size={16} />
          <span className="text-xs">Report</span>
        </button>
      </div>

      {/* Reply input field */}
      {isReplying && (
        <div className="ml-10 mb-4">
          {replyError && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
              <Typography className="text-red-500">{replyError}</Typography>
            </div>
          )}

          {comment.allowAction ? (
            <form 
              onSubmit={handleReplySubmit} 
              className="space-y-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleReplySubmit(e);
                } else if (e.key === 'Escape') {
                  setIsReplying(false);
                  setReplyContent('');
                }
              }}
            >
              <TextField
                fullWidth
                multiline
                rows={2}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                className="bg-slate-900"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'rgb(226, 232, 240)',
                    '& fieldset': {
                      borderColor: 'rgb(51, 65, 85)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgb(59, 130, 246)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgb(59, 130, 246)',
                    },
                  },
                }}
              />
              <div className="flex gap-2">
                <Button 
                  type="submit"
                  variant="contained"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Submit
                </Button>
                <Button 
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent('');
                  }}
                  variant="outlined"
                  className="text-slate-300 border-slate-700 hover:border-blue-400"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Typography className="text-slate-400">
              Replies are disabled for this comment.
            </Typography>
          )}
        </div>
      )}

      {/* Replies */}
      {comment.replies.length > 0 && (
        <Collapse in={!isCollapsed} timeout="auto">
          <div className="pl-4">
            {comment.replies.map((reply) => (
              <CommentItem 
                key={reply.id}
                comment={reply}
                post={post}
                handleVote={handleVote}
                handleReportClick={handleReportClick}
                fetchComments={fetchComments}
              />
            ))}
          </div>
        </Collapse>
      )}
    </div>
  );
}