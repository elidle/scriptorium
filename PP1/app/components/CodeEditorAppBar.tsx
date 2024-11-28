import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  TextField, Dialog, DialogTitle, DialogContent, Alert, AlertTitle, DialogActions, CircularProgress,
} from "@mui/material";
import { ArrowLeft, Edit, GitFork, Share2, Trash2, MoreVertical } from 'lucide-react';
import ThemeToggle from "@/app/components/ThemeToggle";
import {CodeTemplate, ForkLabelProps, mode, User} from "@/app/types";
import {AppRouterInstance} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useState } from 'react';

interface AppBarProps {
  mode: mode;
  title: string;
  initialTemplate?: CodeTemplate;
  handleBack: () => void;
  handleTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  handleEdit: () => void;
  handleDelete: () => void;
  handleFork: () => void;
  handleShare: () => void;
  user: User | null;
  ForkLabel?: React.FC<ForkLabelProps>;
  showLoginDialog: boolean;
  setShowLoginDialog: (show: boolean) => void;
  actionAfterLogin: 'save' | 'fork' | null;
  showDeleteDialog: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  handleDeleteConfirmed: () => void;
  router: AppRouterInstance;
  showForkDialog: boolean;
  setShowForkDialog: (show: boolean) => void;
  handleForkConfirmed: () => void;
}

const CodeEditorAppBar: React.FC<AppBarProps> = ({
  mode,
  title,
  initialTemplate,
  handleBack,
  handleTitleChange,
  isEditing,
  isSaving,
  handleEdit,
  handleDelete,
  handleFork,
  handleShare,
  user,
  ForkLabel,
  showLoginDialog,
  setShowLoginDialog,
  actionAfterLogin,
  showDeleteDialog,
  setShowDeleteDialog,
  isDeleting,
  handleDeleteConfirmed,
  router,
  showForkDialog,
  setShowForkDialog,
  handleForkConfirmed,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ViewModeButtons component integrated with the parent's functions
  const ViewModeButtons = () => {
    const canEdit = user?.id === initialTemplate?.author.id;
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
    };

    if (isMobile) {
      const menuItems = [
      ...(canEdit ? [
        {
          icon: <Edit className="w-4 h-4" />,
          label: 'Edit',
          onClick: () => { handleEdit(); handleMenuClose(); },
          disabled: isSaving || isEditing
        },
        {
          icon: <Trash2 className="w-4 h-4" />,
          label: 'Delete',
          onClick: () => { handleDelete(); handleMenuClose(); },
          disabled: isSaving || isEditing || isDeleting
        }
      ] : []),
      {
        icon: <GitFork className="w-4 h-4" />,
        label: user ? 'Fork' : 'Sign in to Fork',
        onClick: () => { handleFork(); handleMenuClose(); }
      },
      {
        icon: <Share2 className="w-4 h-4" />,
        label: 'Share',
        onClick: () => { handleShare(); handleMenuClose(); }
      }
    ];
      return (
        <>
          <IconButton
            onClick={handleMenuClick}
            size="small"
            className="text-slate-300"
          >
            <MoreVertical className="w-5 h-5" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                bgcolor: 'background.paper',
                borderColor: 'divider',
              }
            }}
          >
            {menuItems.map((item, index) => (
              <MenuItem
                key={index}
                onClick={item.onClick}
                disabled={item.disabled}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      );
    }

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
            router.push('/login');
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
          sx={{ color: 'text.secondary' }}
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
  const ForkConfirmationDialog = () => (
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
  )

  return (
    <>
      <AppBar position="sticky" sx={{ bgcolor: 'background.paper' }}>
        <Toolbar
          sx={{
            flexWrap: 'wrap',
            minHeight: { xs: '56px', sm: '64px' },
            px: { xs: 1, sm: 2 },
            gap: 1
          }}
        >
          {/* Back Button */}
          <Tooltip title="Back to templates">
            <IconButton
              onClick={handleBack}
              size={isMobile ? "small" : "medium"}
              sx={{
                mr: 1,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              <ArrowLeft className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
            </IconButton>
          </Tooltip>

          {/* Title Section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
              flex: 1,
              minWidth: 0,
            }}
          >
            {mode === 'view' && isEditing ? (
              <TextField
                value={title}
                onChange={handleTitleChange}
                variant="outlined"
                size="small"
                sx={{
                  minWidth: { xs: '200px', sm: '300px' }
                }}
              />
            ) : (
              <Typography
                variant="h6"
                component="h1"
                sx={{
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: { xs: '200px', sm: '300px', md: 'none' }
                }}
              >
                {mode === 'view' ? title : 'Create new Template'}
              </Typography>
            )}
            {mode === 'view' && initialTemplate?.isForked && ForkLabel && (
              <Box sx={{
                display: { xs: 'none', md: 'block' }
              }}>
                <ForkLabel parentTemplate={initialTemplate.parentFork} />
              </Box>
            )}
            <ThemeToggle />
          </Box>

          {/* Action Buttons */}
          {mode === 'view' && (
            <Box sx={{ ml: 'auto' }}>
              <ViewModeButtons />
            </Box>
          )}
        </Toolbar>

        {/* Mobile Fork Label - Show below toolbar */}
        {mode === 'view' && initialTemplate?.isForked && ForkLabel && isMobile && (
          <Box sx={{
            px: 2,
            py: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: { xs: 'block', md: 'none' }
          }}>
            <ForkLabel parentTemplate={initialTemplate.parentFork} />
          </Box>
        )}
      </AppBar>
      <LoginPromptDialog />
      <DeleteConfirmationDialog />
      <ForkConfirmationDialog />
  </>
  );
};

export default CodeEditorAppBar;