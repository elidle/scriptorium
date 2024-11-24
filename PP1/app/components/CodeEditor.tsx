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
  Snackbar, useMediaQuery, SpeedDial, SpeedDialIcon, SpeedDialAction, alpha
} from '@mui/material';
import { useAuth } from "@/app/contexts/AuthContext";
import {ArrowLeft, Edit, GitFork, Heart, Play, Plus, Save, Share2, Trash2, X, XCircle} from 'lucide-react';
import SearchBar from '@/app/components/SearchBar';
import {CodeTemplate, SearchParams, Tag} from '@/app/types'
import TagsContainer from "@/app/components/TagsContainer";
import ErrorBox from "@/app/components/ErrorBox";
import { mode } from "@/app/types";
import {useRouter, useSearchParams} from "next/navigation";
import {fetchAuth} from "@/app/utils/auth";
import {CodeEditorWithCodeMirror} from "@/app/components/CodeEditorWithCodeMirror";
import InputOutputSection from "@/app/components/InputOutputSection";
import {useToast} from "@/app/contexts/ToastContext";
import CodeEditorAppBar from "@/app/components/CodeEditorAppBar";
import {useTheme} from "@/app/contexts/ThemeContext";

// Mobile-friendly control panel
const ControlPanel = ({
  language,
  setLanguage,
  mode,
  SaveButton,
  RunButton,
  handleSaveEdit,
  handleCancelEdit,
  isEditing,
  isSaving
}) => {
  const getSpeedDialActions = React.useMemo(() => {
    return [
      // Run action is always present
      {
        icon: <Play className="w-5 h-5" />,
        tooltipTitle: "Run Code",
        onClick: (e) => RunButton().props.onClick(e)
      },
      // Conditionally add save action for create mode
      ...(mode === 'create' ? [{
        icon: <Save className="w-5 h-5" />,
        tooltipTitle: "Save",
        onClick: () => SaveButton().props.onClick()
      }] : []),
      // Conditionally add save and cancel actions for edit mode
      ...(mode === 'view' && isEditing ? [
        {
          icon: <Save className="w-5 h-5" />,
          tooltipTitle: "Save Changes",
          onClick: handleSaveEdit
        },
        {
          icon: <XCircle className="w-5 h-5" />,
          tooltipTitle: "Cancel",
          onClick: handleCancelEdit
        }
      ] : [])
    ];
  }, [mode, isEditing, RunButton, SaveButton, handleSaveEdit, handleCancelEdit]);

  const { theme, isDarkMode} = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return (
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
        <SpeedDial
          ariaLabel="Code controls"
          icon={<SpeedDialIcon />}
          direction="up"
          sx={{
            '& .MuiSpeedDial-fab': {
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              }
            }
          }}
        >
          {getSpeedDialActions.map((action, index) => (
            <SpeedDialAction
              key={`${action.tooltipTitle}-${index}`} // Better key for reconciliation
              icon={action.icon}
              tooltipTitle={action.tooltipTitle}
              onClick={action.onClick}
              sx={{
                // Optional: Add visual feedback for disabled state
                ...(isSaving && {
                  opacity: 0.5,
                  pointerEvents: 'none'
                })
              }}
            />
          ))}
        </SpeedDial>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        flexWrap="wrap"
      >
        <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
          <InputLabel id="language-select-label">Language</InputLabel>
          <Select
            variant='outlined'
            labelId="language-select-label"
            value={language}
            label="Language"
            onChange={(e) => setLanguage(e.target.value)}
          >
            <MenuItem value="python">Python</MenuItem>
            <MenuItem value="javascript">JavaScript</MenuItem>
            <MenuItem value="java">Java</MenuItem>
            <MenuItem value="c">C</MenuItem>
            <MenuItem value="cpp">C++</MenuItem>
            <MenuItem value="csharp">C#</MenuItem>
            <MenuItem value="typescript">TypeScript</MenuItem>
            <MenuItem value="r">R</MenuItem>
          </Select>
        </FormControl>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-end' },
          }}
        >
          {mode === 'create' && <SaveButton />}
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
  );
};

const ResponsiveContainer = ({ children }) => (
  <Container
    maxWidth="xl"
    sx={{
      py: { xs: 2, sm: 4 },
      px: { xs: 1, sm: 2, md: 4 },
      mb: { xs: '80px', sm: 0 }, // Add bottom margin on mobile for SpeedDial
    }}
  >
    {children}
  </Container>
);

const ResponsiveGrid = ({ leftContent, rightContent }) => (
  <Box
    sx={{
      display: "grid",
      gap: { xs: 2, sm: 3 },
      gridTemplateColumns: {
        xs: '1fr',
        md: '3fr 1fr'
      },
      gridTemplateAreas: {
        xs: `
          "right"
          "left"
        `,
        md: `"left right"`
      },
      '& > *': {
        minWidth: 0
      }
    }}
  >
    <Box sx={{ gridArea: { xs: 'left', md: 'left' } }}>
      {leftContent}
    </Box>
    <Box sx={{ gridArea: { xs: 'right', md: 'right' } }}>
      {rightContent}
    </Box>
  </Box>
);

