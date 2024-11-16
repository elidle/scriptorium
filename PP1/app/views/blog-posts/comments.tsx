"use client";
import {
  Typography,
  IconButton,
  Avatar,
  Button,
  Collapse,
  AppBar,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Modal,
  Box
} from "@mui/material";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  MessageCircle,
  TriangleAlert,
  Star,
  Clock,
  TrendingUp,
  Zap,
  ChevronUp
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

const domain = "http://localhost:3000";

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
  allowVoting: boolean;
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
  allowVoting: boolean;
  userVote: number;
}

interface BlogPostProps {
  postId: number;
}

export function BlogPost({ postId }: BlogPostProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string>("");
  
  // Pagination states
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Sorting states
  const [sortBy, setSortBy] = useState<string>("new");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // New comment state
  const [newComment, setNewComment] = useState<string>("");

  // Comment button logic
  const newCommentRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [appBarHeight, setAppBarHeight] = useState(80);

  useEffect(() => {
    const appBar = document.querySelector('.MuiAppBar-root');
    if (appBar) {
      setAppBarHeight(appBar.clientHeight);
    }
  }, []);

  const scrollToComment = () => {
    if (newCommentRef.current) {
      const y = newCommentRef.current.getBoundingClientRect().top + 
                window.pageYOffset - 
                appBarHeight;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }

    // Wait for scroll animation to complete before focusing
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 500); // Adjust timing if needed to match your scroll duration
  };

  // Report logic
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(null);

  const handleReportClick = (commentId: number | null = null) => {
    setReportingCommentId(commentId);
    setReportModalOpen(true);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    // TODO: Make an API call to submit the report with the reason.
    e.preventDefault();
    if (!reportReason.trim()) {
      alert("Reason cannot be empty");
      return;
    }

    if (reportingCommentId === null) {
      alert(`Post ${post?.id} reported successfully with reason: "${reportReason}"`);
    } else {
      alert(`Comment ${reportingCommentId} reported successfully with reason: "${reportReason}"`);
    }

    setReportReason("");
    setReportModalOpen(false);
  };

  const sortOptions = [
    { value: "new", label: "New", icon: Star },
    { value: "old", label: "Old", icon: Clock },
    { value: "top", label: "Top", icon: TrendingUp },
    { value: "controversial", label: "Controversial", icon: Zap }
  ];

  useEffect(() => {
    fetchBlogPost();
    fetchComments(true);
  }, []);

  useEffect(() => {
    setComments([]);
    setPage(1);
    fetchComments(true);
  }, [sortBy]);

  const fetchBlogPost = async () => {
    try {
      const response = await fetch(`${domain}/api/blog-posts/${postId}`);
      const data = await response.json();
      setPost({...data, userVote: 0});
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const fetchComments = async (reset = false) => {
    try {
      const response = await fetch(`${domain}/api/comments?postId=${postId}&page=${reset ? 1 : page}&sortBy=${sortBy}`);
      const data = await response.json();

      const setUserVote = (comments: Comment[]): Comment[] => {
        return comments.map((comment) => ({
          ...comment,
          userVote: 0,
          replies: setUserVote(comment.replies)
        }));
      };

      const comments = setUserVote(data.comments);
      reset ? setComments(comments) : setComments((prevComments) => [...prevComments, ...comments]);

      setHasMore(data.hasMore);
      setPage(data.nextPage);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const handleVote = (increment: boolean, commentId: number | null = null) => {
    const voteChange = increment ? 1 : -1;
    if (commentId === null) {
      if (!post?.allowVoting) return;

      const newVote = post.userVote === voteChange ? 0 : voteChange;
      const scoreChange = newVote - post.userVote;
      setPost({
        ...post,
        score: post.score + scoreChange,
        userVote: newVote
      });
    } else {
      let found = false;

      const updateComments = (comments: Comment[]): Comment[] => {
        if (found) return comments;

        return comments.map((comment) => {
          if (comment.id === commentId) {
            found = true;
            if (!comment.allowVoting) return comment;

            const newVote = comment.userVote === voteChange ? 0 : voteChange;
            const scoreChange = newVote - comment.userVote;
            return {
              ...comment,
              score: comment.score + scoreChange,
              userVote: newVote
            };
          }
          return {
            ...comment,
            replies: updateComments(comment.replies)
          };
        });
      };

      setComments((prevComments) => updateComments(prevComments));
    }
  };

  const handleSortClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSortClose = (value?: string) => {
    setAnchorEl(null);
    if (value && value !== sortBy) setSortBy(value);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    // TODO: Connect to actual API endpoint
    e.preventDefault();
    
    if (!newComment.trim()) {
      alert("Comment cannot be empty");
      return;
    }

    alert(`Comment submitted: ${newComment}`);
    setNewComment("");
  };

  return (
    <div className="p-4 bg-slate-900 text-slate-200">
      {/* Modal for reporting */}
      <Modal open={reportModalOpen} onClose={() => setReportModalOpen(false)}>
        <Box
          sx={{
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
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: "rgb(96, 165, 250)" }}>
            Report {reportingCommentId === null ? "Post" : "Comment"}
          </Typography>
          <TextField
            fullWidth
            label="Reason"
            variant="outlined"
            multiline
            rows={4}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                handleReportSubmit(e);
              }
              if (e.key === 'Escape') {
                setReportModalOpen(false);
              }
            }}
            InputProps={{
              style: {
                backgroundColor: "rgb(30, 41, 59)",
                color: "rgb(203, 213, 225)",
              },
            }}
            InputLabelProps={{
              style: { color: "rgb(148, 163, 184)" }, // Label color
            }}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="contained"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleReportSubmit}
            >
              Submit
            </Button>
            <Button
              variant="outlined"
              className="border-blue-600 text-blue-600 hover:border-blue-700 hover:text-blue-700"
              onClick={() => setReportModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </Box>
      </Modal>

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-4">
          <Typography className="text-red-500">{error}</Typography>
        </div>
      )}

      {/* App Bar */}
      <AppBar 
        position="fixed" 
        className="bg-slate-800 border-b border-slate-700"
        sx={{ boxShadow: 'none' }}
      >
        <div className="p-3 flex flex-col sm:flex-row items-center gap-3">
          <Typography 
            className="text-xl sm:text-2xl text-blue-400 flex-shrink-0" 
            variant="h5"
          >
            Scriptorium
          </Typography>
          <div className="flex-grow"></div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 px-6 min-w-[100px] whitespace-nowrap h-9"
            variant="contained"
            size="small"
          >
            Sign In
          </Button>
        </div>
      </AppBar>

      <main className="flex-1 p-4 max-w-3xl mx-auto mt-10">
        {/* Post section */}
        {post && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-4">
            <Typography variant="h4" className="text-blue-400 mb-2">
              {post.title}
            </Typography>

            <Typography variant="body1" className="text-slate-300 mb-2">
              {post.content}
            </Typography>

            <div className="flex items-center gap-2 mb-4">
              <Avatar>{post.authorUsername[0].toUpperCase()}</Avatar>
              <Typography className="text-slate-400">
                {post.authorUsername} • {new Date(post.createdAt).toLocaleString()}
              </Typography>
            </div>

            <div className="flex items-center gap-2 mb-4">
              {/* Post Voting */}
              <IconButton 
                className={`hover:text-red-400 ${post.userVote === 1 ? 'text-red-400' : 'text-slate-400'}`} 
                onClick={() => handleVote(true)}
                disabled={!post?.allowVoting}
              >
                <ArrowUpCircle size={20} />
              </IconButton>
              <span className="text-sm font-medium text-slate-300">{post.score}</span>
              <IconButton 
                className={`hover:text-blue-400 ${post.userVote === -1 ? 'text-blue-400' : 'text-slate-400'}`} 
                onClick={() => handleVote(false)}
                disabled={!post?.allowVoting}
              >
                <ArrowDownCircle size={20} />
              </IconButton>
              
              {/* Post Actions */}
              <button onClick={scrollToComment} className="flex items-center gap-1 text-slate-400 hover:text-blue-400">
                <MessageCircle size={18} />
                <span className="text-sm"> Comment </span>
              </button>
              <button onClick={() => handleReportClick()} className="flex items-center gap-1 text-slate-400 hover:text-blue-400">
                <TriangleAlert size={18} />
                <span className="text-sm"> Report </span>
              </button>
            </div>  
          </div>
        )}

        {/* New Comment Input Section */}
        <div ref={newCommentRef} className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-4">
          <Typography variant="h6" className="text-blue-400 mb-3">
            Add a Comment
          </Typography>
            <form 
            onSubmit={handleCommentSubmit} 
            className="space-y-4"
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
              className="bg-slate-900"
              inputRef={commentInputRef}
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
              className="bg-blue-600 hover:bg-blue-700 px-6"
              >
              Submit
              </Button>
              <Button 
              onClick={() => setNewComment("")}
              variant="outlined"
              className="text-slate-300 border-slate-700 hover:border-blue-400"
              >
              Cancel
              </Button>
            </div>
          </form>
        </div>

        {/* Sorting Section */}
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h6" className="text-blue-400">
            Comments
          </Typography>
          <Button
            onClick={handleSortClick}
            className="text-slate-300 hover:text-blue-400"
          >
            Sort by: {sortOptions.find(option => option.value === sortBy)?.label}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => handleSortClose()}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                backgroundColor: 'rgb(30, 41, 59)',
                color: 'rgb(226, 232, 240)',
                '& .MuiMenuItem-root:hover': {
                  backgroundColor: 'rgb(51, 65, 85)',
                },
              },
            }}
          >
            {sortOptions.map((option) => (
              <MenuItem 
                key={option.value}
                onClick={() => handleSortClose(option.value)}
                selected={sortBy === option.value}
                className="text-slate-300 hover:text-blue-400"
              >
                <ListItemIcon className="text-slate-300">
                  <option.icon size={20} />
                </ListItemIcon>
                <ListItemText>{option.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </div>

        {/* Comment section */}
        <InfiniteScroll
          dataLength={comments.length}
          next={fetchComments}
          hasMore={hasMore}
          loader={<Typography className="text-blue-400">Loading comments...</Typography>}
          endMessage={<Typography className="text-slate-400">End of comments</Typography>}
        >
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} handleVote={handleVote} handleReportClick={handleReportClick}/>
            ))}
          </div>
        </InfiniteScroll>
      </main>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  handleVote: (increment: boolean, commentId: number | null) => void;
  handleReportClick: (commentId: number | null) => void;
}

