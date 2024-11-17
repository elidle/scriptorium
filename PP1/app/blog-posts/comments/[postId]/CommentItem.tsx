"use client";
import {
  Typography,
  IconButton,
  Avatar,
  Button,
  Collapse,
  TextField,
  Modal,
  Box
} from "@mui/material";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  MessageCircle,
  TriangleAlert,
  ChevronUp,
  Edit,
  Trash2
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchAuth } from "../../../utils/auth";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import UserAvatar from "@/app/components/UserAvatar";

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

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [editError, setEditError] = useState("");

  // Delete states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editedContent.trim()) {
      setEditError("Content cannot be empty");
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
      if (!response.ok) throw new Error(data.message);
  
      await fetchComments(true);
      setIsEditing(false);
      setEditError("");
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to edit comment');
    }
  };
  
  const handleDelete = async () => {
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
  
      await fetchComments(true);
      setDeleteModalOpen(false);
      setDeleteError("");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  return (
    <div className="ml-2 sm:ml-4 border-l border-slate-700 pl-2 sm:pl-4">
      {/* Delete Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <Box sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "rgb(15, 23, 42)",
          border: "1px solid rgb(51, 65, 85)",
          borderRadius: "8px",
          p: 4,
          boxShadow: 24,
          color: "rgb(203, 213, 225)",
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: "rgb(239, 68, 68)" }}>
            Delete Comment
          </Typography>
          <Typography className="text-slate-300 mb-4">
            Are you sure you want to delete this comment?
          </Typography>

          {deleteError && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
              <Typography className="text-red-500">{deleteError}</Typography>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              onClick={handleDelete}
              variant="contained"
              className="!bg-red-600 hover:!bg-red-700 text-white"
            >
              Delete
            </Button>
            <Button
              onClick={() => setDeleteModalOpen(false)}
              variant="outlined"
              className="border-slate-600 text-slate-300 hover:border-slate-500"
            >
              Cancel
            </Button>
          </div>
        </Box>
      </Modal>

      {/* Header with voting and user info */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-2">
          <UserAvatar username={comment.authorUsername} userId={comment.authorId} size={32} />

          <Typography className={`text-sm ${user?.id === post.authorId ? 'text-green-400' : 'text-slate-400'}`}>
            {post.authorUsername}
          </Typography>
          <Typography className="text-sm text-slate-400">
            • {new Date(post.createdAt).toLocaleString()}
          </Typography>
        </div>

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
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="space-y-4 ml-10">
          {editError && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
              <Typography className="text-red-500">{editError}</Typography>
            </div>
          )}
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
                setEditError("");
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
        <button
          onClick={() => { if (comment.allowAction) handleReportClick(comment.id)}}
          className={`flex items-center gap-1 text-slate-400 ${comment.allowAction ? 'hover:text-blue-400' : 'opacity-50'}`}
          disabled={!comment.allowAction}
        >
          <TriangleAlert size={16} />
          <span className="text-xs">Report</span>
        </button>
        {user?.id === comment.authorId && (
          <>
            <button
              onClick={() => {
                setEditedContent(comment.content);
                setIsEditing(true);
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-blue-400"
            >
              <Edit size={16} />
              <span className="text-xs">Edit</span>
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