import { Modal, Box, Typography, Button } from "@mui/material";

interface ConfirmationProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "error" | "primary" | "warning";
}

export default function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  confirmColor = "error"
}: ConfirmationProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          p: 4,
          boxShadow: 24,
          color: "text.primary",
        }}
      >
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            color: `${confirmColor}.main`,
            fontWeight: 600
          }}
        >
          {title}
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 2 }}>
          {message}
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 1, 
          mt: 4 
        }}>
          <Button
            variant="contained"
            color={confirmColor}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'text.secondary',
                bgcolor: 'action.hover'
              }
            }}
          >
            {cancelText}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}