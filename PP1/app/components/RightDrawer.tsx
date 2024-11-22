import React from 'react';
import {
  Drawer,
  IconButton,
  Box,
  Theme,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface RightDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const RightDrawer: React.FC<RightDrawerProps> = ({
  isOpen,
  onToggle,
  children
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
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

      {/* Toggle Button - Hidden on mobile */}
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

export default RightDrawer;