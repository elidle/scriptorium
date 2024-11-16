"use client"; // Enable client-side rendering
import React, { useState } from 'react';
import TextInput from '@mui/material';
import SearchBar from '@/app/components/SearchBar';
import { Button, AppBar, Typography, Select, MenuItem } from '@mui/material';
import { Play, Save, Trash2, GitFork } from 'lucide-react';

const CodeEditor = () => {
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('python');
  const [explanation, setExplanation] = useState('');
  const [tags, setTags] = useState('');
  const [output, setOutput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle code execution here
  };

  const handleSearch = (query: string) => {
    // Handle search here
    console.log("Searching:", query);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AppBar className="bg-blend-darken bg-primary grid-rows-1 sticky">
        <div className="m-2 items-center grid grid-cols-3">
          <Typography className="m-1 text-lg sm:text-3xl">
            Scriptorium
          </Typography>
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search All..."
            className="w-full"
          />
          <div className="m-1">
            <Button className="float-end bg-secondary" variant="contained">
              Sign In
            </Button>
          </div>
        </div>
      </AppBar>

      <div className="container mx-auto p-6 mt-20">
        <div className="grid grid-cols-4 gap-6">
          {/* Left side - Code Editor and Controls */}
          <div className="col-span-3 space-y-6">
            {/* Top Controls */}
            <div className="flex items-center justify-between bg-slate-800 p-4 rounded-lg shadow-lg">
              <div className="flex items-center gap-4">
                <Select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-48 bg-slate-700 text-white rounded-md"
                  variant="outlined"
                >
                  <MenuItem value="python">Python</MenuItem>
                  <MenuItem value="javascript">JavaScript</MenuItem>
                  <MenuItem value="java">Java</MenuItem>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Trash2 className="w-4 h-4" />}
                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  Delete
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<Save className="w-4 h-4" />}
                  className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                >
                  Save
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<GitFork className="w-4 h-4" />}
                  className="bg-secondary hover:bg-secondary/90"
                >
                  Fork
                </Button>
              </div>
            </div>

            {/* Code Editor */}
            <div className="bg-slate-800 rounded-lg shadow-lg p-4">
              <TextInput
                label="Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="min-h-[400px] font-mono bg-slate-700"
                multiline
              />
            </div>

            {/* Input/Output Section */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-800 rounded-lg shadow-lg p-4">
                <TextInput
                  label="Input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="bg-slate-700 min-h-[150px]"
                  multiline
                />
              </div>
              <div className="bg-slate-800 rounded-lg shadow-lg p-4">
                <TextInput
                  label="Output"
                  value={output}
                  disabled
                  className="bg-slate-700 min-h-[150px]"
                  multiline
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
                startIcon={<Play className="w-5 h-5" />}
                className="px-8 py-3 bg-primary hover:bg-primary/90"
              >
                Run
              </Button>
            </div>
          </div>

          {/* Right side - Explanation and Tags */}
          <div className="col-span-1 space-y-6">
            <div className="bg-slate-800 rounded-lg shadow-lg p-4">
              <TextInput
                label="Explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="bg-slate-700 min-h-[300px]"
                multiline
              />
            </div>
            <div className="bg-slate-800 rounded-lg shadow-lg p-4">
              <TextInput
                label="Tags (comma separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="bg-slate-700 min-h-[150px]"
                multiline
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