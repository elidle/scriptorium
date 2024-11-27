"use client";
import {
  Typography,
  Button,
  Box,
  CircularProgress
} from "@mui/material";
import {
  Star,
  Clock,
  TrendingUp,
  Zap
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

import PostSection from "./PostSection";
import CommentSection from "./CommentSection";
import InputModal from "@/app/components/InputModal";
import BaseLayout from "@/app/components/BaseLayout";

import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/contexts/ToastContext";

import { refreshToken, fetchAuth } from "@/app/utils/auth";
import { useRouter } from "next/navigation";

import ConfirmationModal from "@/app/components/ConfirmationModal";

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

  // Comment button logic
  const newCommentRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [appBarHeight, setAppBarHeight] = useState(80);

  // Delete logic
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Edit logic
  const [isEditing, setIsEditing] = useState(false);
  const toggleIsEditing = () => {
    if (isEditing) {
      setEditedContent("");
    } else {
      setEditedContent(post?.content || "");
    }
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

      const response = await fetchAuth({url, options, user, setAccessToken, router});
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
    { value: "new", label: "Newest first", icon: Star },
    { value: "old", label: "Oldest first", icon: Clock },
    { value: "top", label: "Top first", icon: TrendingUp },
    { value: "controversial", label: "Most controversial", icon: Zap }
  ];

  const fetchBlogPost = async () => {
    try {
      const url = `${domain}/api/blog-posts/${postId}?${user?.id ? `userId=${user.id}` : ''}`;
      const options: RequestInit = {
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
        } catch {
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
        ...(user?.id && { userId: String(user.id) })
      });
  
      const url = `${domain}/api/comments?${queryParams.toString()}`;
      const options: RequestInit = {
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
        } catch {
          response = await fetch(url, {}); // Fall back to guest view
        }
      }
  
      if (!response.ok) {
        response = await fetch(url, {}); // Fall back to guest view if anything else fails
      }

      const data = await response.json();
  
      if (reset) {
        setComments(data.comments);
      } else {
        setComments((prevComments) => [...prevComments, ...data.comments]);
      }
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
    const prevComments = comments;

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
        userId: user!.id,
        postId: postId,
        commentId: commentId,
        value: vote
      }),
    };

    const response = await fetchAuth({url, options, user: user!, setAccessToken, router});
    
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

      const response = await fetchAuth({url, options, user, setAccessToken, router});
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
      const url = `/api/blog-posts/${postId}`;
      const options : RequestInit = {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'access-token': `Bearer ${accessToken}`,
        }
      };

      const response = await fetchAuth({url, options, user, setAccessToken, router});
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
  
      const response = await fetchAuth({url, options, user, setAccessToken, router});
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
    <BaseLayout
      user={user}
      onSearch={() => router.push('/blog-posts/search')}
      type="post"
    >
      <Box component="main" sx={{ 
        flexGrow: 1,
        p: 2,
        maxWidth: '75rem',
        mx: 'auto'
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
            <Typography variant="h5" sx={{ color: 'error.main', mb: 2 }}>
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
            <PostSection 
              post={post}
              user={user!}
              isEditing={isEditing}
              editedContent={editedContent}
              handlePostVote={handlePostVote}
              handleReportClick={handleReportClick}
              handleEditSubmit={handleEditSubmit}
              toggleIsEditing={toggleIsEditing}
              setEditedContent={setEditedContent}
              setDeleteModalOpen={setDeleteModalOpen}
              scrollToComment={scrollToComment}
            />
            
            <CommentSection
              post={post}
              comments={comments}
              newComment={newComment}
              setNewComment={setNewComment}
              handleCommentSubmit={handleCommentSubmit}
              handleCommentVote={handleCommentVote}
              handleReportClick={handleReportClick}
              fetchComments={fetchComments}
              sortBy={sortBy}
              anchorEl={anchorEl}
              handleSortClick={handleSortClick}
              handleSortClose={handleSortClose}
              hasMore={hasMore}
              commentInputRef={commentInputRef}
              newCommentRef={newCommentRef}
              sortOptions={sortOptions}
            />
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
          </Box>
        )}
      </Box>

      {/* Report Modal */}
      <InputModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleReportSubmit}
        title={`Report ${reportingCommentId === null ? "Post" : "Comment"}`}
        value={reportReason}
        onChange={setReportReason}
        inputLabel="Reason"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
      />
    </BaseLayout>
  );
}