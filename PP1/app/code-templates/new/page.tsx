"use client";

import React from 'react';
import CodeEditor from '@/app/components/CodeEditor';
import {CodeTemplate, Tag } from '@/app/types';

const NewCodeTemplate = () => {
  // Create an empty initial template with required structure
  const emptyTemplate: CodeTemplate = {
    id: '',
    author: { username: '', avatar: '' },
    title: '',
    code: '',
    language: '',
    explanation: '',
    input: '',
    tags: [],
    createdAt: '',
    updatedAt: '',
    isForked: false,
    forkCount: 0,
    viewCount: 0,
  };

  return (
    <CodeEditor
      mode="create"
      initialTemplate={emptyTemplate}
    />
  );
};

export default NewCodeTemplate;