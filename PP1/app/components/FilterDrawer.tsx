import React from 'react';
import {
  Drawer,
  IconButton,
  Box,
  Theme,
  useTheme,
  useMediaQuery,
  Button,
} from "@mui/material";
import {ChevronRight, ChevronLeft, SlidersHorizontal, X} from 'lucide-react';

interface RightDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const FilterDrawer: React.FC<RightDrawerProps> = ({
  isOpen,
  onToggle,
  children
}) => {
  const theme = useTheme();

  return (
    <>
      {/* Mobile Filter Button */}
      <Button
        onClick={onToggle}
        startIcon={<SlidersHorizontal size={18} />}
        variant="outlined"
        size="small"
        sx={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: theme.zIndex.drawer - 1,
          display: { xs: 'flex', sm: 'none' },
          backgroundColor: 'background.paper',
          borderColor: 'divider',
          color: 'text.primary',
          '&:hover': {
            backgroundColor: 'background.default',
            borderColor: 'primary.main',
          },
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        Filters
      </Button>

      {/* Mobile Overlay */}
      <Box
        onClick={onToggle}
        sx={{
          position: 'fixed',
          inset: 0,
          bgcolor: 'black',
          opacity: isOpen ? 0.5 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: theme.transitions.create(['opacity', 'visibility'], {
            duration: theme.transitions.duration.standard,
          }),
          zIndex: theme.zIndex.drawer - 1,
          display: { sm: 'none' },
        }}
      />

      {/* Right Sidebar Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={isOpen}
        onClose={onToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: {
              xs: '100%',    // Full width on mobile
              sm: '400px',   // Fixed width on tablets
              md: '340px',   // Slightly narrower on desktop
            },
            borderLeft: '1px solid',
            borderColor: 'divider',
            marginTop: { xs: 0, sm: '64px' },
            height: { xs: '100%', sm: 'calc(100% - 64px)' },
            boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.2)',
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
          },
          '& .MuiBackdrop-root': {
            marginTop: { xs: 0, sm: '64px' },
          },
        }}
        ModalProps={{
          keepMounted: true
        }}
      >
        <Box sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: { xs: 'flex', sm: 'none' }
        }}>
          <h2 className="text-lg font-semibold">Filters</h2>
          <IconButton onClick={onToggle} size="small">
            <X size={20} />
          </IconButton>
        </Box>
        <Box
          sx={{
            p: 2,
            height: '100%',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </Box>
      </Drawer>

      {/* Desktop Toggle Button - Hidden on mobile */}
      <IconButton
        onClick={onToggle}
        sx={{
          position: 'fixed',
          right: isOpen ? { sm: '400px', md: '340px' } : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: (theme: Theme) => theme.zIndex.drawer + 2,
          bgcolor: 'background.paper',
          '&:hover': {
            bgcolor: 'background.default',
          },
          transition: theme.transitions.create(['right'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
          display: { xs: 'none', sm: 'flex' },
        }}
      >
        {isOpen ? <ChevronRight /> : <ChevronLeft />}
      </IconButton>
    </>
  );
};

export default FilterDrawer;