function CommentItem({ comment, handleVote, handleReportClick }: CommentItemProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Reply states
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      alert("Reply cannot be empty");
      return;
    }
    alert(`Reply successfully submitted with content ${replyContent}`);
    setReplyContent('');
    setIsReplying(false);
    // TODO: Connect to actual API endpoint
  };

  return (
    <div className="ml-4 border-l border-slate-700 pl-4">
      {/* Header with voting and user info */}
      <div className="flex items-center gap-2 mb-2">
        <Avatar sx={{ width: 24, height: 24 }}>{comment.authorUsername[0].toUpperCase()}</Avatar>
          <Typography className="text-sm text-slate-400">
            {comment.authorUsername} • {new Date(comment.createdAt).toLocaleString()}
        </Typography>

        <IconButton 
          className={`hover:text-red-400 ${comment.userVote === 1 ? 'text-red-400' : 'text-slate-400'}`} 
          onClick={() => handleVote(true, comment.id)}
          disabled={!comment.allowVoting}
          sx={{ opacity: !comment.allowVoting ? 0.5 : 1 }}
        >
          <ArrowUpCircle size={20} />
        </IconButton>
        <span className="text-sm font-medium text-slate-300">{comment.score}</span>
        <IconButton 
          className={`hover:text-blue-400 ${comment.userVote === -1 ? 'text-blue-400' : 'text-slate-400'}`} 
          onClick={() => handleVote(false, comment.id)}
          disabled={!comment.allowVoting}
          sx={{ opacity: !comment.allowVoting ? 0.5 : 1 }}
        >
          <ArrowDownCircle size={20} />
        </IconButton>
      </div>

      {/* Comment content */}
      <Typography className="text-slate-300 mb-2 ml-10">{comment.content}</Typography>

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
        <button onClick={() => setIsReplying(true)} className="flex items-center gap-1 text-slate-400 hover:text-blue-400">
          <MessageCircle size={16} />
          <span className="text-xs">Reply</span>
        </button>
        <button onClick={() => handleReportClick(comment.id)} className="flex items-center gap-1 text-slate-400 hover:text-blue-400">
          <TriangleAlert size={16} />
          <span className="text-xs">Report</span>
        </button>
      </div>

      {/* Reply input field */}
      {isReplying && (
        <div className="ml-10 mb-4">
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
                handleVote={handleVote}
                handleReportClick={handleReportClick}
              />
            ))}
          </div>
        </Collapse>
      )}
    </div>
  );
}