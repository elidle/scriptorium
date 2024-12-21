import {
  Typography,
  Box,
  ThemeProvider
} from "@mui/material";
import { FileText, ExternalLink, EyeOff } from "lucide-react";
import Link from 'next/link';
import UserAvatar from '@/app/components/UserAvatar';
import { useTheme } from "@/app/contexts/ThemeContext";
import { ReportedComment } from "@/app/types/comment";

interface CommentReportPreviewProps {
  comment: ReportedComment;
  handleHide: (commentId: number) => void;
}

export default function CommentReportPreview({ comment, handleHide }: CommentReportPreviewProps) {
  const { theme } = useTheme();

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
          <UserAvatar username={comment.authorUsername} userId={comment.authorId} />

          {comment.authorUsername[0] === '[' ? (
            <Typography sx={{ color: 'text.secondary' }}>
              {comment.authorUsername}
            </Typography>
          ) : (
            <Link href={`/users/${comment.authorUsername}`}>
              <Typography 
                sx={{
                  color: comment?.id === comment.authorId ? 'success.main' : 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                {comment.authorUsername}
              </Typography>
            </Link>
          )}

          <Typography sx={{ color: 'text.secondary' }}>
            • {new Date(comment.createdAt).toLocaleString()}
          </Typography>

          <Typography 
            sx={{ 
              color: 'error.main',
              marginLeft: 'auto'
            }}
          >
            {comment.reportCount} reports
          </Typography>
        </Box>

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
          {comment.content}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link href={`/admin/comment-reports/${comment.id}`}>
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

          <Link href={`/blog-posts/comments/${comment.postId}`}>
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
            onClick={() => handleHide(comment.id)}
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