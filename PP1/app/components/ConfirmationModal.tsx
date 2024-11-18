import { Modal, Box, Typography, Button } from "@mui/material";

interface ConfirmationProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
}

export default function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  confirmColor = "!bg-red-600 hover:!bg-red-700"
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
          bgcolor: "rgb(15, 23, 42)",
          border: "1px solid rgb(51, 65, 85)",
          borderRadius: "8px",
          p: 4,
          boxShadow: 24,
          color: "rgb(203, 213, 225)",
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ color: "rgb(239, 68, 68)" }}>
          {title}
        </Typography>
        <Typography className="text-slate-300 mb-4">
          {message}
        </Typography>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="contained"
            className={`${confirmColor} text-white`}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
          <Button
            variant="outlined"
            className="border-slate-600 text-slate-300 hover:border-slate-500"
            onClick={onClose}
          >
            {cancelText}
          </Button>
        </div>
      </Box>
    </Modal>
  );
}