const ExplanationSection = ({ explanation, setExplanation, mode, isEditing }) => (
  <Paper
    sx={{
      p: { xs: 1, sm: 2 },
      bgcolor: 'background.paper',
      mt: { xs: 2, sm: 3 }
    }}
  >
    <Typography
      variant="h6"
      gutterBottom
      sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
    >
      Explanation
    </Typography>
    <TextField
      fullWidth
      multiline
      label={mode === 'view' && !isEditing ? "" : "Add your code explanation"}
      value={explanation}
      onChange={(e) => setExplanation(e.target.value)}
      minRows={6}
      maxRows={12}
      disabled={mode === 'view' && !isEditing}
      sx={{
        '& .MuiInputBase-root': {
          fontSize: { xs: '0.875rem', sm: '1rem' }
        }
      }}
    />
  </Paper>
);

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
  const { showToast } = useToast();
  const { theme, isDarkMode } = useTheme();

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

  const languages = ['python', 'javascript', 'java', 'c', 'cpp', 'csharp', 'typescript', 'r'];

  useEffect(() => {
    // Check if we're in create mode and have a fork
    if (mode === 'create') {
      const forkedData = localStorage.getItem('forkedTemplate');
      if (forkedData) {
        try {
          const forkedTemplate: CodeTemplate = JSON.parse(forkedData);
          // Pre-fill the form with forked template data
          setTitle(forkedTemplate.title || '');
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
    languages.forEach(lang => localStorage.removeItem(`${lang}Code`));
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
      showToast({
        message: 'Link copied to clipboard!',
        type: 'success'
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast({
        message: 'Failed to copy link to clipboard',
        type: 'error'
      });
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
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  }, []);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
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
        title: title.trim(),
        code: code.trim(),
        language,
        explanation: explanation.trim(),
        tags: [...selectedTags, isFork ? 'forked' : ''].filter(Boolean), // Add Fork tag if it's a fork
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

  const ForkLabel = ({ parentTemplate }) => {

    const isParentDeleted = !(parentTemplate ?? 0); // Add this flag to your parentTemplate type/data

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2 }}>
        <Chip
          icon={<GitFork className="w-3 h-3" />}
          label={
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Forked from{' '}
              {isParentDeleted ? (
                <span style={{ color: 'rgb(239, 68, 68)', fontStyle: 'italic' }}>
                  (deleted template)
                </span>
              ) : (
                <span
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => router.push(`/code-templates/${parentTemplate.author.username}/${parentTemplate.id}`)}
                >
                  {parentTemplate.title}
                </span>
              )}
            </Typography>
          }
          sx={{
            backgroundColor: isParentDeleted
              ? alpha(theme.palette.error.main, 0.1) // red background for deleted parent
              : alpha(theme.palette.primary.main, 0.1), // original blue background
            borderColor: isParentDeleted
              ? theme.palette.error.main // red border for deleted parent
              : theme.palette.primary.main, // original blue border
            color: isParentDeleted
              ? theme.palette.error.light // lighter red text for deleted parent
              : theme.palette.primary.light, // original blue text
            '& .MuiChip-icon': {
              color: isParentDeleted
                ? theme.palette.error.light // lighter red icon for deleted parent
                : theme.palette.primary.light, // original blue icon
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navbar */}
      <CodeEditorAppBar
        mode={mode}
        title={title}
        initialTemplate={initialTemplate}
        handleBack={handleBack}
        handleTitleChange={handleTitleChange}
        isEditing={isEditing}
        isSaving={isSaving}
        isDeleting={isDeleting}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleFork={handleFork}
        handleShare={handleShare}
        user={user}
        ForkLabel={ForkLabel}
        showLoginDialog={showLoginDialog}
        setShowLoginDialog={setShowLoginDialog}
        actionAfterLogin={actionAfterLogin}
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        handleDeleteConfirmed={handleDeleteConfirmed}
        router={router}
        showForkDialog={showForkDialog}
        setShowForkDialog={setShowForkDialog}
        handleForkConfirmed={handleForkConfirmed}
      />

      <ResponsiveContainer>
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
                  backgroundColor: theme.palette.background.paper,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  },
                  '& fieldset': {
                    borderColor: theme.palette.grey[500]
,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.grey[400],
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
        <ResponsiveGrid
          leftContent={
            <Box display="flex" flexDirection="column" gap={{ xs: 2, sm: 3 }}>
              <ControlPanel
                language={language}
                setLanguage={setLanguage}
                mode={mode}
                SaveButton={SaveButton}
                RunButton={RunButton}
                handleSaveEdit={handleSaveEdit}
                handleCancelEdit={handleCancelEdit}
                isEditing={isEditing}
                isSaving={isSaving}
              />

              <CodeEditorWithCodeMirror
                code={code}
                onChange={handleCodeChange}
                language={language}
              />

              <InputOutputSection
                input={input}
                setInput={setInput}
                output={output}
              />
            </Box>
          }
          rightContent={
            <Paper sx={{ p: { xs: 1, sm: 2 } }}>
              <TagsContainer
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                tags={tags}
                mode={isEditing ? 'create' : mode}
              />
            </Paper>
          }
        />

        <ExplanationSection
          explanation={explanation}
          setExplanation={setExplanation}
          mode={mode}
          isEditing={isEditing}
        />
      </ResponsiveContainer>
    </Box>
  );
};

export default CodeEditor;