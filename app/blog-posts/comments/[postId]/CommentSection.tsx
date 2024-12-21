import { Box, Typography, TextField, Button, CircularProgress } from "@mui/material";
import InfiniteScroll from "react-infinite-scroll-component";
import CommentItem from "./CommentItem";
import SortMenu from "@/app/components/SortMenu";
import { Comment } from "@/app/types/comment";
import { Post } from "@/app/types/post";
import { LucideIcon } from "lucide-react";

interface NewCommentFormProps {
  post: Post;
  newComment: string;
  setNewComment: (comment: string) => void;
  handleCommentSubmit: (e: React.FormEvent) => Promise<void>;
  commentInputRef: React.RefObject<HTMLTextAreaElement>;
  newCommentRef: React.RefObject<HTMLDivElement>;
}

const NewCommentForm = ({ post, newComment, setNewComment, handleCommentSubmit, commentInputRef, newCommentRef }: NewCommentFormProps) => (
  <Box
    ref={newCommentRef}
    sx={{
      bgcolor: 'background.paper',
      borderRadius: 1,
      border: 1,
      borderColor: 'divider',
      p: 2,
      mb: 2,
      minHeight: 'auto'
    }}
  >
    {post?.allowAction ? (
      <>
        <Typography variant="h6" sx={{ color: 'primary.main', mb: 1.5 }}>
          Add a Comment
        </Typography>
        <Box 
          component="form" 
          onSubmit={handleCommentSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              handleCommentSubmit(e);
            } else if (e.key === 'Escape') {
              commentInputRef.current?.blur();
            }
          }}
        >
          <TextField
            fullWidth
            multiline
            rows={4}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="What are your thoughts?"
            inputRef={commentInputRef}
            sx={{
              bgcolor: 'background.default',
              '& .MuiOutlinedInput-root': {
                color: 'text.primary',
                '& fieldset': { borderColor: 'divider' },
                '&:hover fieldset': { borderColor: 'text.secondary' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' },
              }
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
              onClick={() => setNewComment("")}
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
      </>
    ) : (
      <Typography sx={{ color: 'text.secondary' }}>
        Comments are disabled for this post.
      </Typography>
    )}
  </Box>
);

interface CommentSectionProps {
  post: Post;
  comments: Comment[];
  newComment: string;
  setNewComment: (comment: string) => void;
  handleCommentSubmit: (e: React.FormEvent) => Promise<void>;
  handleCommentVote: (commentId: number, isUpvote: boolean) => Promise<void>;
  handleReportClick: (commentId: number | null) => void;
  fetchComments: () => Promise<void>;
  sortBy: string;
  anchorEl: HTMLElement | null;
  handleSortClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  handleSortClose: (value?: string) => void;
  hasMore: boolean;
  commentInputRef: React.RefObject<HTMLTextAreaElement>;
  newCommentRef: React.RefObject<HTMLDivElement>;
  sortOptions: Array<{ value: string; label: string; icon: LucideIcon; }>;
}

export default function CommentSection({
  post,
  comments,
  newComment,
  setNewComment,
  handleCommentSubmit,
  handleCommentVote,
  handleReportClick,
  fetchComments,
  sortBy,
  anchorEl,
  handleSortClick,
  handleSortClose,
  hasMore,
  commentInputRef,
  newCommentRef,
  sortOptions
}: CommentSectionProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <NewCommentForm
        post={post}
        newComment={newComment}
        setNewComment={setNewComment}
        handleCommentSubmit={handleCommentSubmit}
        commentInputRef={commentInputRef}
        newCommentRef={newCommentRef}
      />

      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'start', sm: 'center' },
        gap: 1,
        mb: 2
      }}>
        <Typography variant="h6" sx={{ color: 'primary.main' }}>Comments</Typography>
        <Button
          onClick={handleSortClick}
          sx={{ color: 'text.primary', '&:hover': { color: 'primary.main' } }}
        >
          Sort by: {sortOptions.find(option => option.value === sortBy)?.label}
        </Button>
        <SortMenu
          sortBy={sortBy}
          anchorEl={anchorEl}
          onClose={handleSortClose}
          sortOptions={sortOptions}
        />
      </Box>

      <InfiniteScroll
        dataLength={comments.length}
        next={fetchComments}
        hasMore={hasMore}
        loader={<CircularProgress />}
        endMessage={<Typography sx={{ color: 'text.secondary' }}>End of comments</Typography>}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {comments.map((comment) => (
            <CommentItem 
              key={comment.id}
              comment={comment}
              post={post}
              handleVote={handleCommentVote}
              handleReportClick={handleReportClick}
              fetchComments={fetchComments}
            />
          ))}
        </Box>
      </InfiniteScroll>
    </Box>
  ) 
};