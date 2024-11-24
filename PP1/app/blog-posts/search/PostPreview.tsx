import { Typography, Card, CardContent, Box, Tooltip } from "@mui/material";
import { MessageCircle, TriangleAlert, Eye, Clock } from "lucide-react";
import Link from 'next/link';
import { useAuth } from "../../contexts/AuthContext";
import UserAvatar from '../../components/UserAvatar';
import { Post } from "../../types/post";
import Voting from "@/app/blog-posts/Voting";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/contexts/ThemeContext";

interface PostPreviewProps {
  post: Post;
  handleVote: (id: number, isUpvote: boolean) => Promise<void>;
  handleReportClick: (postId: number) => void;
}

export default function PostPreview({ post, handleVote, handleReportClick }: PostPreviewProps) {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCount = (count: number = 0) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleClick = () => {
    router.push(`/blog-posts/comments/${post.id}`);
  };

  return (
    <Card
      elevation={3}
      onClick={handleClick}
      sx={{
        cursor: 'pointer',
        bgcolor: 'background.paper',
        borderRadius: '0.25rem',
        border: '2px solid',
        borderColor: 'divider',
        '&:hover': {
          borderColor: 'text.secondary',
          boxShadow: 4,
        },
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
      }}
    >
      {/* Vote section */}
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: '0.25rem',
          borderTopLeftRadius: '0.25rem',
          borderBottomLeftRadius: '0.25rem',
          bgcolor: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.8)',
        }}
      >
        <Voting item={post} handleVote={handleVote} />
      </Box>

      <CardContent sx={{ flex: 1, p: '1rem' }}>
        {/* Header with Title and Stats */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '0.5rem' }}>
          <Typography 
            variant="h5"
            sx={{
              fontSize: { xs: '1rem', sm: '1.25rem' },
              color: 'text.primary',
            }}
          >
            {post.title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tooltip title="0 Views">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                <Eye className="w-4 h-4" />
                <Typography variant="caption" color="text.secondary">
                  0
                </Typography>
              </Box>
            </Tooltip>

            <Tooltip title={`Created: ${new Date(post.createdAt).toLocaleString()}`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                <Clock className="w-4 h-4" />
                <Typography variant="caption" color="text.secondary">
                  {/* {formatDate(post.createdAt)} */}
                  {new Date(post.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Box>

        {/* Author Info */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            mb: '0.5rem',
          }}
        >
          <UserAvatar username={post.authorUsername} userId={post.authorId} />
          {post.authorUsername[0] === '[' ? (
            <Typography sx={{ color: 'text.secondary' }}>
              {post.authorUsername}
            </Typography>
          ) : (
            <Link href={`/users/${post.authorUsername}`} onClick={(e) => e.stopPropagation()}>
              <Typography 
                sx={{
                  color: user?.id === post.authorId ? 'success.main' : 'text.secondary',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {post.authorUsername}
              </Typography>
            </Link>
          )}
        </Box>

        {/* Content */}
        <Typography 
          sx={{
            mb: post.tags.length > 0 ? '1rem' : 'auto',
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

        {/* Tags */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', mb: '1rem' }}>
          {post.tags.map((tag, index) => (
            <Box
              key={index}
              sx={{
                px: '0.25rem',
                py: '0.125rem',
                borderRadius: 'full',
                fontSize: '0.75rem',
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                color: 'primary.main',
              }}
            >
              {tag.name}
            </Box>
          ))}
        </Box>

        {/* Actions */}
        <Box 
          sx={{ display: 'flex', gap: '0.5rem' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Link 
            href={`/blog-posts/comments/${post.id}`}
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
                gap: '0.125rem',
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <MessageCircle size={18} />
              <span style={{ fontSize: '0.875rem' }}>Comments</span>
            </Typography>
          </Link>
          
          {user?.id !== post.authorId && (
            <button 
              onClick={() => handleReportClick(post.id)}
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
                  gap: '0.125rem',
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                <TriangleAlert size={18} />
                <span style={{ fontSize: '0.875rem' }}>Report</span>
              </Typography>
            </button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}