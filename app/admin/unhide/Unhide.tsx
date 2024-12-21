"use client";
import {
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box
} from "@mui/material";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/contexts/ToastContext";
import { fetchAuth } from "@/app/utils/auth";

import BaseLayout from "@/app/components/BaseLayout";
import ConfirmationModal from "@/app/components/ConfirmationModal";

type ItemType = "post" | "comment";

export default function Unhide() {
  const router = useRouter();
  const [itemType, setItemType] = useState<ItemType>("post");
  const [itemId, setItemId] = useState<string>("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const { user, accessToken, setAccessToken } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemId.trim()) {
      showToast({
        message: 'Please enter an ID',
        type: 'error'
      });
      return;
    }

    if (isNaN(Number(itemId))) {
      showToast({
        message: 'ID must be a number',
        type: 'error'
      });
      return;
    }

    setConfirmModalOpen(true);
  };

  const handleUnhide = async () => {
    if (!user || !accessToken) return;

    try {
      const url = `/api/admin/hide/${itemType}`;
      const options: RequestInit = {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'access-token': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: user.id,
          [`${itemType}Id`]: Number(itemId)
        }),
      };

      const response = await fetchAuth({url, options, user, setAccessToken, router});
      if (!response) return;

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to unhide ${itemType}`);
      }

      showToast({ 
        message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} unhidden successfully`, 
        type: 'success' 
      });
      setItemId("");
      setConfirmModalOpen(false);
    } catch (err) {
      showToast({ 
        message: err instanceof Error ? err.message : `Failed to unhide ${itemType}`, 
        type: 'error' 
      });
    }
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/blog-posts/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/blog-posts/search');
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <BaseLayout
      user={user}
      onSearch={handleSearch}
      type="post"
    >
      <ConfirmationModal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleUnhide}
        title={`Unhide ${itemType}`}
        message={`Are you sure you want to unhide ${itemType} ${itemId}?`}
        confirmText="Unhide"
        cancelText="Cancel"
        confirmColor="primary"
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          maxWidth: '75rem',
          mx: 'auto'
        }}
      >
        <Typography variant="h4" sx={{ color: 'primary.main', mb: 4 }}>
          Unhide Content
        </Typography>

        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            p: 3
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}
          >
            <FormControl fullWidth>
              <InputLabel id="item-type-label">
                Type
              </InputLabel>
              <Select
                labelId="item-type-label"
                value={itemType}
                label="Type"
                onChange={(e) => setItemType(e.target.value as ItemType)}
                sx={{
                  bgcolor: 'background.default',
                }}
              >
                <MenuItem value="post">Post</MenuItem>
                <MenuItem value="comment">Comment</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="ID"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              sx={{
                bgcolor: 'background.default',
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              color="primary"
            >
              Unhide
            </Button>
          </Box>
        </Box>
      </Box>
    </BaseLayout>
  );
}