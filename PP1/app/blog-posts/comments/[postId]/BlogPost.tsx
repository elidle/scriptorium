"use client";
import {
  Typography,
  IconButton,
  Avatar,
  Button,
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
import CommentItem from "./CommentItem";
import Link from "next/link";

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

interface PostQueryParams {
  params: {
    postId: string;
  }
}

export default function BlogPost({ params }: PostQueryParams) {
  const postId = Number(params.postId);

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
      
      if (!response.ok) {
        setError(`${response.status} - ${data.error}`);
        setPost(null);
        return;
      }
      
      setPost({...data, userVote: 0});
      await fetchComments(true);
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

      if (!response.ok) {
        setError(`${response.status} - ${data.error}`);
        return;
      }

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
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-200">
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
          <Link href="/">
            <Typography 
              className="text-xl sm:text-2xl text-blue-400 flex-shrink-0" 
              variant="h5"
            >
            Scriptorium
            </Typography>
          </Link>
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

      <main className="flex-1 p-4 max-w-3xl w-full mx-auto mt-12 mb-10">
        {error ? (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
            <Typography variant="h5" className="text-red-400 mb-4">
              {error}
            </Typography>
            <Button 
              href="/blog-posts/search"
              variant="contained"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Back to Posts
            </Button>
          </div>
        ) : post ? (
          <>
            {/* Post Section */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-4 min-h-[200px] flex flex-col justify-between">
              <Typography variant="h4" className="text-blue-400 mb-2">
                {post.title === null ? "[Deleted post]" : post.title}
              </Typography>

              <Typography variant="body1" className="text-slate-300 mb-2">
                {post.content === null ? "This post has been deleted by its author." : post.content}
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

            {/* New Comment Input Section */}
            <div ref={newCommentRef} className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-4 min-h-[200px]">
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
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
                  <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    handleVote={handleVote} 
                    handleReportClick={handleReportClick}
                  />
                ))}
              </div>
            </InfiniteScroll>
          </>
        ) : (
          <div className="flex justify-center items-center">
            <Typography className="text-blue-400">Loading post...</Typography>
          </div>
        )}
      </main>
    </div>
  );
}
