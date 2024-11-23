import { Menu, MenuItem, ListItemIcon, ListItemText, ThemeProvider } from "@mui/material";
import { LucideIcon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

interface SortOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface SortMenuProps {
  sortBy: string;
  anchorEl: HTMLElement | null;
  onClose: (value?: string) => void;
  sortOptions: SortOption[];
}

export default function SortMenu({ sortBy, anchorEl, onClose, sortOptions }: SortMenuProps) {
  const { theme, isDarkMode } = useTheme();

  return (
    <ThemeProvider theme={theme}>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => onClose()}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: 1,
            borderColor: 'divider',
            '& .MuiMenuItem-root': {
              color: 'text.primary',
              '&:hover': {
                bgcolor: isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(241, 245, 249, 0.8)',
              },
              '&.Mui-selected': {
                bgcolor: isDarkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(241, 245, 249, 0.5)',
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(241, 245, 249, 0.8)',
                },
              },
            },
          },
        }}
      >
        {sortOptions.map((option) => (
          <MenuItem 
            key={option.value}
            onClick={() => onClose(option.value)}
            selected={sortBy === option.value}
            sx={{
              '&:hover': {
                '& .MuiListItemIcon-root': {
                  color: 'primary.main',
                },
                '& .MuiListItemText-root': {
                  color: 'primary.main',
                },
              },
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: 'text.primary',
                minWidth: '32px',
              }}
            >
              <option.icon size={20} />
            </ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </ThemeProvider>
  );
}