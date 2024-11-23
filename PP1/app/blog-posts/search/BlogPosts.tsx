"use client";
import {
  AppBar,
  Typography,
  TextField,
  Button,
  Modal,
  Box, Drawer, IconButton, Theme, ThemeProvider
} from "@mui/material";
import React, {useCallback, useEffect, useState} from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import {Star, Clock, TrendingUp, Zap, Plus, ChevronRight, ChevronLeft, Menu} from "lucide-react";
import Link from 'next/link';
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useTheme } from "../../contexts/ThemeContext";
import ThemeToggle from "../../components/ThemeToggle";
import { refreshToken, fetchAuth } from "../../utils/auth";
import { useRouter } from "next/navigation";

import SideNav from "../../components/SideNav";
import UserAvatar from '../../components/UserAvatar';
import SortMenu from "../../components/SortMenu";
import PostPreview from "./PostPreview";

import { Post } from "../../types/post";
import debounce from "lodash.debounce";
import { Tag } from "@/app/types";
import TagsContainer from "@/app/components/TagsContainer";
const domain = "http://localhost:3000";

export default function BlogPosts() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();

  const [sideBarState, setSideBarState] = useState(false);
  const [blogPosts, setBlogPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");

  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

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
    if(!loading) fetchBlogPosts(true);
  }, [debouncedQuery, sortBy, selectedTags, user]);

  useEffect(() => {
    refreshTags();
  }, []);

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

      if (!response.ok) {
        response = await fetch(url, {}); // Fall back to guest view if anything else fails
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

  const searchTags = useCallback(
    debounce(async (query: string) => {
      setIsSearchingTags(true);
      setTagsError("");

      try {
        const response = await fetch(
          `${domain}/api/tags/search/?q=${encodeURIComponent(query)}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (data.status === "error") {
          throw new Error(data.message);
        }

        setTags(data.tags || []);
      } catch (err) {
        setTagsError(err instanceof Error ? err.message : "Failed to search tags");
        setTags([]);
      } finally {
        setIsSearchingTags(false);
      }
    }, 300),
    []
  );

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

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleTagsChange = (newTags: string[]) => {
    setSelectedTags(newTags);
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

  let rightDrawerWidth = 300;
  return (
    <ThemeProvider theme={theme}>
      <div className={`min-h-screen flex`} style={{ backgroundColor: theme.palette.background.default }}>
        {/* SideNav */}
        <div 
          className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
            isSideNavOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsSideNavOpen(false)}
        />

        <div className={`fixed left-0 top-0 h-screen w-64 border-r z-50 transition-transform duration-300 transform ${
          isSideNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
          style={{
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider
          }}
        >
          <SideNav router={router} />
        </div>
  
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
              InputProps={{
                style: {
                  backgroundColor: theme.palette.background.default,
                  color: theme.palette.text.primary,
                },
              }}
              InputLabelProps={{
                style: { color: theme.palette.text.secondary },
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="contained"
                onClick={handleReportSubmit}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  },
                  color: theme.palette.primary.contrastText
                }}
              >
                Submit
              </Button>
              <Button
                variant="outlined"
                onClick={() => setReportModalOpen(false)}
                sx={{
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    color: theme.palette.primary.dark
                  }
                }}
              >
                Cancel
              </Button>
            </div>
          </Box>
        </Modal>
  
        <div className="flex-1">
          {/* App Bar */}
          <AppBar
            position="fixed"
            sx={{
              width: '100%',
              zIndex: (theme: Theme) => theme.zIndex.drawer + 1,
              bgcolor: 'background.paper'
            }}
          >
            <div className="p-3 flex items-center gap-3">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSideNavOpen(!isSideNavOpen)}
                  style={{
                    color: theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                  className="p-1 rounded-lg transition-colors"
                >
                  <Menu size={24} />
                </button>
                <Link href="/">
                  <Typography 
                    className="text-xl sm:text-2xl flex-shrink-0"
                    variant="h5"
                    sx={{ color: theme.palette.primary.main }}
                  >
                    Scriptorium
                  </Typography>
                </Link>
              </div>
  
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
                    backgroundColor: theme.palette.background.default,
                    '&:hover': {
                      backgroundColor: theme.palette.background.default,
                    },
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
                  '& input': {
                    color: theme.palette.text.primary,
                  },
                }}
              />
  
              <div className="flex items-center gap-2">
                <ThemeToggle />
                {user ? (
                  <div className="flex items-center gap-2">
                    <UserAvatar username={user.username} userId={user.id} />
                    <Link href={`/users/${user.username}`} className="hidden sm:block">
                      <Typography sx={{ 
                        color: theme.palette.text.primary,
                        '&:hover': {
                          color: theme.palette.primary.main
                        }
                      }}>
                        {user.username}
                      </Typography>
                    </Link>
                  </div>
                ) : (
                  <Link href="/auth/login">
                    <Button
                      className="px-6 min-w-[100px] whitespace-nowrap h-9"
                      variant="contained"
                      size="small"
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        '&:hover': {
                          bgcolor: theme.palette.primary.dark,
                        }
                      }}
                    >
                      Log In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </AppBar>
  
          {/* Content container */}
          <main className="flex-1 p-4 max-w-7xl mx-auto">
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
                      onTagsChange={setSelectedTags}
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
                  p: 3,
                  marginTop: '64px',
                  transition: (theme) => theme.transitions.create(['margin'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.standard,
                  }),
                }}
              >
                {/* Sorting Section */}
                <div className="flex justify-between items-center mb-4">
                  <Typography variant="h4" className="text-blue-500">
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
                {debouncedQuery && (
                  <Typography className="mb-4 text-slate-400">
                    Showing results for "{debouncedQuery}"
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
                      <Typography sx={{ color: theme.palette.primary.main }}>Loading...</Typography>
                    </div>
                  }
                  endMessage={
                    blogPosts.length > 0 ? (
                      <Typography sx={{ color: theme.palette.text.secondary }}>
                        You've reached the end!
                      </Typography>
                    ) : (
                      <Typography className='text-center p-4' sx={{ color: theme.palette.primary.main }}>
                        No posts found{debouncedQuery ? ` for "${debouncedQuery}"` : ''}
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
        </div>
      </div>
    </ThemeProvider>
  );
}