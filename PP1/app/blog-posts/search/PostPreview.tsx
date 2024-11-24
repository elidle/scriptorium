import { Typography, ThemeProvider, Box, useTheme as useMuiTheme } from "@mui/material";
import { MessageCircle, TriangleAlert } from "lucide-react";
import Link from 'next/link';
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

import UserAvatar from '../../components/UserAvatar';

import { Post } from "../../types/post";
import Voting from "@/app/blog-posts/Voting";

interface PostPreviewProps {
  post: Post;
  handleVote: (id: number, isUpvote: boolean) => Promise<void>;
  handleReportClick: (postId: number) => void;
}

export default function PostPreview({ post, handleVote, handleReportClick }: PostPreviewProps) {
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();

  return (
    <ThemeProvider theme={theme}>
      <Box
        key={post.id} 
        component="article"
        sx={{
          display: 'flex',
          borderRadius: 1,
          border: '2px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          '&:hover': {
            borderColor: 'text.secondary',
          },
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {/* Vote section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 1,
            borderTopLeftRadius: 1,
            borderBottomLeftRadius: 1,
            bgcolor: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.8)',
          }}
        >
          <Voting item={post} handleVote={handleVote} />
        </Box>

        <Link href={`/blog-posts/comments/${post.id}`}>
        <Box sx={{ p: 1.5 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              mb: 2,
              fontSize: { xs: '0.75rem', sm: '0.875rem' } 
            }}
          >
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
          </Box>
          
          <Link 
            href={`/blog-posts/comments/${post.id}`}
            style={{ display: 'block' }}
          >
            <Typography 
              variant="h6" 
              sx={{
                mb: 1,
                fontSize: { xs: '1rem', sm: '1.25rem' },
                color: 'text.primary',
              }}
            >
              {post.title}
            </Typography>
            <Typography 
              sx={{
                mb: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                color: 'text.secondary',
              }}
            >
              {post.content}
            </Typography>
          </Link>

          <Box 
            sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1, 
              mb: 1.5 
            }}
          >
            {post.tags.map((tag, index) => (
              <Box
                key={index}
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 'full',
                  fontSize: '0.75rem',
                  bgcolor: theme.palette.background.default,
                  border: 1,
                  borderColor: 'divider',
                  color: 'primary.main',
                }}
              >
                {tag.name}
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link 
              href={`/blog-posts/comments/${post.id}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
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
                <MessageCircle size={18} />
                <span style={{ fontSize: '0.875rem' }}>Comments</span>
              </Typography>
            </Link>
            
            {user?.id !== post.authorId && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  handleReportClick(post.id);
                }}
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
                      color: 'primary.main',
                    },
                  }}
                >
                  <TriangleAlert size={18} />
                  <span style={{ fontSize: '0.875rem' }}>Report</span>
                </Typography>
              </button>
            )}
          </Box>
        </Box>
        </Link>
      </Box>
    </ThemeProvider>
  );
}