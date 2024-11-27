"use client";

import React, { useEffect, useState } from 'react';
import {useParams} from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
} from '@mui/material';
import { CodeTemplate } from '@/app/types';
import ErrorBox from '@/app/components/ErrorBox';
import CodeEditor from '@/app/components/CodeEditor';


const CodeTemplatePage = () => {
  const params = useParams();
  const [template, setTemplate] = useState<CodeTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTemplate = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(
          `http://localhost:3000/api/code-templates/${params.templateId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setTemplate(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch template');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.templateId) {
      fetchTemplate();
    } else {
      setIsLoading(false); // Make sure to set loading to false if we're not fetching
      setError('Invalid template ID');
    }
  }, [params.templateId]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <ErrorBox errorMessage={error} />;
  }


  if (!template) {
    return (
      <Container>
        <Typography variant="h5" color="error">
          Template not found
        </Typography>
      </Container>
    );
  }

  return <CodeEditor initialTemplate={template} mode="view" />;
};

export default CodeTemplatePage;