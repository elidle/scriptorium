"use client";
import {
  Typography,
  Button,
  AppBar,
  TextField,
  Modal,
  Box, Theme, ThemeProvider,
  IconButton,
  CircularProgress
} from "@mui/material";
import {
  MessageCircle,
  TriangleAlert,
  Star,
  Clock,
  TrendingUp,
  Zap,
  Edit,
  Trash2,
  Menu
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import CommentItem from "./CommentItem";

import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/contexts/ToastContext";
import { useTheme } from "@/app/contexts/ThemeContext";

import { refreshToken, fetchAuth } from "@/app/utils/auth";
import { useRouter } from "next/navigation";

import SideNav from "@/app/components/SideNav";
import UserAvatar from "@/app/components/UserAvatar";
import SortMenu from "@/app/components/SortMenu";
import ConfirmationModal from "@/app/components/ConfirmationModal";
import ThemeToggle from "@/app/components/ThemeToggle";

import Link from "next/link";
import Voting from "@/app/blog-posts/Voting";

const domain = "http://localhost:3000";

import { Post } from "@/app/types/post";
import { Comment } from "@/app/types/comment";

interface PostQueryParams {
  params: {
    postId: string;
  }
}

export default function BlogPost({ params }: PostQueryParams) {
  const { showToast } = useToast();
  const { theme, isDarkMode } = useTheme();

  const router = useRouter();
  const postId = Number(params.postId);

  const [post, setPost] = useState<Post | null>(null);
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
  const [newCommentError, setNewCommentError] = useState<string>("");

  // Comment button logic
  const newCommentRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [appBarHeight, setAppBarHeight] = useState(80);

  // Delete logic
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // SideNav logic
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  // Edit logic
  const [isEditing, setIsEditing] = useState(false);
  const toggleIsEditing = () => {
    isEditing ? setEditedContent("") : setEditedContent(post?.content || "");
    setIsEditing(!isEditing)
  };
  const [editedContent, setEditedContent] = useState("");

  const { user, accessToken, setAccessToken, loading } = useAuth();

  useEffect(() => {
    const appBar = document.querySelector('.MuiAppBar-root');
    if (appBar) {
      setAppBarHeight(appBar.clientHeight);
    }
  }, []);

  useEffect(() => {
    setPost(null);
    if(!loading) fetchBlogPost();
  }, [user, loading]);

  // useEffect(() => {
  //   if(!loading) fetchBlogPost();
  // }, [loading]);

  useEffect(() => {
    setComments([]);
    setPage(1);
    if(!loading) fetchComments(true);
  }, [sortBy, user]);

  const scrollToComment = () => {
    if (newCommentRef.current) {
      const y = newCommentRef.current.getBoundingClientRect().top + 
                window.pageYOffset - 
                appBarHeight;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }

    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 500);
  };

  // Report logic
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(null);

  const handleReportClick = (commentId: number | null = null) => {
    setReportingCommentId(commentId);
    setReportModalOpen(true);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !accessToken) {
      showToast({ 
        message: 'Please log in to report', 
        type: 'info' 
      });
      router.push('/auth/login');
      return;
    }

    if (!reportReason.trim()) {
      showToast({
        message: 'Reason cannot be empty.',
        type: 'error'
      });
      return;
    }

    try {
      const url = reportingCommentId === null ? '/api/report/post' : '/api/report/comment';
      const jsonBody = reportingCommentId === null ? {
        reporterId: user.id,
        postId: postId,
        reason: reportReason
      } : {
        reporterId: user.id,
        commentId: reportingCommentId,
        reason: reportReason
      };
      const options : RequestInit = {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'access-token': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(jsonBody),
      };

      let response = await fetchAuth({url, options, user, setAccessToken, router});
      if (!response) return;

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create report');
      }

      showToast({ message: 'Report submitted successfully', type: 'success' });
      setReportReason('');
      setReportModalOpen(false);
    } catch (err) {
      showToast({ 
        message: err instanceof Error ? err.message : 'Failed to create report', 
        type: 'error' 
      });
    }
  };

  const sortOptions = [
    { value: "new", label: "New", icon: Star },
    { value: "old", label: "Old", icon: Clock },
    { value: "top", label: "Top", icon: TrendingUp },
    { value: "controversial", label: "Controversial", icon: Zap }
  ];

  const fetchBlogPost = async () => {
    try {
      const url = `${domain}/api/blog-posts/${postId}?${user?.id ? `userId=${user.id}` : ''}`;
      let options: RequestInit = {
        headers: user && accessToken ? {
          'access-token': `Bearer ${accessToken}`
        } : {}
      };

      let response = await fetch(url, options);

      if (response.status === 401 && user && accessToken) {
        try {
          const newToken = await refreshToken(user);
          setAccessToken(newToken);
          
          options.headers = {
            'access-token': `Bearer ${newToken}`
          };
          
          response = await fetch(url, options);
        } catch (err) {
          response = await fetch(url, {}); // Fall back to guest view if token refresh fails
        }
      }

      if (!response.ok) {
        response = await fetch(url, {}); // Fall back to guest view if anything else fails
      }

      const data = await response.json();

      setPost(data);
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
      const queryParams = new URLSearchParams({
        postId: postId.toString(),
        page: (reset ? 1 : page).toString(),
        sortBy: sortBy,
        ...(user?.id && { userId: user.id })
      });
  
      const url = `${domain}/api/comments?${queryParams.toString()}`;
      let options: RequestInit = {
        headers: user && accessToken ? {
          'access-token': `Bearer ${accessToken}`
        } : {}
      };
  
      let response = await fetch(url, options);
  
      if (response.status === 401 && user && accessToken) {
        try {
          const newToken = await refreshToken(user);
          setAccessToken(newToken);
          
          options.headers = {
            'access-token': `Bearer ${newToken}`
          };
          
          response = await fetch(url, options);
        } catch (err) {
          response = await fetch(url, {}); // Fall back to guest view
        }
      }
  
      if (!response.ok) {
        response = await fetch(url, {}); // Fall back to guest view if anything else fails
      }

      const data = await response.json();
  
      reset ? setComments(data.comments) : setComments((prevComments) => [...prevComments, ...data.comments]);
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

  const handlePostVote = async (postId: number, isUpvote: boolean) => {
    if (!user || !accessToken) {
      showToast({ message: 'Please log in to vote', type: 'info' });
      router.push('/auth/login');
      return;
    }
   
    if (!post?.allowAction) return;
   
    const vote = isUpvote ? 1 : -1;
    const newVote = post.userVote === vote ? 0 : vote;
    const previousPost = post;
   
    setPost({
      ...post,
      score: post.score + newVote - post.userVote,
      userVote: newVote
    });
   
    try {
      await sendVote(newVote);
      showToast({ 
        message: newVote === 0 ? 'Vote removed' : isUpvote ? 'Upvoted' : 'Downvoted', 
        type: 'success' 
      });
    } catch (err) {
      setPost(previousPost);
      throw err;
    }
   };
   
   const handleCommentVote = async (commentId: number, isUpvote: boolean) => {
    if (!user || !accessToken) {
      showToast({ message: 'Please log in to vote', type: 'info' });
      router.push('/auth/login');
      return;
    }

    // if (!post?.allowAction) return;
   
    const vote = isUpvote ? 1 : -1;
    let newVote = 0;
    let prevComments = comments;

    let found = false;
    const updateComments = (comments: Comment[]): Comment[] => {
      if (found) return comments;
   
      return comments.map((comment) => {
        if (comment.id === commentId) {
          found = true;
          if (!comment.allowAction) return comment;
   
          newVote = comment.userVote === vote ? 0 : vote;
          return {
            ...comment,
            score: comment.score + newVote - comment.userVote,
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
   
    try {
      await sendVote(newVote, commentId);
      showToast({ 
        message: newVote === 0 ? 'Vote removed' : isUpvote ? 'Upvoted' : 'Downvoted', 
        type: 'success' 
      });
    } catch (err) {
      setComments(prevComments);
      throw err;
    }
   };

  const sendVote = async (vote: number, commentId: number | null = null) => {    
    const url = commentId === null ? '/api/rate/post' : '/api/rate/comment';
    const method = vote === 0 ? 'DELETE' : 'POST';
    const options : RequestInit = {
      method: method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'access-token': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        userId: user.id,
        postId: postId,
        commentId: commentId,
        value: vote
      }),
    };

    let response = await fetchAuth({url, options, user, setAccessToken, router});
    
    if (!response) {
      throw new Error('Failed to submit vote - no response');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to rate');
    }

    return data;
  }

  const handleSortClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSortClose = (value?: string) => {
    setAnchorEl(null);
    if (value && value !== sortBy) setSortBy(value);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      showToast({
        message: 'Comment content cannot be empty.',
        type: 'error'
      });
      return;
    }

    if (!user || !accessToken) {
      showToast({ 
        message: 'Please log in to comment', 
        type: 'info' 
      });
      router.push('/auth/login');
      return;
    }

    try {
      const url = '/api/comments';
      const options : RequestInit = {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'access-token': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          authorId: user.id,
          content: newComment,
          postId: postId,
        }),
      };

      let response = await fetchAuth({url, options, user, setAccessToken, router});
      if (!response) return;
   
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create comment');
      }

      showToast({ message: 'Comment created successfully', type: 'success' });
      await fetchComments(true);
      setNewComment("");
    } catch (err) {
      showToast({ 
        message: err instanceof Error ? err.message : 'Failed to create comment', 
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
      const url = `/api/blog-posts/${postId}`;
      const options : RequestInit = {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'access-token': `Bearer ${accessToken}`,
        }
      };

      let response = await fetchAuth({url, options, user, setAccessToken, router});
      if (!response) return;
   
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete post');
      }

      showToast({ message: 'Post deleted successfully', type: 'success' });
      router.push('/blog-posts/search');
      setDeleteModalOpen(false);
    } catch (err) {
      showToast({ 
        message: err instanceof Error ? err.message : 'Failed to delete post', 
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
      const url = `/api/blog-posts/${postId}`;
      const options: RequestInit = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'access-token': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          "title": post?.title,
          "content": editedContent,
          "tags": post?.tags.map(tag => tag.id),
          "codeTemplateIds": []
        }),
      };
  
      let response = await fetchAuth({url, options, user, setAccessToken, router});
      if (!response) return;
  
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to edit post');
      }
  
      setPost(prev => prev ? {...prev, content: editedContent} : null);
      showToast({ message: 'Post edited successfully', type: 'success' });
      setEditedContent("");
      setIsEditing(false);
    } catch (err) {
      showToast({ 
        message: err instanceof Error ? err.message : 'Failed to edit post', 
        type: 'error'
      });
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: 'background.default'
      }}>
        {/* SideNav backdrop */}
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
            transition: 'opacity 0.3s',
            opacity: isSideNavOpen ? 1 : 0,
            pointerEvents: isSideNavOpen ? 'auto' : 'none',
          }}
          onClick={() => setIsSideNavOpen(false)}
        />
        
        {/* SideNav */}
        <Box sx={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          width: '256px',
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
          zIndex: 50,
          transition: 'transform 0.3s',
          transform: isSideNavOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}>
          <SideNav router={router} />
        </Box>

        {/* Report Modal */}
        <Modal open={reportModalOpen} onClose={() => setReportModalOpen(false)}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 24,
            p: 4,
          }}>
            <Typography variant="h4" sx={{ color: 'primary.main', mb: 2 }}>
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
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.default',
                  '& fieldset': {
                    borderColor: 'divider',
                  },
                  '&:hover fieldset': {
                    borderColor: 'text.secondary',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleReportSubmit}
                sx={{
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
              >
                Submit
              </Button>
              <Button
                variant="outlined"
                onClick={() => setReportModalOpen(false)}
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    color: 'primary.dark',
                  },
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* AppBar */}
        <AppBar 
          position="fixed"
          sx={{
            width: '100%',
            zIndex: (theme: Theme) => theme.zIndex.drawer + 1,
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              onClick={() => setIsSideNavOpen(!isSideNavOpen)}
              sx={{
                p: 1,
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(241, 245, 249, 0.8)',
                },
              }}
            >
              <Menu size={24} />
            </IconButton>
            
            <Link href="/">
              <Typography 
                variant="h5" 
                sx={{ 
                  color: 'primary.main',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  flexShrink: 0,
                }}
              >
                Scriptorium
              </Typography>
            </Link>

            <Box sx={{ flexGrow: 1 }} />

            <ThemeToggle />
            
            {user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UserAvatar username={user.username} userId={user.id} />
                <Link href={`/users/${user.username}`} className="hidden md:block">
                  <Typography sx={{ 
                    color: 'text.primary',
                    '&:hover': { color: 'primary.main' },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}>
                    {user.username}
                  </Typography>
                </Link>
              </Box>
            ) : (
              <Link href="/auth/login">
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    px: 3,
                    minWidth: '100px',
                    height: '36px',
                    whiteSpace: 'nowrap',
                    bgcolor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  }}
                >
                  Log In
                </Button>
              </Link>
            )}
          </Box>
        </AppBar>

        {/* Main Content */}
        <Box component="main" sx={{ 
          flexGrow: 1,
          p: 2,
          maxWidth: '75rem',
          mx: 'auto',
          mt: '80px'
        }}>
          {error ? (
            <Box sx={{
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
              p: 4,
              textAlign: 'center'
            }}>
              <Typography 
                variant="h5" 
                sx={{ color: 'error.main', mb: 2 }}
              >
                {error}
              </Typography>
              <Button 
                href="/blog-posts/search"
                variant="contained"
                sx={{
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                Back to Posts
              </Button>
            </Box>
          ) : post ? (
            <>
              {/* Post Section */}
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
                {/* Author Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, mt: 1 }}>
                  <UserAvatar username={post.authorUsername} userId={post.authorId} />
                  {post.authorUsername[0] === '[' ? (
                    <Typography sx={{ 
                      color: user?.id === post.authorId ? 'success.main' : 'text.secondary' 
                    }}>
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
                  <Typography sx={{ color: 'text.secondary' }}>
                    • {new Date(post.createdAt).toLocaleString()}
                  </Typography>
                </Box>

                {/* Post Title */}
                <Typography 
                  variant="h4" 
                  sx={{ 
                    color: 'text.primary',
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    wordBreak: 'break-word'
                  }}
                >
                  {post.title === null ? "[Deleted post]" : post.title}
                </Typography>

                {/* Post Content */}
                {isEditing ? (
                  <Box 
                    component="form" 
                    onSubmit={handleEditSubmit}
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 1 }}
                  >
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
                          setEditedContent("");
                          setIsEditing(false);
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
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {post.content === null ? "[This post has been deleted by its author.]" : post.content}
                  </Typography>
                )}

                {/* Post Actions */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'start', sm: 'center' },
                  gap: 1,
                  mb: 2,
                }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                    {/* Voting */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Voting item={post} handleVote={handlePostVote} />
                    </Box>
                    
                    {/* Comment Button */}
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
                    
                    {/* Report Button */}
                    {user?.id !== post.authorId && (
                      <Button
                        onClick={() => { if (post.allowAction) handleReportClick()}}
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

                  {/* Author Actions */}
                  {user?.id === post.authorId && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        onClick={() => toggleIsEditing()}
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

                {/* New Comment Section */}
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
                      <Typography 
                        variant="h6" 
                        sx={{ color: 'primary.main', mb: 1.5 }}
                      >
                        Add a Comment
                      </Typography>

                      {newCommentError && (
                        <Box sx={{
                          bgcolor: 'error.main',
                          opacity: 0.1,
                          border: 1,
                          borderColor: 'error.main',
                          borderRadius: 1,
                          p: 2,
                          mb: 3
                        }}>
                          <Typography sx={{ color: 'error.main' }}>
                            {newCommentError}
                          </Typography>
                        </Box>
                      )}

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

                {/* Comments Section */}
                <Box sx={{ mb: 2 }}>
                  {/* Sorting Header */}
                  <Box sx={{ 
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'start', sm: 'center' },
                    gap: 1,
                    mb: 2
                  }}>
                    <Typography variant="h6" sx={{ color: 'primary.main' }}>
                      Comments
                    </Typography>
                    <Button
                      onClick={handleSortClick}
                      sx={{
                        color: 'text.primary',
                        '&:hover': { color: 'primary.main' }
                      }}
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

                  {/* Comments List */}
                  <InfiniteScroll
                    dataLength={comments.length}
                    next={fetchComments}
                    hasMore={hasMore}
                    loader={
                      <CircularProgress />
                    }
                    endMessage={
                      <Typography sx={{ color: 'text.secondary' }}>
                        End of comments
                      </Typography>
                    }
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
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress />
            </Box>
          )}
        </Box>
      </Box>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
      />
    </ThemeProvider>
  );
}