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
  ThemeProvider,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  Divider,
  FormControl,
  Select,
  MenuItem,
  InputLabel
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
  Rocket, User
} from 'lucide-react';
import TagsContainer from "@/app/components/TagsContainer";
import ErrorBox from "@/app/components/ErrorBox";
import { CodeTemplate, Tag, SearchParams, SortByTypes } from "@/app/types";
import SearchBar from "@/app/components/SearchBar";
import {useRouter} from "next/navigation";
import TemplateCard from "@/app/components/TemplateCard";
import {fetchAuth, logoutUser} from "@/app/utils/auth";
import {useAuth} from "@/app/contexts/AuthContext";

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2563eb', // blue-600
    },
    secondary: {
      main: '#7c3aed', // violet-600
    },
    background: {
      default: '#0f172a', // slate-900
      paper: '#1e293b', // slate-800
    },
    text: {
      primary: '#f8fafc', // slate-50
      secondary: '#cbd5e1', // slate-300
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          marginBottom: '1rem',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1e293b',
          borderRight: '1px solid #334155',
          marginTop: '64px',
        },
      },
    },
  },
});

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

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // State management
  const [sideBarState, setSideBarState] = useState(false);
  const [codeTemplates, setCodeTemplates] = useState<CodeTemplate[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
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
    console.log("User: ", user); // TODO: Remove this line
    console.log("Access Token: ", accessToken); // TODO: Remove this line
    fetchCodeTemplates();
    fetchTags();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchCodeTemplates({ page: 1 });
  }, [selectedTags]);

  // Event handlers
  const handleGeneralSearch = useCallback((query: string) => {
    setPage(1);
    fetchCodeTemplates({ query, page: 1 });
  }, [fetchCodeTemplates]);

  const toggleSidebar = useCallback(() => {
    setSideBarState(prev => !prev);
  }, []);

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setPage(1);
    fetchCodeTemplates({ sortBy: event.target.value, page: 1 });
  };

  const [openCodeMenu, setOpenCodeMenu] = useState(true);
  const rightDrawerWidth = 340;
  const leftDrawerWidth = 240;

  const handleCodeMenuClick = () => {
    setOpenCodeMenu(!openCodeMenu);
  };

  const navigationItems = [
    {
      title: 'Code',
      icon: <Code className="w-4 h-4" />,
      submenu: [
        {
          title: 'Run Code',
          icon: <Play className="w-4 h-4" color="#10b981" />, // emerald-500
          path: '/code-templates/new',
          highlight: true
        },
        {
          title: 'Code Templates',
          icon: <FileCode className="w-4 h-4" />,
          path: '/code-templates/search'
        }
      ]
    },
    {
      title: 'Blog Posts',
      icon: <BookOpen className="w-4 h-4" />,
      path: '/blog'
    },
    ...(user ? [{
      title: 'Profile',
      icon: <User className="w-4 h-4" />,
      path: '/profile'
    }] : []),
  ];

  const AuthButtons = () => {
    const handleLogout = async () => {
      try {
        await logoutUser();
        setUser(null);
        setAccessToken(null);
      } catch (error) {
        console.error('Logout failed:', error);
        // Optionally show an error message to the user
      }
    };

    if (user) {
      return (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Welcome, {user.username}
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={handleLogout}
            sx={{
              borderColor: 'error.main',
              color: 'error.main',
              '&:hover': {
                borderColor: 'error.dark',
                backgroundColor: 'error.dark',
                color: 'white',
              },
            }}
          >
            Logout
          </Button>
        </Box>
      );
    }

    return (
      <Button
        variant="contained"
        color="secondary"
        sx={{ textTransform: 'none' }}
        onClick={() => router.push('/auth/login')}
      >
        Sign In
      </Button>
    );
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
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* AppBar */}
        <AppBar
          position="fixed"
          sx={{
            zIndex: (theme: Theme) => theme.zIndex.drawer + 1,
            bgcolor: 'background.paper'
          }}
        >
          <Toolbar>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                flexGrow: 0,
                mr: 4,
                cursor: 'pointer'
              }}
              onClick={() => handleNavigation('/')}
            >
              Scriptorium
            </Typography>
            <Box sx={{ flexGrow: 1, mx: 4 }}>
              <SearchBar
                onSearch={handleGeneralSearch}
                placeholder="Search All..."
                className="w-full"
              />
            </Box>
            <AuthButtons />
          </Toolbar>
        </AppBar>

        {/* Left Navigation Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            width: leftDrawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: leftDrawerWidth,
              boxSizing: 'border-box',
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider'
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {navigationItems.map((item) => (
                <React.Fragment key={item.title}>
                  {item.submenu ? (
                    <>
                      <ListItemButton onClick={handleCodeMenuClick}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.title} />
                        {openCodeMenu ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </ListItemButton>
                      <Collapse in={openCodeMenu} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {item.submenu.map((subitem) => (
                            <ListItemButton
                              key={subitem.title}
                              onClick={() => handleNavigation(subitem.path)}
                              sx={{
                                pl: 4,
                                ...(subitem.highlight && {
                                  bgcolor: 'rgba(16, 185, 129, 0.1)', // emerald with opacity
                                  '&:hover': {
                                    bgcolor: 'rgba(16, 185, 129, 0.2)',
                                  }
                                })
                              }}
                            >
                              <ListItemIcon>{subitem.icon}</ListItemIcon>
                              <ListItemText primary={subitem.title} />
                            </ListItemButton>
                          ))}
                        </List>
                      </Collapse>
                    </>
                  ) : (
                    <ListItemButton onClick={() => handleNavigation(item.path)}>
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.title} />
                    </ListItemButton>
                  )}
                </React.Fragment>
              ))}
            </List>
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            mt: 8,
            mr: sideBarState ? `${rightDrawerWidth}px` : 0,
            transition: (theme: Theme) => theme.transitions.create(['margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
          }}
        >
          <Box sx={{ mt: 2, mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="sort-by-label">Sort By</InputLabel>
              <Select
                labelId="sort-by-label"
                id="sort-by"
                value={sortBy}
                label="Sort By"
                onChange={handleSortChange}
                sx={{
                  bgcolor: 'background.paper',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                }}
              >
                <MenuItem value="new">Newest First</MenuItem>
                <MenuItem value="old">Oldest First</MenuItem>
                <MenuItem value="most_relevant">Most Relevant</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {error && <ErrorBox errorMessage={error} />}

          {codeTemplates.length === 0 && !isLoading ? (
            <NoTemplatesFound />
          ) : (
            <InfiniteScroll
              dataLength={codeTemplates.length}
              next={() => fetchCodeTemplates()}
              hasMore={hasMore}
              loader={
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              }
              endMessage={
                <Typography variant="body1" align="center" sx={{ p: 2 }}>
                  Yay! You have seen it all
                </Typography>
              }
            >
              {codeTemplates.map((template, index) => (
                <TemplateCard key={index} template={template} />
              ))}
            </InfiniteScroll>
          )}
        </Box>

        {/* Right Sidebar Drawer */}
        <Drawer
          variant="persistent"
          anchor="right"
          open={sideBarState}
          sx={{
            width: rightDrawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: rightDrawerWidth,
              boxSizing: 'border-box',
              // Add overlay effect instead of pushing content
              borderLeft: '1px solid',
              borderColor: 'divider',
              // Optional: add subtle shadow
              boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.1)',
            },
            // Optional: add backdrop for better visibility
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Plus className="w-4 h-4" />}
              fullWidth
              sx={{ mb: 2 }}
              onClick={handleCreateTemplate}
            >
              {user ? 'Create Template' : 'Sign In to Create Template'}
            </Button>
            <Divider sx={{ my: 2 }} />
            <SearchBar
              onSearch={handleGeneralSearch}
              placeholder="Search Code Templates..."
            />
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
            top: '80px',
            zIndex: (theme: Theme) => theme.zIndex.drawer + 2,
            bgcolor: 'background.paper',
            '&:hover': {
              bgcolor: 'background.default',
            },
            transition: (theme: Theme) => theme.transitions.create(['right'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
          }}
        >
          {sideBarState ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>
    </ThemeProvider>
  );
}