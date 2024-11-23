"use client";
import {
  AppBar,
  Typography,
  Button,
  IconButton,
  Drawer,
  Box,
  Toolbar,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Theme,
  createTheme,
  Divider,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  ChevronLeft,
  ChevronRight,
  Code,
  Play,
  FileCode,
  BookOpen,
  Plus,
  Gamepad2,
  ChevronDown,
  ChevronUp,
  Rocket, User, Star, Clock, TrendingUp
} from 'lucide-react';
import TagsContainer from "@/app/components/TagsContainer";
import ErrorBox from "@/app/components/ErrorBox";
import { CodeTemplate, Tag, SearchParams, SortByTypes } from "@/app/types";
import SearchBar from "@/app/components/SearchBar";
import {useRouter} from "next/navigation";
import TemplateCard from "@/app/components/TemplateCard";
import {fetchAuth} from "@/app/utils/auth";
import {useAuth} from "@/app/contexts/AuthContext";
import BaseLayout from "@/app/components/BaseLayout";
import SortMenu from "@/app/components/SortMenu";
import FilterDrawer from "@/app/components/FilterDrawer";

const API_SERVICE = {
  domain: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',

   async fetchCodeTemplates(params: SearchParams, accessToken = null, user = null, setAccessToken = null, router = null) {
    const tagsQuery = params.tags.length ? `&tags=${params.tags.join('&tags=')}` : '';
    const url = `${this.domain}/api/code-templates/search?q=${params.query || ''}&sortBy=${params.sortBy || 'new'}&username=${params.username || ''}&page=${params.page}${tagsQuery}`;

    if (user && setAccessToken) {
      // Authenticated request
      const response = await fetchAuth({
        url,
        options: {
          headers: {
            'Content-Type': 'application/json',
            'access-token': accessToken ? accessToken : "",
          }
        },
        user,
        setAccessToken,
        router
      });

      if (!response) return { status: 'error', message: 'Authentication failed' };
      return response.json();
    } else {
      // Public request
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    }
  },

  async fetchTags(query: string = '') {
    const response = await fetch(
      `${this.domain}/api/tags/search/?q=${query}`,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return response.json();
  }
};

export default function CodeTemplates() {
  const router = useRouter();
  const { user, setUser, accessToken, setAccessToken } = useAuth();

  // Handle routing
  const handleCreateTemplate = () => {
    if (!user) {
      router.push('/auth/login');
    } else {
      router.push('/code-templates/new');
    }
  };

  // State management
  // Sidebars state
  const [sideBarState, setSideBarState] = useState(false);

  // Code templates state
  const [codeTemplates, setCodeTemplates] = useState<CodeTemplate[]>([]);

  // Tags state
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // SortBy state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const sortOptions = [
    { value: "new", label: "Newest First", icon: Star },
    { value: "old", label: "Oldest First", icon: Clock },
    { value: "most_relevant", label: "Most Relevant", icon: TrendingUp }
  ];
  const handleSortClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortByTypes>('new');

  // Memoized fetch functions
  const fetchCodeTemplates = useCallback(async (searchParams?: Partial<SearchParams>) => {
    if (isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const params: SearchParams = {
        page,
        tags: selectedTags,
        sortBy: sortBy,
        ...searchParams
      };

      const data = await API_SERVICE.fetchCodeTemplates(params, accessToken, user, setAccessToken, router);

      if (data.status === 'error') {
        if (data.message === 'No templates found') {
          setCodeTemplates([]);
          setHasMore(false);
          return;
        }
        throw new Error(data.message);
      }

      setCodeTemplates(prev =>
        params.page === 1 ? data.templates : [...prev, ...data.templates]
      );
      setHasMore(data.hasMore);
      setPage(data.nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedTags, isLoading, sortBy]);

  const fetchTags = useCallback(async () => {
    setError('');
    try {
      const data = await API_SERVICE.fetchTags();

      if (data.status === 'error') {
        throw new Error(data.message);
      }

      setTags(data.tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }, []);

  // Effects
  useEffect(() => {
    console.log("CD, User: ", user); // TODO: Remove this line
    console.log("CD, Access Token: ", accessToken); // TODO: Remove this line
    fetchCodeTemplates();
    fetchTags();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchCodeTemplates({ page: 1 });
  }, [selectedTags]);

  // Debugging
  useEffect(() => {
    console.log("Debug Code Templates: ", codeTemplates); // TODO: Remove this line
  }, [codeTemplates]);

  // Event handlers
  const handleCodeTemplateSearch = useCallback((query: string) => {
    setPage(1);
    fetchCodeTemplates({ query, page: 1 });
  }, [fetchCodeTemplates]);

  const toggleSidebar = useCallback(() => {
    setSideBarState(prev => !prev);
  }, []);

  // SortBy handlers
  const handleSortClose = (value?: string) => {
    setAnchorEl(null);
    if (value && value !== sortBy) {
      setSortBy(value as SortByTypes);
      setPage(1);
      fetchCodeTemplates({ sortBy: value, page: 1 });
    }
  };

  const NoTemplatesFound = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <FileCode className="w-16 h-16 mb-4 text-slate-400" />
      <Typography variant="h5" gutterBottom sx={{ color: 'text.primary' }}>
        No templates found
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: '500px', mb: 3 }}>
        {selectedTags.length > 0
          ? `No templates match the selected tags: ${selectedTags.join(', ')}`
          : 'No templates match your search criteria'}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {selectedTags.length > 0 && (
          <Button
            variant="outlined"
            onClick={() => setSelectedTags([])}
            sx={{
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.light',
                bgcolor: 'rgba(37, 99, 235, 0.1)'
              }
            }}
          >
            Clear Filters
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleCreateTemplate}
          startIcon={<Plus className="w-4 h-4" />}
          sx={{
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark'
            }
          }}
        >
          {user ? 'Create Template' : 'Sign In to Create Template'}
        </Button>
      </Box>
    </Box>
  );

  return (
    <BaseLayout
      user={user}
      onSearch={handleCodeTemplateSearch}
      type="code-template"
    >
      <Box sx={{display: 'flex', minHeight: '100vh', bgcolor: 'background.default'}}>
        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            pt: 10,
            maxWidth: '3xl',
            margin: '0 auto',
            transition: (theme: Theme) => theme.transitions.create(['margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
          }}
        >
          {/* Sorting Section */}
          <Box className="flex max-w-3xl mx-auto justify-between items-center mb-4">
            <Typography variant="h6" className="text-blue-400">
              Templates
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
        </Box>

          {error && <ErrorBox errorMessage={error} sx={{ mb: 4 }} />}

          {codeTemplates.length === 0 && !isLoading ? (
            <NoTemplatesFound />
          ) : (
            <InfiniteScroll
              className="flex-1 p-4 max-w-3xl mx-auto"
              dataLength={codeTemplates.length}
              next={() => fetchCodeTemplates()}
              hasMore={hasMore}
              loader={
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              }
              endMessage={
                <Typography variant="body1" align="center" sx={{ p: 4, color: 'text.secondary' }}>
                  You've reached the end!
                </Typography>
              }
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {codeTemplates.map((template, index) => (
                  <TemplateCard key={index} template={template} />
                ))}
              </Box>
            </InfiniteScroll>
          )}
        </Box>

        {/* Right Sidebar Drawer */}
        <FilterDrawer
          isOpen={sideBarState}
          onToggle={toggleSidebar}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<Plus className="w-4 h-4"/>}
            fullWidth
            sx={{mb: 2}}
            onClick={handleCreateTemplate}
          >
            {user ? 'Create Template' : 'Sign In to Create Template'}
          </Button>
          <Divider sx={{my: 2}}/>
          <SearchBar
            onSearch={handleCodeTemplateSearch}
            placeholder="Search Code Templates..."
          />
          <Box sx={{mt: 2}}>
            <TagsContainer
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              tags={tags}
              mode="search"
            />
          </Box>
        </FilterDrawer>
      </Box>
    </BaseLayout>
  );
}