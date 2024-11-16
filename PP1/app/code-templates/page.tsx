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
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
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
  Rocket
} from 'lucide-react';
import ContentContainer from "@/app/components/ContentContainer";
import TagsContainer from "@/app/components/TagsContainer";
import ErrorBox from "@/app/components/ErrorBox";
import { CodeTemplate, Tag, SearchParams } from "@/app/types";
import SearchBar from "@/app/components/SearchBar";

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

  async fetchCodeTemplates(params: SearchParams) {
    const tagsQuery = params.tags.length ? `&tags=${params.tags.join('&tags=')}` : '';
    console.log("Query: ", `${this.domain}/api/code-templates/search?q=${params.query || ''}&sortBy=${params.sortBy || 'new'}&username=${params.username || ''}&page=${params.page}${tagsQuery}`); // TODO: Remove this line
    const response = await fetch(
      `${this.domain}/api/code-templates/search?q=${params.query || ''}&sortBy=${params.sortBy || 'new'}&username=${params.username || ''}&page=${params.page}${tagsQuery}`,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return response.json();
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

interface TemplateCardProps {
  template: CodeTemplate;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template }) => (
  <Card elevation={3}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="h5" component="h2">
          {template.title}
        </Typography>
        {template.isForked && (
          <Chip
            label="Forked"
            color="secondary"
            size="small"
            sx={{ ml: 1 }}
          />
        )}
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {template.explanation}
      </Typography>
      {template.tags && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {template.tags.map((tag, tagIndex) => (
            <Chip
              key={tagIndex}
              label={tag.name}
              size="small"
              sx={{ bgcolor: 'background.default' }}
            />
          ))}
        </Box>
      )}
    </CardContent>
  </Card>
);


export default function CodeTemplates() {
  // State management
  const [sideBarState, setSideBarState] = useState(false);
  const [codeTemplates, setCodeTemplates] = useState<CodeTemplate[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Memoized fetch functions
  const fetchCodeTemplates = useCallback(async (searchParams?: Partial<SearchParams>) => {
    if (isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const params: SearchParams = {
        page,
        tags: selectedTags,
        ...searchParams
      };

      const data = await API_SERVICE.fetchCodeTemplates(params);
      console.log("Fetch Code Templates: ", data); // TODO: Remove this line

      if (data.status === 'error') {
        throw new Error(data.message);
      }

      setCodeTemplates(prev =>
        params.page === 1 ? data.template : [...prev, ...data.template]
      );
      setHasMore(data.hasMore);
      setPage(data.nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedTags, isLoading]);

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

  // Render helpers
  // const renderTemplateCard = useCallback((template: CodeTemplate, key: number) => (
  //   <Card key={key} elevation={3}>
  //               <CardContent>
  //                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
  //                   <Typography variant="h5" component="h2">
  //                     {template.title}
  //                   </Typography>
  //                   {template.isForked && (
  //                     <Chip
  //                       label="Forked"
  //                       color="secondary"
  //                       size="small"
  //                       sx={{ ml: 1 }}
  //                     />
  //                   )}
  //                 </Box>
  //                 <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
  //                   {template.explanation}
  //                 </Typography>
  //                 {template.tags && (
  //                   <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
  //                     {template.tags.map((tag, tagIndex) => (
  //                       <Chip
  //                         key={tagIndex}
  //                         label={tag.name}
  //                         size="small"
  //                         sx={{ bgcolor: 'background.default' }}
  //                       />
  //                     ))}
  //                   </Box>
  //                 )}
  //               </CardContent>
  //             </Card>
  // ), []);

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
          path: '/run-code',
          highlight: true
        },
        {
          title: 'Code Templates',
          icon: <FileCode className="w-4 h-4" />,
          path: '/code-templates'
        }
      ]
    },
    {
      title: 'Blog Posts',
      icon: <BookOpen className="w-4 h-4" />,
      path: '/blog'
    },
    {
      title: 'AI Playground',
      icon: <Rocket className="w-4 h-4" />,
      path: '/playground'
    },
    {
      title: 'Code Games',
      icon: <Gamepad2 className="w-4 h-4" />,
      path: '/games'
    }
  ];

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
            <Typography variant="h5" component="h1" sx={{ flexGrow: 0, mr: 4 }}>
              Scriptorium
            </Typography>
            <Box sx={{ flexGrow: 1, mx: 4 }}>
              <SearchBar
                onSearch={handleGeneralSearch}
                placeholder="Search All..."
                className="w-full"
              />
            </Box>
            <Button
              variant="contained"
              color="secondary"
              sx={{ textTransform: 'none' }}
            >
              Sign In
            </Button>
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
                    <ListItemButton>
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
          {error && <ErrorBox errorMessage={error} />}

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
            >
              Create Template
            </Button>
            <Divider sx={{ my: 2 }} />
            <SearchBar
              onSearch={handleGeneralSearch}
              placeholder="Search Code Templates..."
            />
            <Box sx={{ mt: 2 }}>
              <TagsContainer
                selectedTags={selectedTags}
                handleSelectedTags={setSelectedTags}
                tags={tags}
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