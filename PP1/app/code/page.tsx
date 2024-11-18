"use client"; // Enable client-side rendering
import React, { useState } from 'react';
import { TextField, Button, AppBar, Typography, Select, MenuItem } from '@mui/material';
import { Play, Save, Trash2, GitFork } from 'lucide-react';
import SearchBar from '@/app/components/SearchBar';

const CodeEditor = () => {
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('python');
  const [explanation, setExplanation] = useState('');
  const [tags, setTags] = useState('');
  const [output, setOutput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle code execution here
  };

  const handleSearch = (query: string) => {
    console.log("Searching:", query);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AppBar position="sticky">
        <div className="m-2 items-center grid grid-cols-3">
          <Typography variant="h4" className="m-1">
            Scriptorium
          </Typography>
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search All..."
            className="w-full"
          />
          <div className="m-1">
            <Button variant="contained" color="secondary">
              Sign In
            </Button>
          </div>
        </div>
      </AppBar>

      <div className="container mx-auto p-6 mt-20">
        <div className="grid grid-cols-4 gap-6">
          {/* Left side - Code Editor and Controls */}
          <div className="col-span-3 space-y-6">
            <div className="flex items-center justify-between bg-slate-800 p-4 rounded-lg shadow-lg">
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value as string)}
                className="w-48"
                variant="outlined"
              >
                <MenuItem value="python">Python</MenuItem>
                <MenuItem value="javascript">JavaScript</MenuItem>
                <MenuItem value="java">Java</MenuItem>
              </Select>

              <div className="flex gap-3">
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Trash2 />}
                >
                  Delete
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<Save />}
                >
                  Save
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<GitFork />}
                >
                  Fork
                </Button>
              </div>
            </div>

            {/* Code Editor */}
            <div className="bg-slate-800 rounded-lg shadow-lg p-4">
              <TextField
                label="Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="min-h-[400px] font-mono"
                multiline
                fullWidth
                variant="outlined"
                InputProps={{ className: "bg-slate-700" }}
              />
            </div>

            {/* Input/Output Section */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-800 rounded-lg shadow-lg p-4">
                <TextField
                  label="Input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-[150px]"
                  multiline
                  fullWidth
                  variant="outlined"
                  InputProps={{ className: "bg-slate-700" }}
                />
              </div>
              <div className="bg-slate-800 rounded-lg shadow-lg p-4">
                <TextField
                  label="Output"
                  value={output}
                  disabled
                  className="min-h-[150px]"
                  multiline
                  fullWidth
                  variant="outlined"
                  InputProps={{ className: "bg-slate-700" }}
                />
              </div>
            </div>

            {/* Run Button */}
            <div className="flex justify-end">
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                size="large"
                startIcon={<Play />}
                className="px-8 py-3"
              >
                Run
              </Button>
            </div>
          </div>

          {/* Right side - Explanation and Tags */}
          <div className="col-span-1 space-y-6">
            <div className="bg-slate-800 rounded-lg shadow-lg p-4">
              <TextField
                label="Explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="min-h-[300px]"
                multiline
                fullWidth
                variant="outlined"
                InputProps={{ className: "bg-slate-700" }}
              />
            </div>
            <div className="bg-slate-800 rounded-lg shadow-lg p-4">
              <TextField
                label="Tags (comma separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="min-h-[150px]"
                multiline
                fullWidth
                variant="outlined"
                InputProps={{ className: "bg-slate-700" }}
                helperText="Enter tags separated by commas"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
