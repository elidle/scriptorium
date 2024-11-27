"use client";

import React from 'react';
import CodeEditor from '@/app/components/CodeEditor';
import {CodeTemplate} from '@/app/types';

const NewCodeTemplate = () => {
  // Create an empty initial template with required structure
  const emptyTemplate: CodeTemplate = {
    id: '',
    author: { id: '', username: '', avatar: '' },
    title: '',
    code: '',
    language: '',
    explanation: '',
    tags: [],
    createdAt: '',
    updatedAt: '',
    isForked: false,
    forkCount: 0,
  };

  return (
    <CodeEditor
      mode="create"
      initialTemplate={emptyTemplate}
    />
  );
};

export default NewCodeTemplate;