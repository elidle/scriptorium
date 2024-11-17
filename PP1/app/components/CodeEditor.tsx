"use client"; // Enable client-side rendering

import React, {useCallback, useEffect, useState} from 'react';
import {
  AppBar,
  Button,
  TextField,
  Select,
  MenuItem,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Box,
  Toolbar,
  Container,
  createTheme,
  ThemeProvider,
  Modal,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions, IconButton, Tooltip, AlertTitle
} from '@mui/material';
import {ArrowLeft, GitFork, Heart, Play, Plus, Save, Share2} from 'lucide-react';
import SearchBar from '@/app/components/SearchBar';
import {CodeTemplate, SearchParams, Tag} from '@/app/types'
import TagsContainer from "@/app/components/TagsContainer";
import ErrorBox from "@/app/components/ErrorBox";
import { mode } from "@/app/types";
import {useRouter, useSearchParams} from "next/navigation";

// Create custom theme to match the slate colors
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
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#334155', // slate-700
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          backgroundColor: '#334155', // slate-700
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: '#2563eb', // blue-600
          '&:hover': {
            backgroundColor: '#1d4ed8', // blue-700
          },
        },
        containedSecondary: {
          backgroundColor: '#7c3aed', // violet-600
          '&:hover': {
            backgroundColor: '#6d28d9', // violet-700
          },
        },
      },
    },
  },
});

