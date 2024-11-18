"use client";
import {
  AppBar,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/contexts/ToastContext";
import { fetchAuth } from "@/app/utils/auth";

import SideNav from "@/app/components/SideNav";
import UserAvatar from "@/app/components/UserAvatar";
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

      let response = await fetchAuth({url, options, user, setAccessToken, router});
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

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-200">
      <SideNav router={router} />

      <ConfirmationModal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleUnhide}
        title={`Unhide ${itemType}`}
        message={`Are you sure you want to unhide ${itemType} ${itemId}?`}
        confirmText="Unhide"
        cancelText="Cancel"
        confirmColor="!bg-blue-600 hover:!bg-blue-700"
      />

      <AppBar 
        position="fixed" 
        className="!bg-slate-800 border-b border-slate-700"
        sx={{ boxShadow: 'none' }}
      >
        <div className="p-3 flex flex-col sm:flex-row items-center gap-3">
          <Link href="/">
            <Typography 
              className="text-xl sm:text-2xl text-blue-400 flex-shrink-0" 
              variant="h5"
            >
              Scriptorium Admin
            </Typography>
          </Link>

          <div className="flex-grow"></div>

          <div className="flex items-center gap-2">
            <UserAvatar username={user.username} userId={user.id} />
            <Typography className="text-slate-200">
              {user.username}
            </Typography>
          </div>
        </div>
      </AppBar>

      <main className="flex-1 p-4 max-w-3xl w-full mx-auto mt-12 mb-10">
        <Typography variant="h6" className="text-blue-400 mb-6">
          Unhide Content
        </Typography>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormControl fullWidth>
              <InputLabel id="item-type-label" className="text-slate-400">
                Type
              </InputLabel>
              <Select
                labelId="item-type-label"
                value={itemType}
                label="Type"
                onChange={(e) => setItemType(e.target.value as ItemType)}
                className="bg-slate-900"
                sx={{
                  color: 'rgb(226, 232, 240)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgb(51, 65, 85)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgb(59, 130, 246)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgb(59, 130, 246)',
                  },
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
              className="bg-slate-900"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'rgb(226, 232, 240)',
                  '& fieldset': {
                    borderColor: 'rgb(51, 65, 85)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgb(59, 130, 246)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgb(59, 130, 246)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgb(148, 163, 184)',
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              className="bg-blue-600 hover:bg-blue-700"
            >
              Unhide
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}