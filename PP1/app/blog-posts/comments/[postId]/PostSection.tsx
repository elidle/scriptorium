import { Box, Typography, Button, TextField, Tooltip } from "@mui/material";
import { MessageCircle, TriangleAlert, Edit, Trash2, Eye, Clock, Share2 } from "lucide-react";
import Link from "next/link";
import UserAvatar from "@/app/components/UserAvatar";
import Voting from "@/app/blog-posts/Voting";
import { Post } from "@/app/types/post";
import { useToast } from "@/app/contexts/ToastContext";
import { User } from "@/app/types/auth";

interface EditFormProps {
  editedContent: string;
  setEditedContent: (content: string) => void;
  handleEditSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

const EditForm = ({ editedContent, setEditedContent, handleEditSubmit, onCancel }: EditFormProps) => (
  <Box component="form" onSubmit={handleEditSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 1 }}>
    <TextField
      fullWidth
      multiline
      minRows={4}
      value={editedContent}
      onChange={(e) => setEditedContent(e.target.value)}
      sx={{
        bgcolor: 'background.default',
        '& .MuiOutlinedInput-root': {
          height: '100%',
          color: 'text.primary',
          '& fieldset': { borderColor: 'divider' },
          '&:hover fieldset': { borderColor: 'text.secondary' },
          '&.Mui-focused fieldset': { borderColor: 'primary.main' },
        }
      }}
    />
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
      <Button type="submit" variant="contained" sx={{
        bgcolor: 'primary.main',
        '&:hover': { bgcolor: 'primary.dark' }
      }}>
        Save
      </Button>
      <Button onClick={onCancel} variant="outlined" sx={{
        borderColor: 'divider',
        color: 'text.primary',
        '&:hover': { borderColor: 'primary.main' }
      }}>
        Cancel
      </Button>
    </Box>
  </Box>
);

interface PostActionsProps {
  post: Post;
  user: User;
  handlePostVote: (postId: number, isUpvote: boolean) => Promise<void>;
  handleReportClick: (commentId?: number) => void;
  toggleIsEditing: () => void;
  setDeleteModalOpen: (open: boolean) => void;
  scrollToComment: () => void;
}

const PostActions = ({ post, user, handlePostVote, handleReportClick, toggleIsEditing, setDeleteModalOpen, scrollToComment }: PostActionsProps) => {
  const { showToast } = useToast();

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast({ message: "Link copied to clipboard!", type: "success" });
    } catch {
      showToast({ message: "Failed to copy link", type: "error" });
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'space-between',
      alignItems: { xs: 'start', sm: 'center' },
      gap: 1,
      mb: 2,
    }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Voting item={post} handleVote={handlePostVote} />
        </Box>
        <Button
          onClick={handleShare}
          startIcon={<Share2 size={18} />}
          sx={{
            color: 'text.secondary',
            '&:hover': { color: 'primary.main' },
          }}
        >
          Share
        </Button>
        <Button
          onClick={scrollToComment}
          disabled={!post?.allowAction}
          startIcon={<MessageCircle size={18} />}
          sx={{
            color: 'text.secondary',
            opacity: !post?.allowAction ? 0.5 : 1,
            '&:hover': { color: 'primary.main' },
          }}
        >
          Comment
        </Button>
        {user?.id !== post.authorId && (
          <Button
            onClick={() => { if (post.allowAction) handleReportClick() }}
            disabled={!post.allowAction}
            startIcon={<TriangleAlert size={18} />}
            sx={{
              color: 'text.secondary',
              opacity: !post.allowAction ? 0.5 : 1,
              '&:hover': { color: 'primary.main' },
            }}
          >
            Report
          </Button>
        )}
      </Box>
      {user?.id === post.authorId && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={toggleIsEditing}
            disabled={!post?.allowAction}
            startIcon={<Edit size={18} />}
            sx={{
              color: 'text.secondary',
              opacity: !post?.allowAction ? 0.5 : 1,
              '&:hover': { color: 'primary.main' },
            }}
          >
            Edit
          </Button>
          <Button
            onClick={() => setDeleteModalOpen(true)}
            startIcon={<Trash2 size={18} />}
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'error.main' },
            }}
          >
            Delete
          </Button>
        </Box>
      )}
    </Box>
  );
};

interface PostSectionProps {
  post: Post;
  user: User;
  isEditing: boolean;
  editedContent: string;
  handlePostVote: (postId: number, isUpvote: boolean) => Promise<void>;
  handleReportClick: (commentId?: number) => void;
  handleEditSubmit: (e: React.FormEvent) => Promise<void>;
  toggleIsEditing: () => void;
  setEditedContent: (content: string) => void;
  setDeleteModalOpen: (open: boolean) => void;
  scrollToComment: () => void;
}

export default function PostSection({
  post,
  user,
  isEditing,
  editedContent,
  handlePostVote,
  handleReportClick,
  handleEditSubmit,
  toggleIsEditing,
  setEditedContent,
  setDeleteModalOpen,
  scrollToComment
}: PostSectionProps) {
  return (
    <Box sx={{
      bgcolor: 'background.paper',
      borderRadius: 1,
      border: 1,
      borderColor: 'divider',
      p: { xs: 1, sm: 2 },
      mb: 2,
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ 
          color: 'text.primary',
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          wordBreak: 'break-word'
        }}>
          {post.title === null ? "[Deleted post]" : post.title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={`0 views`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <Eye size={16} />
              <Typography variant="caption">{0}</Typography>
            </Box>
          </Tooltip>
  
          <Tooltip title={`Created: ${new Date(post.createdAt).toLocaleString()}`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <Clock size={16} />
              <Typography variant="caption">
                {new Date(post.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <UserAvatar username={post.authorUsername} userId={post.authorId} />
        {post.authorUsername[0] === '[' ? (
          <Typography sx={{ color: user?.id === post.authorId ? 'success.main' : 'text.secondary' }}>
            {post.authorUsername}
          </Typography>
        ) : (
          <Link href={`/users/${post.authorUsername}`}>
            <Typography sx={{
              color: user?.id === post.authorId ? 'success.main' : 'text.secondary',
              '&:hover': { color: 'primary.main' }
            }}>
              {post.authorUsername}
            </Typography>
          </Link>
        )}
      </Box>
  
      {isEditing ? (
        <EditForm
          editedContent={editedContent}
          setEditedContent={setEditedContent}
          handleEditSubmit={handleEditSubmit}
          onCancel={() => {
            setEditedContent("");
            toggleIsEditing();
          }}
        />
      ) : (
        <Typography sx={{ color: 'text.primary', my: 1, whiteSpace: 'pre-wrap' }}>
          {post.content === null ? "[This post has been deleted by its author.]" : post.content}
        </Typography>
      )}
  
      <PostActions
        post={post}
        user={user}
        handlePostVote={handlePostVote}
        handleReportClick={handleReportClick}
        toggleIsEditing={toggleIsEditing}
        setDeleteModalOpen={setDeleteModalOpen}
        scrollToComment={scrollToComment}
      />
    </Box>
  )
}