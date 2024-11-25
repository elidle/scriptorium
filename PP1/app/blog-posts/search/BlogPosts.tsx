"use client";
import {
  AppBar,
  Typography,
  TextField,
  Button,
  Modal,
  Box,
} from "@mui/material";
import React, {useCallback, useEffect, useState} from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import {Star, Clock, TrendingUp, Zap, Plus, ChevronRight, ChevronLeft, Menu} from "lucide-react";
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
import debounce from "lodash.debounce";
import {CodeTemplate, Tag} from "@/app/types";
import TagsContainer from "@/app/components/TagsContainer";
import SearchBar from "@/app/components/SearchBar";
import SearchTemplate from "@/app/components/SearchTemplate";
import BaseLayout from "@/app/components/BaseLayout";
import FilterDrawer from "@/app/components/FilterDrawer";
import {useTheme} from "@/app/contexts/ThemeContext";
const domain = "http://localhost:3000";

export default function BlogPosts() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();

  const [sideBarState, setSideBarState] = useState(false);
  const [blogPosts, setBlogPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");

  // Code templates related state
  const [selectedTemplates, setSelectedTemplates] = useState<CodeTemplate[]>([]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Searching and filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSearchingTags, setIsSearchingTags] = useState(false);
  const [tagsError, setTagsError] = useState("");

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
    if (!loading) fetchBlogPosts(true);
  }, [debouncedQuery, sortBy, selectedTags, selectedTemplates, user, loading]);

  useEffect(() => {
    refreshTags();
  }, []);

  const fetchBlogPosts = async (reset = false) => {
    const currentPage = reset ? 1 : page;
    const queryParams = new URLSearchParams({
      page: currentPage.toString(),
      sortBy: sortBy,
      ...(debouncedQuery && { q: debouncedQuery }),
      ...(user?.id && { userId: user.id }),
    });

    selectedTags.forEach(tag => {
      queryParams.append('tags', tag);
    });

    selectedTemplates.forEach(template => {
      queryParams.append('codeTemplateIds', template.id.toString());
    });

    try {
      const url = `${domain}/api/blog-posts/search?${queryParams.toString()}`;
      console.log("BP Url: ", url);
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

  const refreshTags = async () => {
    setIsSearchingTags(true);
    setTagsError("");

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
    } catch (err) {
      setTagsError(err instanceof Error ? err.message : "Failed to refresh tags");
    } finally {
      setIsSearchingTags(false);
    }
  };

  const handleSearch = (searchTerm: string) => {
    setSearchQuery(searchTerm);
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
  
    const response = await fetchAuth({url, options, user, setAccessToken, router});
    
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

  const rightDrawerWidth = 400;
  return (
    <BaseLayout
      user={user}
      onSearch={handleSearch}
      type="post"
    >
      <div className={`min-h-screen flex ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        {/* Modal for reporting */}
        <Modal open={reportModalOpen} onClose={() => setReportModalOpen(false)}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: "8px",
              p: 4,
              boxShadow: 24,
              color: theme.palette.text.primary,
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: theme.palette.background.default,
                  color: theme.palette.text.primary,
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.text.secondary,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.text.secondary,
                },
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="contained"
                sx={{
                  bgcolor: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  },
                }}
                onClick={handleReportSubmit}
              >
                Submit
              </Button>
              <Button
                variant="outlined"
                sx={{
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    color: theme.palette.primary.dark,
                  },
                }}
                onClick={() => setReportModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </Box>
        </Modal>

        <div className="flex-1 transition-all duration-300">
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
              <FilterDrawer
                isOpen={sideBarState}
                onToggle={toggleSidebar}
                width={rightDrawerWidth}
                sx={{
                  '& .MuiDrawer-paper': {
                    bgcolor: theme.palette.background.paper,
                    borderLeft: `1px solid ${theme.palette.divider}`,
                  },
                }}
              >
                <Box sx={{mt: 2}}>
                  <SearchTemplate
                    selectedTemplates={selectedTemplates}
                    onTemplateSelect={setSelectedTemplates}
                    mode="search"
                  />
                  <TagsContainer
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                    tags={tags}
                    mode="search"
                  />
                </Box>
              </FilterDrawer>

              {/* Main content */}
              <main className="flex-1 p-4 max-w-3xl mx-auto">
                {/* Sorting Section */}
                <div className="flex justify-between items-center mb-4">
                  <Typography
                    variant="h6"
                    sx={{ color: theme.palette.primary.main }}
                  >
                    Posts
                  </Typography>
                  <Button
                    onClick={handleSortClick}
                    sx={{
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        color: theme.palette.primary.main,
                      },
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
                {debouncedQuery && (
                  <Typography sx={{ color: theme.palette.text.secondary }} className="mb-4">
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
                      <Typography sx={{ color: theme.palette.primary.main }} className="text-center p-4">
                        Loading...
                      </Typography>
                    </div>
                  }
                  endMessage={
                    blogPosts.length > 0 ? (
                      <Typography sx={{ color: theme.palette.text.secondary }} className="text-center p-4">
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
    </BaseLayout>
  );
}