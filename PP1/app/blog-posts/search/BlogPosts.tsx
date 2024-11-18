"use client";
import {
  AppBar,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Modal,
  Box,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { Star, Clock, TrendingUp, Zap } from "lucide-react";
import Link from 'next/link';
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { refreshToken, fetchAuth } from "../../utils/auth";
import { useRouter } from "next/navigation";

import SideNav from "../../components/SideNav";
import UserAvatar from '../../components/UserAvatar';
import SortMenu from "../../components/SortMenu";
import PostPreview from "./PostPreview";

import { Post } from "../../types/post";
const domain = "http://localhost:3000";

export default function BlogPosts() {
  const router = useRouter();

  const [sideBarState, setSideBarState] = useState(false);
  const [blogPosts, setBlogPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Searching and filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // Sorting states
  const [sortBy, setSortBy] = useState<string>("new");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Report states
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingPostId, setReportingPostId] = useState<number | null>(null);

  const { user, accessToken, setAccessToken } = useAuth();
  const { showToast } = useToast();

  // TODO: This needs to be fetched from backend
  const availableTags = [
    "edited",
    "javascript",
    "programming",
    "web development",
    "hood klasik"
  ];

  const sortOptions = [
    { value: "new", label: "New", icon: Star },
    { value: "old", label: "Old", icon: Clock },
    { value: "top", label: "Top", icon: TrendingUp },
    { value: "controversial", label: "Controversial", icon: Zap }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setBlogPosts([]);
    setPage(1);
    fetchBlogPosts(true);
  }, [debouncedQuery, sortBy, selectedTags, user]);

  const fetchBlogPosts = async (reset = false) => {
    const currentPage = reset ? 1 : page;
    const queryParams = new URLSearchParams({
      page: currentPage.toString(),
      sortBy: sortBy,
      ...(debouncedQuery && { q: debouncedQuery }),
      ...(user?.id && { userId: user.id })
    });

    selectedTags.forEach(tag => {
      queryParams.append('tags', tag);
    });

    try {
      const url = `${domain}/api/blog-posts/search?${queryParams.toString()}`;
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
      const posts = data.posts;
      reset ? setBlogPosts(posts) : setBlogPosts((prevPosts) => [...prevPosts, ...posts]);

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

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleTagChange = (tag: string) => {
    setSelectedTags(prev => {
      const newTags = new Set(prev);
      if (newTags.has(tag)) {
        newTags.delete(tag);
      } else {
        newTags.add(tag);
      }
      return newTags;
    });
  };

  const handleVote = async (postId: number, isUpvote: boolean) => {
    if (postId === null) {
      showToast({ 
        message: 'Failed to submit vote - Please refresh your page', 
        type: 'error' 
      });
      return;
    }

    if (!user || !accessToken) {
      showToast({ 
        message: 'Please log in to vote', 
        type: 'info' 
      });
      router.push('/auth/login');
      return;
    }
    
    const vote = isUpvote ? 1 : -1;
    let newVote = 0;
    const previousPosts = blogPosts;
    
    setBlogPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          newVote = post.userVote === vote ? 0 : vote;
          return {
            ...post,
            score: post.score + newVote - post.userVote,
            userVote: newVote
          };
        }
        return post;
      })
    );
  
    try {
      await sendVote(newVote, postId);
      showToast({ 
        message: newVote === 0 ? 'Vote removed' : isUpvote ? 'Upvoted' : 'Downvoted', 
        type: 'success' 
      });
    } catch (err) {
      setBlogPosts(previousPosts);
      throw err;
    }
  };
  
  const sendVote = async (vote: number, postId: number) => {
    const method = vote === 0 ? 'DELETE' : 'POST';
    const url = '/api/rate/post';
    const options: RequestInit = {
      method: method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'access-token': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        userId: user!.id,
        postId: postId,
        value: vote
      }),
    };
  
    let response = await fetchAuth({url, options, user, setAccessToken, router});
    
    if (!response) {
      throw new Error('Failed to submit vote - no response');
    }
  
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to rate post');
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

  const handleReportClick = (postId: number) => {
    setReportingPostId(postId);
    setReportModalOpen(true);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportReason.trim()) {
      showToast({
        message: 'Report reason cannot be empty.',
        type: 'error'
      });
      return;
    }

    if (!user || !accessToken) {
      showToast({ 
        message: 'Please log in to report', 
        type: 'info' 
      });
      router.push('/auth/login');
      return;
    }

    try {
      const url = '/api/report/post';
      const options : RequestInit = {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'access-token': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          reporterId: user.id,
          postId: reportingPostId,
          reason: reportReason
        }),
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

  const toggleSidebar = () => {
    setSideBarState(!sideBarState);
  };

  return (
    <div className="min-h-screen flex bg-slate-900">
      <SideNav router={router}/>

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
            Report Post
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

      <div className="flex-1 ml-64">
        {/* App Bar */}
        <AppBar 
          position="fixed" 
          className="!bg-slate-800 border-b border-slate-700"
          sx= {{ boxShadow: 'none' }}
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
            
            <TextField 
              className="flex-grow"
              color="info"
              variant="outlined"
              label="Search Posts..."
              size="small"
              value={searchQuery}
              onChange={handleSearch}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgb(30, 41, 59)',
                  '&:hover': {
                    backgroundColor: 'rgb(30, 41, 59, 0.8)',
                  },
                  '& fieldset': {
                    borderColor: 'rgb(100, 116, 139)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgb(148, 163, 184)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgb(148, 163, 184)',
                },
                '& input': {
                  color: 'rgb(226, 232, 240)',
                },
              }}
            />

            {user ? (
              <div className="flex items-center gap-2">
                <UserAvatar username={user.username} userId={user.id} />

                <Link href={`/users/${user.username}`}>
                  <Typography className="text-slate-200 hover:text-blue-400">
                    {user.username}
                  </Typography>
                </Link>
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

        {/* Content container */}
        <div className="pt-16">
          <div className="flex flex-row-reverse relative">
            {/* Overlay */}
            <div 
              onClick={toggleSidebar}
              className={`fixed inset-0 bg-black transition-opacity duration-300 ${
                sideBarState ? "opacity-50 visible" : "opacity-0 invisible"
              } md:hidden`}
            />

            {/* Right Sidebar */}
            <aside className={`
              fixed md:sticky top-16 h-[calc(100vh-4rem)]
              transform transition-transform duration-300 w-64
              ${sideBarState ? "-translate-x-0" : "translate-x-full md:translate-x-0"} 
              right-0 md:right-auto
              bg-slate-800 border-l border-slate-700 z-40
            `}>
              <div className="p-4 h-full flex flex-col">
              <TextField
                color="info"
                variant="outlined"
                label="Search Tags..."
                size="small"
                className="mb-4"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgb(30, 41, 59)',
                    '&:hover': {
                      backgroundColor: 'rgb(30, 41, 59, 0.8)',
                    },
                    '& fieldset': {
                      borderColor: 'rgb(100, 116, 139)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgb(148, 163, 184)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgb(148, 163, 184)',
                  },
                  '& input': {
                    color: 'rgb(226, 232, 240)',
                  },
                }}
              />
                
                <Typography variant="h6" className="mb-2 text-blue-400">
                  Tags
                </Typography>
                
                <FormGroup className="flex-1 overflow-y-auto p-2 border border-slate-700 rounded bg-slate-900/50">
                  {availableTags.map(tag => (
                    <FormControlLabel 
                      key={tag}
                      control={
                        <Checkbox 
                          checked={selectedTags.has(tag)}
                          onChange={() => handleTagChange(tag)}
                          sx={{
                            color: 'rgb(96, 165, 250)',
                            '&.Mui-checked': {
                              color: 'rgb(96, 165, 250)',
                            },
                          }}
                        />
                      } 
                      label={tag}
                      sx={{
                        '& .MuiFormControlLabel-label': {
                          color: 'rgb(226, 232, 240)',
                          // fontSize: '0.875rem',
                        }
                      }}
                    />
                  ))}
                </FormGroup>
              </div>

              {/* Mobile toggle button */}
              <button 
                onClick={toggleSidebar}
                className="absolute left-0 top-1/2 -translate-x-full bg-blue-500 p-2 rounded-l-xl md:hidden text-white"
              >
                {sideBarState ? "→" : "←"}
              </button>
            </aside>

            {/* Main content */}
            <main className="flex-1 p-4 max-w-3xl mx-auto">
              {/* Sorting Section */}
              <div className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="text-blue-400">
                  Posts
                </Typography>
                <Button
                  onClick={handleSortClick}
                  className="!text-slate-300 hover:text-blue-400"
                >
                  Sort by: {sortOptions.find(option => option.value === sortBy)?.label}
                </Button>
                <SortMenu
                  sortBy={sortBy}
                  anchorEl={anchorEl}
                  onClose={handleSortClose}
                  sortOptions={sortOptions}
                />
              </div>

              {/* Search status */}
              {debouncedQuery && (
                <Typography className="mb-4 text-slate-400">
                  Showing results for "{debouncedQuery}"
                </Typography>
              )}

              {/* Error message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-4">
                  <Typography className="text-red-500">{error}</Typography>
                </div>
              )}
              
              {/* Post Infinite Scroll List */}
              <InfiniteScroll
                dataLength={blogPosts.length}
                next={fetchBlogPosts}
                hasMore={hasMore}
                loader={
                  <div className="text-center p-4">
                    <Typography className="text-blue-400">Loading...</Typography>
                  </div>
                }
                endMessage={
                  blogPosts.length > 0 ? (
                    <Typography className="text-center p-4 text-slate-400">
                      You've reached the end!
                    </Typography>
                  ) : (
                    <Typography className="text-center p-4 text-slate-400">
                      No posts found{debouncedQuery ? ` for "${debouncedQuery}"` : ''}
                    </Typography>
                  )
                }
              >
                <div className="space-y-4">
                {blogPosts.map((post) => (
                  <PostPreview 
                    key={post.id}
                    post={post}
                    handleVote={handleVote}
                    handleReportClick={handleReportClick}
                  />
                ))}
                </div>
              </InfiniteScroll>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}