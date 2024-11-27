"use client";
import {
  Typography,
  Button,
  Box,
  Drawer,
  IconButton,
  Theme,
  CircularProgress
} from "@mui/material";
import React, { useEffect, useState} from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import {Star, Clock, TrendingUp, Zap, ChevronRight, ChevronLeft} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useTheme } from "../../contexts/ThemeContext";
import { refreshToken, fetchAuth } from "../../utils/auth";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import PostPreview from "./PostPreview";
import BaseLayout from "@/app/components/BaseLayout";
import SortMenu from "@/app/components/SortMenu";
import InputModal from "@/app/components/InputModal";

import { Post } from "../../types/post";
import { Tag } from "@/app/types";
import TagsContainer from "@/app/components/TagsContainer";
const domain = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function BlogPosts() {
  const router = useRouter();
  const { theme } = useTheme();

  const [sideBarState, setSideBarState] = useState(false);
  const [blogPosts, setBlogPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Searching and filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Query persistence
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Sorting states
  const [sortBy, setSortBy] = useState<string>("new");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Report states
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingPostId, setReportingPostId] = useState<number | null>(null);

  const { user, accessToken, setAccessToken, loading } = useAuth();
  const { showToast } = useToast();
  
  const sortOptions = [
    { value: "new", label: "Newest first", icon: Star },
    { value: "old", label: "Oldest first", icon: Clock },
    { value: "top", label: "Top first", icon: TrendingUp },
    { value: "controversial", label: "Most Controversial", icon: Zap }
  ];

  useEffect(() => {
    refreshTags();
  }, []);

  useEffect(() => {
    const query = searchParams.get('q') || '';
    const sort = searchParams.get('sortBy') || 'new';
    const urlTags = searchParams.getAll('tags');
    
    setSearchQuery(query);
    setSortBy(sort);
    setSelectedTags(urlTags);
  }, [searchParams]);

  useEffect(() => {
    setBlogPosts([]);
    setPage(1);
    if (!loading) fetchBlogPosts(true);
  }, [searchParams, loading]);

  const updateQueryParams = (params: Record<string, string | string[]>) => {
    const newSearchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => newSearchParams.append(key, v));
      } else if (value) {
        newSearchParams.set(key, value);
      }
    });
    
    router.push(`${pathname}?${newSearchParams.toString()}`);
  };

  const fetchBlogPosts = async (reset = false) => {
    const currentPage = reset ? 1 : page;
    const query = searchParams.get('q') || '';
    const currentSort = searchParams.get('sortBy') || 'new';
    const urlTags = searchParams.getAll('tags');
    
    const queryParams = new URLSearchParams({
      page: currentPage.toString(),
      sortBy: currentSort,
      ...(query && { q: query }),
      ...(user?.id && { userId: String(user.id) })
    });

    urlTags.forEach(tag => {
      queryParams.append('tags', tag);
    });

    try {
      const url = `${domain}/api/blog-posts/search?${queryParams.toString()}`;
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
      const posts = data.posts;

      if (reset) {
        setBlogPosts(posts);
      } else {
        setBlogPosts((prevPosts) => [...prevPosts, ...posts]);
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

  const refreshTags = async () => {
    try {
      const response = await fetch(`${domain}/api/tags/search/?q=`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.status === "error") {
        throw new Error(data.message);
      }

      setTags(data.tags || []);
    } catch {
      setTags([]);
    }
  };

  const handleSearch = (query: string) => {
    updateQueryParams({ 
      q: query, 
      sortBy: sortBy, 
      tags: selectedTags 
    });
  };

  const handleTagsChange = (newTags: string[]) => {
    updateQueryParams({ 
      q: searchQuery, 
      sortBy: sortBy, 
      tags: newTags 
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
  
    const response = await fetchAuth({url, options, user: user!, setAccessToken, router});
    
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
    if (value && value !== sortBy) {
      updateQueryParams({ 
        q: searchQuery, 
        sortBy: value, 
        tags: selectedTags 
      });
    }
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

  const toggleSidebar = () => {
    setSideBarState(!sideBarState);
  };

  const rightDrawerWidth = 300;
  return (
    <BaseLayout
      user={user}
      onSearch={handleSearch}
      type="post"
    >
      {/* Report Modal */}
      <InputModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleReportSubmit}
        title="Report Post"
        value={reportReason}
        onChange={setReportReason}
        inputLabel="Reason"
      />
  
      {/* Content container */}
      <main className="flex-1">
        {/* Right Sidebar */}
        <Drawer
          anchor="right"
          open={sideBarState}
          variant="temporary"
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            width: rightDrawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: rightDrawerWidth,
              boxSizing: 'border-box',
              borderLeft: '1px solid',
              borderColor: 'divider',
              boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.1)',
              marginTop: '64px',
              bgcolor: 'background.paper',
            },
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              marginTop: '64px',
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ mt: 2 }}>
              <TagsContainer
                selectedTags={selectedTags}
                onTagsChange={handleTagsChange}
                tags={tags}
                mode="search"
              />
            </Box>
          </Box>
        </Drawer>

        {/* Right Sidebar Toggle Button */}
        <IconButton
          onClick={toggleSidebar}
          sx={{
            position: 'fixed',
            right: sideBarState ? rightDrawerWidth : 0,
            top: '50%',
            zIndex: (theme: Theme) => theme.zIndex.drawer + 2,
            bgcolor: 'background.paper',
            border: 1,
            '&:hover': {
              bgcolor: theme.palette.background.default,
            },
            transition: (theme: Theme) => theme.transitions.create(['right'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
          }}
        >
          {sideBarState ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 2,
            maxWidth: '75rem',
            mx: 'auto',
            transition: (theme) => theme.transitions.create(['margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
          }}
        >
          {/* Sorting Section */}
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h4" sx={{ color: theme.palette.primary.main }}>
              Posts
            </Typography>
            <Button
              onClick={handleSortClick}
              sx={{
                color: theme.palette.text.primary,
                '&:hover': {
                  color: theme.palette.primary.main
                }
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
          </div>

          {/* Search status */}
          {searchParams.get('q') && (
            <Typography className="mb-4 text-slate-400">
              Showing results for &quot;{searchParams.get('q')}&quot;
            </Typography>
          )}

          {/* Error message */}
          {error && (
            <div style={{
              backgroundColor: theme.palette.error.main + '1A', // 10% opacity
              borderColor: theme.palette.error.main,
              borderWidth: 1,
              borderRadius: '0.5rem',
            }} className="p-4 mb-4">
              <Typography sx={{ color: theme.palette.error.main }}>{error}</Typography>
            </div>
          )}

          {/* Post Infinite Scroll List */}
          <InfiniteScroll
            dataLength={blogPosts.length}
            next={fetchBlogPosts}
            hasMore={hasMore}
            loader={
              <div className="text-center p-4">
                <CircularProgress />
              </div>
            }
            endMessage={
              blogPosts.length > 0 ? (
                <Typography sx={{ color: theme.palette.text.secondary }}>
                  You have reached the end!
                </Typography>
              ) : (
                <Typography className='text-center p-4' sx={{ color: theme.palette.primary.main }}>
                  No posts found
                </Typography>
              )
            }
          >
            <div className="space-y-4 max-w-full">
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
        </Box>
      </main>
    </BaseLayout>
  );
}