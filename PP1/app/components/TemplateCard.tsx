import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Link
} from "@mui/material";
import {
  GitBranch,
  Clock,
  Eye,
  GitFork,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import UserAvatar from "@/app/components/UserAvatar";
import { useRouter } from "next/navigation";
import { CodeTemplate } from "@/app/types";

interface TemplateCardProps {
  template: CodeTemplate;
}

const MAX_DESCRIPTION_LENGTH = 200;
const TemplateCard: React.FC<TemplateCardProps> = ({ template }) => {
  const router = useRouter();

  const needsTruncation = template.explanation?.length > MAX_DESCRIPTION_LENGTH;

  const truncatedText = needsTruncation
    ? template.explanation.slice(0, MAX_DESCRIPTION_LENGTH) + "..."
    : template.explanation;

  const handleClick = () => {
    router.push(`/code-templates/${template.author.username}/${template.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCount = (count: number = 0) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getLanguageColor = (language: string) => {
    const colors = {
      python: '#3776AB',
      python3: '#3776AB',
      javascript: '#F7DF1E',
      typescript: '#3178C6',
      java: '#007396',
      ruby: '#CC342D',
      go: '#00ADD8',
      rust: '#000000',
      cpp: '#00599C',
      'c++': '#00599C',
      'c#': '#239120',
      php: '#777BB4'
    };
    return colors[language.toLowerCase()] || '#6b7280';
  };

  return (
    <Card
      elevation={3}
      onClick={handleClick}
      sx={{
        cursor: 'pointer',
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: '2px solid',
        borderColor: 'divider',
        '&:hover': {
          borderColor: 'text.secondary',
          boxShadow: 4,
        },
        transition: 'all 0.2s ease-in-out',
      }}
      className={"w-full block"}
    >
      <CardContent>
        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="h5" component="h2" sx={{ color: 'text.primary' }}>
              {template.title}
            </Typography>

            {/* Author Info & Language */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UserAvatar username={template.author.username} userId={template.author.id} />
                <Link href={`/users/${template.author.username}`}>
                  <Typography
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'primary.main',
                      }
                    }}
                  >
                    {template.author.username}
                  </Typography>
                </Link>
              </Box>

              <Chip
                label={template.language}
                size="small"
                sx={{
                  bgcolor: getLanguageColor(template.language),
                  color: 'white',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace'
                }}
              />
            </Box>
          </Box>

          {/* Stats & Timestamps */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            {/* Stats Row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="Views">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Eye className="w-4 h-4" />
                  <Typography variant="caption" color="text.secondary">
                    {formatCount(template.viewCount)}   {/* TODO: Extra */}
                  </Typography>
                </Box>
              </Tooltip>

              <Tooltip title="Forks">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <GitFork className="w-4 h-4" />
                  <Typography variant="caption" color="text.secondary">
                    {formatCount(template.forkCount)}
                  </Typography>
                </Box>
              </Tooltip>
            </Box>

            {/* Timestamp & Fork Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title={`Updated: ${formatDate(template.updatedAt)}`}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Clock className="w-4 h-4" />
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(template.createdAt)}
                  </Typography>
                </Box>
              </Tooltip>

              {template.isForked && (
                <Tooltip title="Forked template">
                  <Chip
                    icon={<GitBranch className="w-3 h-3" />}
                    label="Forked"
                    color="secondary"
                    size="small"
                  />
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>

        {/* Content Section */}
        <Box className="mb-3">
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {truncatedText}
          </Typography>
        </Box>
        
        {/* Code Preview */}
        <Box
          sx={{
            bgcolor: 'background.default',
            p: 2,
            borderRadius: 1,
            mb: 2,
            maxHeight: '100px',
            overflow: 'hidden',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40px',
              background: 'linear-gradient(transparent, #0f172a)',
            }
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              color: 'text.primary',
            }}
          >
            {template.code}
          </Typography>
        </Box>

        {/* Input Preview (if exists) */}
        {template.input && (
          <Box
            sx={{
              bgcolor: 'background.default',
              p: 2,
              borderRadius: 1,
              mb: 2,
              maxHeight: '60px',
              overflow: 'hidden',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '30px',
                background: 'linear-gradient(transparent, #0f172a)',
              }
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
              }}
            >
              Input: {template.input}
            </Typography>
          </Box>
        )}

        {/* Tags Section */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {template.tags.map((tag, index) => (
            <Chip
              key={index}
              label={tag.name}
              size="small"
              sx={{
                bgcolor: 'background.default',
                '&:hover': {
                  bgcolor: 'background.default',
                  opacity: 0.8
                }
              }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TemplateCard;