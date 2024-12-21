import { Box, Button, Modal, TextField, Typography } from "@mui/material";
import React, { memo } from "react";

const MemoizedTextField = memo(({ 
  value, 
  onChange, 
  onKeyDown,
  inputLabel,
  inputRows
}: { 
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  inputLabel: string;
  inputRows: number;
}) => (
  <TextField
    fullWidth
    label={inputLabel}
    variant="outlined"
    multiline
    rows={inputRows}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onKeyDown={onKeyDown}
    sx={{
      mb: 2,
      '& .MuiOutlinedInput-root': {
        bgcolor: 'background.default',
        '& fieldset': {
          borderColor: 'divider',
        },
        '&:hover fieldset': {
          borderColor: 'text.secondary',
        },
        '&.Mui-focused fieldset': {
          borderColor: 'primary.main',
        },
      },
      '& .MuiInputLabel-root': {
        opacity: 0.7,
      },
    }}
  />
));

MemoizedTextField.displayName = 'MemoizedTextField';

interface InputModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  value: string;
  onChange: (value: string) => void;
  inputLabel?: string;
  inputRows?: number;
  submitLabel?: string;
  cancelLabel?: string;
}

export default function InputModal({
  open,
  onClose,
  onSubmit,
  title,
  value,
  onChange,
  inputLabel = "Input",
  inputRows = 4,
  submitLabel = "Submit",
  cancelLabel = "Cancel"
}: InputModalProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      onSubmit(e);
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Modal 
      open={open} 
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }
      }}
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        boxShadow: 24,
        p: 4,
      }}>
        <Typography variant="h4" sx={{ color: 'primary.main', mb: 2 }}>
          {title}
        </Typography>

        <MemoizedTextField
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          inputLabel={inputLabel}
          inputRows={inputRows}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="contained"
            onClick={onSubmit}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            {submitLabel}
          </Button>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                color: 'primary.dark',
              },
            }}
          >
            {cancelLabel}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}