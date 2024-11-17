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
  Edit,
  Trash2
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import CommentItem from "./CommentItem";
import Link from "next/link";
import { useAuth } from "../../../contexts/AuthContext";
import { refreshToken, fetchAuth } from "../../../utils/auth";
import { useRouter } from "next/navigation";
import { Tag } from '../../../types/tag';
import SideNav from "../../../components/SideNav";
import Image from "next/image";
import UserAvatar from "../../../components/UserAvatar";

const domain = "http://localhost:3000";

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

interface PostQueryParams {
  params: {
    postId: string;
  }
}

export default function BlogPost({ params }: PostQueryParams) {
  const router = useRouter();
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
  const [newCommentError, setNewCommentError] = useState<string>("");

  // Comment button logic
  const newCommentRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [appBarHeight, setAppBarHeight] = useState(80);

  // Delete logic
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string>("");

  // Edit logic
  const [isEditing, setIsEditing] = useState(false);
  const toggleIsEditing = () => setIsEditing(!isEditing);
  const [editedContent, setEditedContent] = useState("");
  const [editError, setEditError] = useState("");

  const { user, accessToken, setAccessToken } = useAuth();

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

    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 500);
  };

  // Report logic
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(null);
  const [reportError, setReportError] = useState<string>("");

  const handleReportClick = (commentId: number | null = null) => {
    setReportingCommentId(commentId);
    setReportModalOpen(true);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportReason.trim()) {
      setReportError("Reason cannot be empty");
      return;
    }

    if (!user || !accessToken) {
      router.push('/auth/login');
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

      setReportError('');
    } catch (err) {
      console.error('Error creating reply:', err);
      setReportError(err instanceof Error ? err.message : 'Failed to create reply');
    } finally {
      setReportReason('');
      setReportModalOpen(false);
      alert('Report submitted successfully');
    }

    setReportReason("");
    setReportError("");
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

      const data = await response.json();

      if (!response.ok) {
        setError(`${response.status} - ${data.error}`);
        return;
      }

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
  
      const data = await response.json();
  
      if (!response.ok) {
        setError(`${response.status} - ${data.error}`);
        return;
      }
  
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

  const handleVote = async (increment: boolean, commentId: number | null = null) => {
    const vote = increment ? 1 : -1;
    let newVote = 0;

    if (commentId === null) {
      if (!post?.allowAction) return;

      newVote = post.userVote === vote ? 0 : vote;
      setPost({
        ...post,
        score: post.score + newVote - post.userVote,
        userVote: newVote
      });

      await sendVote(newVote);
    } else {
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

      await sendVote(newVote, commentId);
    }
  };

  const sendVote = async (vote: number, commentId: number | null = null) => {
    if (!user || !accessToken) {
      router.push('/auth/login');
      return;
    }
    
    const url = commentId === null ? '/api/rate/post' : '/api/rate/comment';
    const method = vote === 0 ? 'DELETE' : 'POST';
    try {
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
      if (!response) return;

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to rate');
      }
    } catch (err) {
      console.error('Error rating:', err);
      const msg = err instanceof Error ? err.message : 'Failed to rate';
      alert(msg);
    }
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
      setNewCommentError("Comment cannot be empty");
      return;
    }

    if (!user || !accessToken) {
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

      await fetchComments(true);
      setNewCommentError("");
      setNewComment("");
    } catch (err) {
      console.error('Error creating comment:', err);
      setNewCommentError(err instanceof Error ? err.message : 'Failed to create comment');
    }
  };
  
  const handleDelete = async () => {
    if (user.id !== post?.authorId) {
      return;
    }

    if (!user || !accessToken) {
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

      setDeleteModalOpen(false);
      setDeleteError("");
      alert('Post deleted successfully');
      router.push('/blog-posts/search');
    } catch (err) {
      console.error('Error deleting post:', err);
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editedContent.trim()) {
      setEditError("Content cannot be empty");
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
      if (!response.ok) throw new Error(data.message);
  
      setPost(prev => prev ? {...prev, content: editedContent} : null);
      setIsEditing(false);
      setEditError("");
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to edit post');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-200">
      <SideNav />

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

          {reportError && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
              <Typography className="text-red-500">{reportError}</Typography>
            </div>
          )}

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
              style: { color: "rgb(148, 163, 184)" },
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

      {/* Modal for deleting */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
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
          <Typography variant="h6" gutterBottom sx={{ color: "rgb(239, 68, 68)" }}>
            Delete Post
          </Typography>
          <Typography className="text-slate-300 mb-4">
            Are you sure you want to delete this post? This action cannot be undone.
          </Typography>

          {deleteError && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
              <Typography className="text-red-500">{deleteError}</Typography>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="contained"
              className="!bg-red-600 hover:!bg-red-700 text-white"
              onClick={handleDelete}
            >
              Delete
            </Button>
            <Button
              variant="outlined"
              className="border-slate-600 text-slate-300 hover:border-slate-500"
              onClick={() => setDeleteModalOpen(false)}
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
        className="!bg-slate-800 border-b border-slate-700"
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
          {user ? (
          <div className="flex items-center gap-2">
            <UserAvatar username={user.username} userId={user.id} />

            <Typography className="text-slate-200">
              {user.username}
            </Typography>
          </div>
          ) : (
          <Link href="/auth/login">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 px-6 min-w-[100px] whitespace-nowrap h-9"
              variant="contained"
              size="small"
            >
              Log In
            </Button>
          </Link>
          )}
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
              <Typography variant="h4" className="text-blue-400">
                {post.title === null ? "[Deleted post]" : post.title}
              </Typography>

              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="space-y-4 mb-2 mt-2">
                  {editError && (
                    <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
                      <Typography className="text-red-500">{editError}</Typography>
                    </div>
                  )}
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="bg-slate-900"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '100%',
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
                      className="bg-blue-600 hover:bg-blue-700 px-6"
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
                <Typography variant="body1" className="text-slate-300 mb-2 mt-2" sx={{ whiteSpace: "pre-wrap" }}>
                  {post.content === null ? "[This post has been deleted by its author.]" : post.content}
                </Typography>
              )}

              <div className="flex items-center gap-2 mb-2 mt-2">
                <UserAvatar username={post.authorUsername} userId={post.authorId} />

                <Link href={`/users/${post.authorUsername}`}>
                  <Typography className={`hover:text-blue-400 ${user?.id === post.authorId ? 'text-green-400' : 'text-slate-400'}`}>
                    {post.authorUsername}
                  </Typography>
                </Link>

                <Typography className="text-slate-400">
                  • {new Date(post.createdAt).toLocaleString()}
                </Typography>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {/* Post Voting */}
                  <IconButton 
                    className={`group ${post.userVote === 1 ? '!text-red-400' : '!text-slate-400'}`} 
                    onClick={(e) => {e.preventDefault; handleVote(true);}}
                    disabled={!post?.allowAction}
                    sx={{ opacity: post?.allowAction ? '1 !important' : '0.5 !important' }}
                  >
                    <ArrowUpCircle className="group-hover:!text-red-400" size={20} />
                  </IconButton>
                  <span className="text-sm font-medium text-slate-300">{post.score}</span>
                  <IconButton 
                    className={`group ${post.userVote === -1 ? '!text-blue-400' : '!text-slate-400'}`} 
                    onClick={(e) => {e.preventDefault; handleVote(false);}}
                    disabled={!post?.allowAction}
                    sx={{ opacity: post?.allowAction ? '1 !important' : '0.5 !important' }}
                  >
                    <ArrowDownCircle className="group-hover:!text-blue-400" size={20} />
                  </IconButton>
                  
                  {/* Post Actions */}
                  <button 
                    onClick={scrollToComment} 
                    className={`flex items-center gap-1 text-slate-400 ${post?.allowAction ? 'hover:text-blue-400' : 'opacity-50'}`}
                    disabled={!post?.allowAction}
                  >
                    <MessageCircle size={18} />
                    <span className="text-sm"> Comment </span>
                  </button>
                  <button 
                    onClick={() => {if (post?.allowAction) handleReportClick()}} 
                    className={`flex items-center gap-1 text-slate-400 ${post?.allowAction ? 'hover:text-blue-400' : 'opacity-50'}`}
                    disabled={!post?.allowAction}
                  >
                    <TriangleAlert size={18} />
                    <span className="text-sm"> Report </span>
                  </button>
                </div>

                {/* Author buttons */}
                {user?.id === post.authorId && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditedContent(post.content);
                        toggleIsEditing();
                      }}
                      className={`flex items-center gap-1 text-slate-400 ${post?.allowAction ? 'hover:text-blue-400' : 'opacity-50'}`}
                      disabled={!post?.allowAction}
                    >
                      <Edit size={18} />
                      <span className="text-sm"> Edit </span>
                    </button>
                    <button 
                      onClick={() => setDeleteModalOpen(true)}
                      className={'flex items-center gap-1 text-slate-400 hover:text-red-400'}
                    >
                      <Trash2 size={18} />
                      <span className="text-sm"> Delete </span>
                    </button>
                  </div>
                )}
              </div>

              {/* New Comment Input Section */}
              {post?.allowAction ? (
                <div ref={newCommentRef} className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-4 min-h-[200px]">
                  <div ref={newCommentRef} className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-4 min-h-[200px]">
                    <Typography variant="h6" className="text-blue-400 mb-3">
                      Add a Comment
                    </Typography>

                    {newCommentError && (
                      <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
                        <Typography className="text-red-500">{newCommentError}</Typography>
                      </div>
                    )}

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
                </div>
              ) : (
                <div ref={newCommentRef} className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-4">
                  <Typography className="text-slate-400">
                    Comments are disabled for this post.
                  </Typography>
                </div>
              )}

              {/* Sorting Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <Typography variant="h6" className="text-blue-400">
                  Comments
                </Typography>
                <Button
                  onClick={handleSortClick}
                  className="!text-slate-300 hover:text-blue-400"
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
                      className="!text-slate-300 hover:text-blue-400"
                    >
                      <ListItemIcon className="!text-slate-300">
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
                      post={post}
                      handleVote={handleVote} 
                      handleReportClick={handleReportClick}
                      fetchComments={fetchComments}
                    />
                  ))}
                </div>
              </InfiniteScroll>
            </div>
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
