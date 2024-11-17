import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { LucideIcon } from "lucide-react";

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
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={() => onClose()}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        sx: {
          backgroundColor: 'rgb(30, 41, 59)',
          color: 'rgb(226, 232, 240)',
          '& .MuiMenuItem-root:hover': {
            backgroundColor: 'rgb(51, 65, 85)',
          },
        },
      }}
    >
      {sortOptions.map((option) => (
        <MenuItem 
          key={option.value}
          onClick={() => onClose(option.value)}
          selected={sortBy === option.value}
          className="!text-slate-300 hover:text-blue-400"
        >
          <ListItemIcon className="!text-slate-300">
            <option.icon size={20} />
          </ListItemIcon>
          <ListItemText>{option.label}</ListItemText>
        </MenuItem>
      ))}
    </Menu>
  );
}