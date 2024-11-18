"use client";
import {
  Typography,
  Button,
  Collapse,
  TextField,
} from "@mui/material";
import {
  MessageCircle,
  TriangleAlert,
  ChevronUp,
  Edit,
  Trash2
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/contexts/ToastContext";
import { fetchAuth } from "../../../utils/auth";
import { useRouter } from 'next/navigation';

import UserAvatar from "@/app/components/UserAvatar";
import ConfirmationModal from "@/app/components/ConfirmationModal";
import Voting from "@/app/blog-posts/Voting";

import { Post } from "@/app/types/post";
import { Comment } from "@/app/types/comment";

interface CommentItemProps {
  comment: Comment;
  post: Post;
  handleVote: (id: number, isUpvote: boolean) => Promise<void>;
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

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const toggleIsEditing = () => {
    isEditing ? setEditedContent("") : setEditedContent(post?.content || "");
    setIsEditing(!isEditing)
  };
  const [editedContent, setEditedContent] = useState(comment.content);

  // Delete states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const { user, accessToken, setAccessToken } = useAuth();
  const { showToast } = useToast();

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyContent.trim()) {
      showToast({
        message: 'Reply content cannot be empty.',
        type: 'error'
      });
      return;
    }

    if (!user || !accessToken) {
      showToast({ 
        message: 'Please log in to reply', 
        type: 'info' 
      });
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

      showToast({ message: 'Reply created successfully', type: 'success' });
      await fetchComments(true);
      setReplyContent('');
      setIsReplying(false);
    } catch (err) {
      showToast({ 
        message: err instanceof Error ? err.message : 'Failed to create comment', 
        type: 'error'
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editedContent.trim()) {
      showToast({
        message: 'Content cannot be empty.',
        type: 'error'
      });
      return;
    }

    if (user.id !== post?.authorId) return; // Do nothing

    if (!user || !accessToken) {
      showToast({ 
        message: 'Please log in', 
        type: 'error' 
      });
      router.push('/auth/login');
      return;
    }
  
    try {
      const url = `/api/comments/${comment.id}`;
      const options: RequestInit = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'access-token': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content: editedContent }),
      };
  
      let response = await fetchAuth({url, options, user, setAccessToken, router});
      if (!response) return;
  
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to edit comment');
      }
  
      await fetchComments(true);
      showToast({ message: 'Post edited successfully', type: 'success' });
      setIsEditing(false);
      setEditedContent('');
    } catch (err) {
      showToast({ 
        message: err instanceof Error ? err.message : 'Failed to edit comment', 
        type: 'error'
      });
    }
  };
  
  const handleDelete = async () => {
    if (user.id !== post?.authorId) return; // Do nothing

    if (!user || !accessToken) {
      showToast({ 
        message: 'Please log in', 
        type: 'error' 
      });
      router.push('/auth/login');
      return;
    }

    try {
      const url = `/api/comments/${comment.id}`;
      const options: RequestInit = {
        method: 'DELETE',
        headers: {
          'access-token': `Bearer ${accessToken}`,
        }
      };
  
      let response = await fetchAuth({url, options, user, setAccessToken, router});
      if (!response) return;
  
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
  
      showToast({ message: 'Comment deleted successfully', type: 'success' });
      await fetchComments(true);
      setDeleteModalOpen(false);
    } catch (err) {
      showToast({ 
        message: err instanceof Error ? err.message : 'Failed to delete comment', 
        type: 'error' 
      });
    }
  };

  return (
    <div className="ml-2 sm:ml-4 border-l border-slate-700 pl-2 sm:pl-4">
      {/* Delete Modal */}
      <ConfirmationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
      />

      {/* Header with voting and user info */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-2">
          <UserAvatar username={comment.authorUsername} userId={comment.authorId} size={32} />

          <Typography className={`text-sm ${user?.id === post.authorId ? 'text-green-400' : 'text-slate-400'}`}>
            {comment.authorUsername}
          </Typography>
          <Typography className="text-sm text-slate-400">
            • {new Date(comment.createdAt).toLocaleString()}
          </Typography>
        </div>

        <Voting item={comment} handleVote={handleVote} />
      </div>

      {/* Comment content */}
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="space-y-4 ml-10">
          <TextField
            fullWidth
            multiline
            minRows={2}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="bg-slate-900"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'rgb(226, 232, 240)',
                '& fieldset': { borderColor: 'rgb(51, 65, 85)' },
                '&:hover fieldset': { borderColor: 'rgb(59, 130, 246)' },
                '&.Mui-focused fieldset': { borderColor: 'rgb(59, 130, 246)' },
              },
            }}
          />
          <div className="flex justify-end gap-2">
            <Button 
              type="submit"
              variant="contained"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save
            </Button>
            <Button 
              onClick={() => {
                setIsEditing(false);
                setEditedContent("");
              }}
              variant="outlined"
              className="text-slate-300 border-slate-700 hover:border-blue-400"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Typography className="text-slate-300 mb-2 mt-2 ml-10" sx={{ whiteSpace: "pre-wrap" }}>
          {comment.content === null ? "[This comment has been deleted by its author.]" : comment.content}
        </Typography>
      )}

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
        {user?.id !== comment.authorId && (
          <button
            onClick={() => { if (comment.allowAction) handleReportClick(comment.id)}}
            className={`flex items-center gap-1 text-slate-400 ${comment.allowAction ? 'hover:text-blue-400' : 'opacity-50'}`}
            disabled={!comment.allowAction}
          >
            <TriangleAlert size={16} />
            <span className="text-xs">Report</span>
          </button>
        )}
        {user?.id === comment.authorId && (
          <>
            <button 
              onClick={() => toggleIsEditing()}
              className={`flex items-center gap-1 text-slate-400 ${comment.allowAction ? 'hover:text-blue-400' : 'opacity-50'}`}
              disabled={!comment.allowAction}
            >
              <Edit size={16} />
            <span className="text-sm"> Edit </span>
            </button>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-1 text-slate-400 hover:text-red-400"
            >
              <Trash2 size={16} />
              <span className="text-xs">Delete</span>
            </button>
          </>
        )}
      </div>

      {/* Reply input field */}
      {isReplying && (
        <div className="ml-10 mb-4">
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