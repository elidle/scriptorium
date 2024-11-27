"use client";
import {
  Typography,
  Button,
  Collapse,
  TextField,
  Box
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
import Link from 'next/link';

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
    if (isEditing) {
      setEditedContent("");
    } else {
      setEditedContent(comment.content || "");
    }
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

      const response = await fetchAuth({url, options, user, setAccessToken, router});
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

    if (user?.id !== post?.authorId) return; // Do nothing

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
  
      const response = await fetchAuth({url, options, user, setAccessToken, router});
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
    if (!user || user.id !== comment.authorId) return; // Do nothing

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
  
      const response = await fetchAuth({url, options, user, setAccessToken, router});
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
    <Box sx={{
      ml: { xs: 1, sm: 2 },
      borderLeft: 2,
      borderColor: 'divider',
      pl: { xs: 1, sm: 2 }
    }}>
      {/* Delete Modal */}
      <ConfirmationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
      />

      {/* Header with voting and user info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UserAvatar username={comment.authorUsername} userId={comment.authorId} />

          {comment.authorUsername[0] === '[' ? (
            <Typography sx={{
              color: user?.id === comment.authorId ? 'success.main' : 'text.secondary'
            }}>
              {comment.authorUsername}
            </Typography>
          ) : (
            <Link href={`/users/${comment.authorUsername}`}>
              <Typography sx={{
                color: user?.id === comment.authorId ? 'success.main' : 'text.secondary',
                '&:hover': { color: 'primary.main' }
              }}>
                {comment.authorUsername}
              </Typography>
            </Link>
          )}

          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            • {new Date(comment.createdAt).toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Voting item={comment} handleVote={handleVote} />
        </Box>
      </Box>

      {/* Comment content */}
      {isEditing ? (
        <Box 
          component="form" 
          onSubmit={handleEditSubmit}
          sx={{ 
            ml: 5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <TextField
            fullWidth
            multiline
            minRows={2}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            sx={{
              bgcolor: 'background.default',
              '& .MuiOutlinedInput-root': {
                color: 'text.primary',
                '& fieldset': { borderColor: 'divider' },
                '&:hover fieldset': { borderColor: 'text.secondary' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' },
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button 
              type="submit"
              variant="contained"
              sx={{
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              Save
            </Button>
            <Button 
              onClick={() => {
                setIsEditing(false);
                setEditedContent("");
              }}
              variant="outlined"
              sx={{
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': { borderColor: 'primary.main' }
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography 
          sx={{ 
            color: 'text.primary',
            my: 1,
            ml: 5,
            whiteSpace: 'pre-wrap'
          }}
        >
          {comment.content === null ? "[This comment has been deleted by its author.]" : comment.content}
        </Typography>
      )}

      {/* Action buttons */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        ml: 5,
        mb: 1
      }}>
        {comment.replies.length > 0 && (
          <Button
            onClick={toggleCollapse}
            startIcon={
              <ChevronUp
                size={16}
                className={`transition-transform duration-300 ${
                  isCollapsed ? "rotate-0" : "rotate-180"
                }`}
              />
            }
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
              '&:hover': { color: 'primary.main' },
            }}
          >
            {isCollapsed ? "Show Replies" : "Hide Replies"}
          </Button>
        )}
        
        <Button
          onClick={() => toggleReplying()}
          disabled={!comment.allowAction}
          startIcon={<MessageCircle size={16} />}
          sx={{
            color: 'text.secondary',
            fontSize: '0.75rem',
            opacity: !comment.allowAction ? 0.8 : 1,
            '&:hover': { color: 'primary.main' },
          }}
        >
          Reply
        </Button>

        {user?.id !== comment.authorId && (
          <Button
            onClick={() => { if (comment.allowAction) handleReportClick(comment.id)}}
            disabled={!comment.allowAction}
            startIcon={<TriangleAlert size={16} />}
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
              opacity: !comment.allowAction ? 0.8 : 1,
              '&:hover': { color: 'primary.main' },
            }}
          >
            Report
          </Button>
        )}

        {user?.id === comment.authorId && (
          <>
            <Button 
              onClick={() => toggleIsEditing()}
              disabled={!comment.allowAction}
              startIcon={<Edit size={16} />}
              sx={{
                color: 'text.secondary',
                fontSize: '0.75rem',
                opacity: !comment.allowAction ? 0.5 : 1,
                '&:hover': { color: 'primary.main' },
              }}
            >
              Edit
            </Button>
            <Button
              onClick={() => setDeleteModalOpen(true)}
              startIcon={<Trash2 size={16} />}
              sx={{
                color: 'text.secondary',
                fontSize: '0.75rem',
                '&:hover': { color: 'error.main' },
              }}
            >
              Delete
            </Button>
          </>
        )}
      </Box>

      {/* Reply input field */}
      {isReplying && (
        <Box sx={{ ml: 5, mb: 2 }}>
          {comment.allowAction ? (
            <Box 
              component="form" 
              onSubmit={handleReplySubmit}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
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
                sx={{
                  bgcolor: 'background.default',
                  '& .MuiOutlinedInput-root': {
                    color: 'text.primary',
                    '& fieldset': { borderColor: 'divider' },
                    '&:hover fieldset': { borderColor: 'text.secondary' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                  },
                }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  type="submit"
                  variant="contained"
                  sx={{
                    bgcolor: 'primary.main',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                >
                  Submit
                </Button>
                <Button 
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent('');
                  }}
                  variant="outlined"
                  sx={{
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography sx={{ color: 'text.secondary' }}>
              Replies are disabled for this comment.
            </Typography>
          )}
        </Box>
      )}

      {/* Replies */}
      {comment.replies.length > 0 && (
        <Collapse in={!isCollapsed} timeout="auto">
          <Box sx={{ pl: 2 }}>
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
          </Box>
        </Collapse>
      )}
    </Box>
  );
}