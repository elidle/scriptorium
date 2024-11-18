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
  DialogActions, IconButton, Tooltip, AlertTitle, Chip,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { useAuth } from "@/app/contexts/AuthContext";
import {ArrowLeft, Edit, GitFork, Heart, Play, Plus, Save, Share2, Trash2, X} from 'lucide-react';
import SearchBar from '@/app/components/SearchBar';
import {CodeTemplate, SearchParams, Tag} from '@/app/types'
import TagsContainer from "@/app/components/TagsContainer";
import ErrorBox from "@/app/components/ErrorBox";
import { mode } from "@/app/types";
import {useRouter, useSearchParams} from "next/navigation";
import {fetchAuth} from "@/app/utils/auth";
import {CodeEditorWithHighlight} from "@/app/components/CodeEditorWithHighlight";
import InputOutputSection from "@/app/components/InputOutputSection";

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
  const { user, accessToken, setAccessToken } = useAuth();

  const searchParams = useSearchParams();
  const isFork = searchParams?.get('fork') === 'true';

  // State variables
  const [title, setTitle] = useState(initialTemplate?.title || '');
  const [code, setCode] = useState(initialTemplate?.code || '');
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState(initialTemplate?.language || 'python');
  const [explanation, setExplanation] = useState(initialTemplate?.explanation || '');
  const [tags, setTags] = useState<Tag[]>(initialTemplate?.tags || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialTemplate?.tags.map(tag => tag.name) || []
  );
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [emptyFields, setEmptyFields] = useState<string[]>([]);
  const [showForkDialog, setShowForkDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [actionAfterLogin, setActionAfterLogin] = useState<'save' | 'fork' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShareNotification, setShowShareNotification] = useState(false);

  useEffect(() => {
    // Check if we're in create mode and have a fork
    if (mode === 'create') {
      const forkedData = localStorage.getItem('forkedTemplate');
      if (forkedData) {
        try {
          const forkedTemplate: CodeTemplate = JSON.parse(forkedData);
          // Pre-fill the form with forked template data
          setCode(forkedTemplate.code || '');
          setLanguage(forkedTemplate.language || 'python');
          setExplanation(forkedTemplate.explanation || '');
          setSelectedTags(forkedTemplate.tags.map(tag => tag.name) || []);

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
    if (!user) {
      setActionAfterLogin('fork');
      setShowLoginDialog(true);
      return;
    }
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

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowShareNotification(true);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError('Failed to copy link to clipboard');
    }
  };

  // View mode buttons
  const ViewModeButtons = () => {
    const canEdit = user?.id === initialTemplate?.author.id;

    return (
      <Box display="flex" gap={2}>
        {canEdit && (
          <>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Edit className="w-4 h-4" />}
              onClick={handleEdit}
              disabled={isSaving || isEditing}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Trash2 className="w-4 h-4" />}
              onClick={handleDelete}
              disabled={isSaving || isEditing || isDeleting}
            >
              Delete
            </Button>
          </>
        )}
        <Button
          variant="contained"
          color="primary"
          startIcon={<GitFork className="w-4 h-4" />}
          onClick={handleFork}
        >
          {user ? 'Fork' : 'Sign in to Fork'}
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
  };

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


  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  }, []);

  const handleSaveConfirmed = async () => {
    setOpenConfirmModal(false);
    setIsSaving(true);
    setError('');

    try {
      if (!title.trim()) {
        throw new Error('Title is required');
      }

      const forkedData = localStorage.getItem('forkedTemplate');
      const forkedTemplate = forkedData ? JSON.parse(forkedData) : null;

      const templateData = {
        title: isFork ? `Fork of ${initialTemplate?.title}` : title.trim(),
        code: code.trim(),
        language,
        explanation: explanation.trim(),
        tags: [...selectedTags, isFork ? 'Fork' : ''].filter(Boolean), // Add Fork tag if it's a fork
        authorId: user?.id,
        isForked: isFork,
        ...(isFork && { parentTemplateId: forkedTemplate?.forkedFrom?.id })
      };

      const url = 'http://localhost:3000/api/code-templates';
      const options: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': `Bearer ${accessToken}`
        },
        body: JSON.stringify(templateData),
      };

      const response = await fetchAuth({
        url,
        options,
        user,
        setAccessToken,
        router
      });

      if (!response) return;

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save template');
      }

      // Clear fork parameters and local storage
      if (isFork) {
        localStorage.removeItem('forkedTemplate');
        clearForkParam();
      }

      // Redirect to the new template view
      router.push(`/code-templates/${user.username}/${data.id}`);
    } catch (err) {
      console.error('Error saving template:', err);
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (!user) {
      setActionAfterLogin('save');
      setShowLoginDialog(true);
      return;
    }

    const emptyFieldsList = validateFields();
    if (emptyFieldsList.length > 0) {
      setEmptyFields(emptyFieldsList);
      setOpenConfirmModal(true);
    } else {
      handleSaveConfirmed();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    setError('');

    try {
      const templateData = {
        title: title.trim(),
        code: code.trim(),
        language,
        explanation: explanation.trim(),
        tags: selectedTags,
      };

      const url = `http://localhost:3000/api/code-templates/${initialTemplate?.id}`;
      const options: RequestInit = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'access-token': `Bearer ${accessToken}`
        },
        body: JSON.stringify(templateData),
      };

      const response = await fetchAuth({
        url,
        options,
        user,
        setAccessToken,
        router
      });

      if (!response) return;

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update template');
      }

      // Exit edit mode and refresh the page to show updated content
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error('Error updating template:', err);
      setError(err instanceof Error ? err.message : 'Failed to update template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset all fields to initial values
    setTitle(initialTemplate?.title || '');
    setCode(initialTemplate?.code || '');
    setLanguage(initialTemplate?.language || 'python');
    setExplanation(initialTemplate?.explanation || '');
    setSelectedTags(initialTemplate?.tags.map(tag => tag.name) || []);
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirmed = async () => {
    setIsDeleting(true);
    setError('');

    try {
      const url = `http://localhost:3000/api/code-templates/${initialTemplate?.id}`;
      const options: RequestInit = {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'access-token': `Bearer ${accessToken}`
        }
      };

      const response = await fetchAuth({
        url,
        options,
        user,
        setAccessToken,
        router
      });

      if (!response) return;

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete template');
      }

      // Redirect to templates list after successful deletion
      router.push('/code-templates/search');
    } catch (err) {
      console.error('Error deleting template:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };


  // Validation checks
  const validateFields = () => {
    const empty = [];
    if (!title.trim()) empty.push('Title');
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

  const SaveButton = () => (
    <Button
      variant="contained"
      color="primary"
      startIcon={<Save className="w-4 h-4" />}
      onClick={handleSave}
      disabled={isSaving}
    >
      {!user
        ? 'Sign in to Save'
        : isSaving
          ? 'Saving...'
          : 'Save'}
    </Button>
  );
  const ShareNotification = ({ open, onClose }) => (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity="success"
        sx={{
          width: '100%',
          alignItems: 'center',
          bgcolor: 'rgb(22 163 74)', // green-600
          color: 'white',
          '& .MuiAlert-icon': {
            color: 'white'
          }
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </IconButton>
        }
      >
        Link copied to clipboard!
      </Alert>
    </Snackbar>
  );

  const LoginPromptDialog = () => (

    <Dialog
      open={showLoginDialog}
      onClose={() => setShowLoginDialog(false)}
      aria-labelledby="login-dialog-title"
    >
      <DialogTitle id="login-dialog-title">
        Login Required
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
          <AlertTitle>Please log in to continue</AlertTitle>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You need to be logged in to {actionAfterLogin === 'save' ? 'save templates' : 'fork templates'}.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => setShowLoginDialog(false)}
          color="inherit"
          sx={{ color: 'text.secondary' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setShowLoginDialog(false);
            router.push('/auth/login');
          }}
        >
          Log In
        </Button>
      </DialogActions>
    </Dialog>
  );

  const DeleteConfirmationDialog = () => (
    <Dialog
      open={showDeleteDialog}
      onClose={() => !isDeleting && setShowDeleteDialog(false)}
      aria-labelledby="delete-dialog-title"
    >
      <DialogTitle id="delete-dialog-title">
        Delete Template
      </DialogTitle>
      <DialogContent>
        <Alert
          severity="warning"
          sx={{
            mt: 1,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <AlertTitle>Are you sure you want to delete this template?</AlertTitle>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You are about to delete <strong>{initialTemplate?.title}</strong>. This action cannot be undone.
          </Typography>
          {initialTemplate?.isForked && (
            <Typography variant="body2" color="text.secondary">
              Note: This will only delete your fork, not the original template.
            </Typography>
          )}
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => setShowDeleteDialog(false)}
          color="inherit"
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDeleteConfirmed}
          variant="contained"
          color="error"
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} /> : <Trash2 className="w-4 h-4" />}
        >
          {isDeleting ? 'Deleting...' : 'Delete Template'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const ForkLabel = ({ parentTemplate }) => {
    if (!parentTemplate) return null;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2 }}>
        <Chip
          icon={<GitFork className="w-3 h-3" />}
          label={
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Forked from{' '}
              <span
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => router.push(`/code-templates/${parentTemplate.author.username}/${parentTemplate.id}`)}
              >
                {parentTemplate.title}
              </span>
            </Typography>
          }
          sx={{
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            borderColor: 'rgb(37, 99, 235)',
            color: 'rgb(147, 197, 253)',
            '& .MuiChip-icon': {
              color: 'rgb(147, 197, 253)',
            },
            height: 'auto',
            '& .MuiChip-label': {
              display: 'block',
              padding: '8px 12px',
            }
          }}
          variant="outlined"
        />
      </Box>
    );
  };



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
          <Toolbar sx={{ flexWrap: 'wrap' }}>
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
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
              flex: 1,
              mr: 2
            }}>
              {mode === 'view' && isEditing ? (
                <TextField
                  value={title}
                  onChange={handleTitleChange}
                  variant="outlined"
                  size="small"
                  sx={{
                    minWidth: '300px',
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgb(30, 41, 59)',
                    }
                  }}
                />
              ) : (
                <Typography variant="h5" component="h1">
                  {mode === 'view' ? title : 'Create new Template'}
                </Typography>
              )}
              {mode === 'view' && initialTemplate?.isForked && (
                <ForkLabel parentTemplate={initialTemplate.parentFork} />
              )}
            </Box>
            {mode === 'view' && (
              <Box sx={{ ml: 'auto' }}>
                <ViewModeButtons />
              </Box>
            )}
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 4 }}>
          {error && <ErrorBox errorMessage={error} />}

          {mode === 'create' && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
              <TextField
                fullWidth
                label="Template Title"
                value={title}
                onChange={handleTitleChange}
                disabled={isSaving}
                required
                error={!title.trim() && emptyFields.includes('Title')}
                helperText={!title.trim() && emptyFields.includes('Title') ? 'Title is required' : ''}
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
            </Paper>
          )}
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
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={2}
                >
                  {/* Left side - Language Selector */}
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

                  {/* Right side - Control Buttons */}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {mode === 'create' && (
                      <SaveButton />
                    )}
                    {mode === 'view' && isEditing && (
                      <>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleSaveEdit}
                          disabled={isSaving}
                          startIcon={<Save className="w-4 h-4" />}
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    <RunButton />
                  </Box>
                </Box>
              </Paper>

              {/* Code Editor */}
              <Paper sx={{ p: 2, bgcolor: 'background.paper', maxWidth: '100%', overflow: 'hidden' }}>
                <CodeEditorWithHighlight
                  code={code}
                  language={language}
                  onChange={setCode}
                />
              </Paper>

              {/* Input/Output Section */}
              <InputOutputSection input={input} setInput={setInput} output={output} />

            </Box>

            <Box display="flex" flexDirection="column" gap={3}>
              <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                <TagsContainer
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  tags={tags}
                  mode={isEditing ? 'create' : mode}
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
                  label={mode === 'view' && !isEditing ? "" : "Add your code explanation"}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  minRows={12}
                  disabled={mode === 'view' && !isEditing}
                />
              </Paper>
          </Box>
        </Container>

        {/* Dialogs */}
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
          <LoginPromptDialog />
          <DeleteConfirmationDialog />
      </Box>
      <ShareNotification
        open={showShareNotification}
        onClose={() => setShowShareNotification(false)}
      />
    </ThemeProvider>
  );
};

export default CodeEditor;