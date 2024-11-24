import {
  Typography,
  Box,
  ThemeProvider,
  useTheme as useMuiTheme
} from "@mui/material";
import { FileText, ExternalLink, EyeOff } from "lucide-react";
import Link from 'next/link';

import UserAvatar from '@/app/components/UserAvatar';
import { ReportedPost } from "@/app/types/post";
import { useAuth } from "@/app/contexts/AuthContext";
import { useTheme } from "@/app/contexts/ThemeContext";

interface PostReportPreviewProps {
  post: ReportedPost;
  handleHide: (postId: number) => void;
}

export default function PostReportPreview({ post, handleHide }: PostReportPreviewProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const muiTheme = useMuiTheme();

  return (
    <ThemeProvider theme={theme}>
      <Box
        component="article"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 1,
          border: '2px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          p: 2,
          '&:hover': {
            borderColor: 'text.secondary',
          },
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <UserAvatar username={post.authorUsername} userId={post.authorId} />

          {post.authorUsername[0] === '[' ? (
            <Typography sx={{ color: 'text.secondary' }}>
              {post.authorUsername}
            </Typography>
          ) : (
            <Link href={`/users/${post.authorUsername}`}>
              <Typography 
                sx={{
                  color: user?.id === post.authorId ? 'success.main' : 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                {post.authorUsername}
              </Typography>
            </Link>
          )}

          <Typography sx={{ color: 'text.secondary' }}>
            • {new Date(post.createdAt).toLocaleString()}
          </Typography>

          <Typography 
            sx={{ 
              color: 'error.main',
              marginLeft: 'auto'
            }}
          >
            {post.reportCount} reports
          </Typography>
        </Box>

        <Typography 
          variant="h6" 
          sx={{
            mb: 1,
            color: 'text.primary',
          }}
        >
          {post.title}
        </Typography>

        <Typography 
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: 'text.secondary',
          }}
        >
          {post.content}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link href={`/admin/post-reports/${post.id}`}>
            <Typography
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              <FileText size={18} />
              <span style={{ fontSize: '0.875rem' }}>See reports</span>
            </Typography>
          </Link>

          <Link href={`/blog-posts/comments/${post.id}`}>
            <Typography
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              <ExternalLink size={18} />
              <span style={{ fontSize: '0.875rem' }}>Go to post</span>
            </Typography>
          </Link>

          <button
            onClick={() => handleHide(post.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <Typography
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'text.secondary',
                '&:hover': {
                  color: 'error.main',
                },
              }}
            >
              <EyeOff size={18} />
              <span style={{ fontSize: '0.875rem' }}>Hide</span>
            </Typography>
          </button>
        </Box>
      </Box>
    </ThemeProvider>
  );
}