const API_SERVICE = {
  domain: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',

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

interface CodeEditorProps {
  initialTemplate?: CodeTemplate;
  mode?: mode;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialTemplate,
  mode = 'create'
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFork = searchParams?.get('fork') === 'true';


  const [code, setCode] = useState(initialTemplate?.code || '');
  const [input, setInput] = useState(initialTemplate?.input || '');
  const [language, setLanguage] = useState(initialTemplate?.language || 'python');
  const [explanation, setExplanation] = useState(initialTemplate?.explanation || '');
  const [tags, setTags] = useState<Tag[]>(initialTemplate?.tags || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialTemplate?.tags.map(tag => tag.name) || []
  );
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [tagError, setTagError] = useState('')
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [emptyFields, setEmptyFields] = useState<string[]>([]);
  const [showForkDialog, setShowForkDialog] = useState(false);

  useEffect(() => {
    // Check if we're in create mode and have a fork
    if (mode === 'create') {
      const forkedData = localStorage.getItem('forkedTemplate');
      if (forkedData) {
        try {
          const forkedTemplate: CodeTemplate = JSON.parse(forkedData);
          // Pre-fill the form with forked template data
          setCode(forkedTemplate.code || '');
          setInput(forkedTemplate.input || '');
          setLanguage(forkedTemplate.language || 'python');
          setExplanation(forkedTemplate.explanation || '');
          setSelectedTags(forkedTemplate.tags.map(tag => tag.name) || []);

          // Clear the stored data
          localStorage.removeItem('forkedTemplate');
        } catch (error) {
          console.error('Error loading forked template:', error);
        }
      }
    }
  }, [mode]);

  // Handle routing
  const handleBack = () => {
    router.push('/code-templates/search');
  };

  const handleFork = () => {
    setShowForkDialog(true);
  };

  const handleForkConfirmed = () => {
    if (initialTemplate) {
      const forkedTemplate = {
        ...initialTemplate,
        title: `Fork of ${initialTemplate.title}`,
        id: undefined, // Remove the original ID
        originalId: initialTemplate.id, // Store the original template's ID
        forkedFrom: {
          id: initialTemplate.id,
          title: initialTemplate.title,
          author: initialTemplate.author
        }
      };
      localStorage.setItem('forkedTemplate', JSON.stringify(forkedTemplate));
      router.push('/code-templates/new?fork=true');
    }
    setShowForkDialog(false);
  };

  const handleShare = () => {
    // Add share functionality
    console.log('Share template');
  };

  // View mode buttons
  const ViewModeButtons = () => (
    <Box display="flex" gap={2}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<GitFork className="w-4 h-4" />}
        onClick={handleFork}
      >
        Fork
      </Button>
      <Button
        variant="outlined"
        startIcon={<Heart className="w-4 h-4" />}
      >
        Like
      </Button>
      <Button
        variant="outlined"
        startIcon={<Share2 className="w-4 h-4" />}
        onClick={handleShare}
      >
        Share
      </Button>
    </Box>
  );

  // Fetch functions
  const handleRunCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          input,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOutput(data.output || 'No output received');
    } catch (error) {

      console.error('Error running code:', error);
      setOutput(`Error running code: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

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

  // Event handlers
  const handleSearch = (query) => {
    // Handle search here
    console.log("Searching:", query);
  };

  const handleNewTag = async () => {
    const trimmedTagName = newTagName.trim().toLowerCase();

    // Validation checks
    if (!trimmedTagName) {
      setTagError('Tag name cannot be empty');
      return;
    }

    // Check for duplicates (case insensitive)
    const isDuplicate = tags.some(tag => tag.name.toLowerCase() === trimmedTagName);
    if (isDuplicate) {
      setTagError('Tag already exists');
      return;
    }
    setSelectedTags([...selectedTags, trimmedTagName]);
    setNewTagName('');
  }

  const handleNewTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNewTag();
    }
  };

  const handleSave = () => {
    const emptyFieldsList = validateFields();
    if (emptyFieldsList.length > 0) {
      setEmptyFields(emptyFieldsList);
      setOpenConfirmModal(true);
    } else {
      // Proceed with save
      handleSaveConfirmed();
    }
  };
  const handleSaveConfirmed = async () => {
    setOpenConfirmModal(false);
    // Add your save logic here
    console.log('Saving...');
  };


  // Validation checks
  const validateFields = () => {
    const empty = [];
    if (!code.trim()) empty.push('Code');
    if (!explanation.trim()) empty.push('Explanation');
    if (selectedTags.length === 0) empty.push('Tags');
    return empty;
  };


  // Fetch when component mounts
  useEffect(() => {
    fetchTags();
  }, []);

  // Component rendering
  const RunButton = () => (
    <Button
      variant="contained"
      color="primary"
      size="large"
      startIcon={<Play className="w-5 h-5" />}
      onClick={handleRunCode}
      disabled={isLoading}
      sx={{ px: 4, py: 1.5 }}
    >
      {isLoading ? 'Running...' : 'Run'}
    </Button>
  );

  const clearForkParam = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('fork');
    router.replace(url.pathname);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Navbar */}
        <AppBar position="sticky" sx={{ bgcolor: 'background.paper' }}>
          <Toolbar>
            <Tooltip title="Back to templates">
              <IconButton
                onClick={handleBack}
                size="large"
                sx={{
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)'
                  }
                }}
              >
                <ArrowLeft className="w-6 h-6" />
              </IconButton>
            </Tooltip>
            <Typography variant="h5" component="h1" sx={{ flexGrow: 0, mr: 4 }}>
              {mode === 'create' ? 'Create Template' : initialTemplate?.title}
            </Typography>
            {mode === 'view' && (
              <Box sx={{ ml: 'auto' }}>
                <ViewModeButtons />
              </Box>
            )}
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 4 }}>
          {error && <ErrorBox errorMessage={error} />}

          {/* Show fork notice if we're creating from a fork */}
          {mode === 'create' && isFork && (
            <Alert
              severity="info"
              sx={{ mb: 3 }}
              onClose={clearForkParam}
            >
              <AlertTitle>Forked Template</AlertTitle>
              You are creating a new template based on a fork. Feel free to modify it as needed.
            </Alert>
          )}
          <Box display="grid" gridTemplateColumns="3fr 1fr" gap={3}>
            {/* Left side - Code Editor and Controls */}
            <Box display="flex" flexDirection="column" gap={3}>
              {/* Top Controls */}
              <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel id="language-select-label">Language</InputLabel>
                    <Select
                      labelId="language-select-label"
                      value={language}
                      label="Language"
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <MenuItem value="python">Python</MenuItem>
                      <MenuItem value="javascript">JavaScript</MenuItem>
                      <MenuItem value="java">Java</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Paper>

              {/* Code Editor */}
              <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom>
                  Code Editor
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  label={`Write your ${language} code here`}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  minRows={15}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontFamily: 'monospace',
                    }
                  }}
                />
              </Paper>

              {/* Input/Output Section */}
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={3}>
                <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <Typography variant="h6" gutterBottom>
                    Input
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    label="Program Input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    minRows={6}
                  />
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <Typography variant="h6" gutterBottom>
                    Output
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    label="Program Output"
                    value={output}
                    disabled
                    minRows={6}
                  />
                </Paper>
              </Box>

              {/* Control Buttons */}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                {mode === 'create' && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Save className="w-4 h-4" />}
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                )}
                <RunButton />
              </Box>
            </Box>

            <Box display="flex" flexDirection="column" gap={3}>
              <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                <TagsContainer
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  tags={tags}
                  mode={mode}
                />
              </Paper>
            </Box>
          </Box>
          <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom>
                  Explanation
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  label={mode === 'view' ? "" : "Add your code explanation"}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  minRows={12}
                  disabled={mode === 'view'}
                />
              </Paper>
          </Box>

          {/* Confirmation Modal */}
          <Dialog
            open={openConfirmModal}
            onClose={() => setOpenConfirmModal(false)}
            aria-labelledby="confirm-dialog-title"
          >
            <DialogTitle id="confirm-dialog-title">
              Missing Information
            </DialogTitle>
            <DialogContent>
              <Alert severity="warning" sx={{ mb: 2 }}>
                The following fields are empty:
                <ul>
                  {emptyFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
                Do you want to continue anyway?
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setOpenConfirmModal(false)}
                color="primary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveConfirmed}
                variant="contained"
                color="primary"
              >
                Save Anyway
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
        {/* Fork Confirmation Dialog */}
          <Dialog
            open={showForkDialog}
            onClose={() => setShowForkDialog(false)}
            aria-labelledby="fork-dialog-title"
          >
            <DialogTitle id="fork-dialog-title">
              Fork Template
            </DialogTitle>
            <DialogContent>
              <Alert
                severity="info"
                sx={{
                  mt: 1,
                  '& .MuiAlert-message': {
                    width: '100%'
                  }
                }}
              >
                <AlertTitle>You are about to fork this template</AlertTitle>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  This will create a copy of <strong>{initialTemplate?.title}</strong> that you can modify.
                </Typography>
                <Typography variant="body2">
                  Original template by: <strong>{initialTemplate?.author.username}</strong>
                </Typography>
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setShowForkDialog(false)}
                color="inherit"
                sx={{ color: 'text.secondary' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleForkConfirmed}
                variant="contained"
                color="primary"
                startIcon={<GitFork className="w-4 h-4" />}
              >
                Create Fork
              </Button>
            </DialogActions>
          </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default CodeEditor;