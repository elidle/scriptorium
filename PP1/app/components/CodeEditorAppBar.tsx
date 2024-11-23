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
  TextField,
} from "@mui/material";
import { ArrowLeft, Edit, GitFork, Share2, Trash2, MoreVertical } from 'lucide-react';
import Link from 'next/link';

interface AppBarProps {
  mode: 'view' | 'create';
  title: string;
  initialTemplate?: any;
  handleBack: () => void;
  handleTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  handleEdit: () => void;
  handleDelete: () => void;
  handleFork: () => void;
  handleShare: () => void;
  user: any;
  ForkLabel?: React.ComponentType<any>;
}

const CodeEditorAppBar: React.FC<AppBarProps> = ({
  mode,
  title,
  initialTemplate,
  handleBack,
  handleTitleChange,
  isEditing,
  isSaving,
  isDeleting,
  handleEdit,
  handleDelete,
  handleFork,
  handleShare,
  user,
  ForkLabel
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ViewModeButtons component integrated with the parent's functions
  const ViewModeButtons = () => {
    const canEdit = user?.id === initialTemplate?.author.id;
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleMenuClick = (event) => {
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

  return (
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
                minWidth: { xs: '200px', sm: '300px' },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgb(30, 41, 59)',
                }
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
  );
};

export default CodeEditorAppBar;