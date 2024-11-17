"use client";
import {
  AppBar,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  FormGroup,
} from "@mui/material";
import { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

const domain = "http://localhost:3000";

interface CodeTemplate {
  title: string;
  explanation: string;
  code: string;
  tags: string[];
}

export function CodeTemplates() {
  const [sideBarState, setSideBarState] = useState(false);
  const [codeTemplates, setCodeTemplates] = useState<CodeTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCodeTemplates = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${domain}/api/code-templates/search?page=${page}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      
      if (data.status === "error") {
        console.error(data.message);
        setError(data.message);
      } else {
        setCodeTemplates(prevItems => [...prevItems, ...data.template]);
        setHasMore(data.hasMore);
        setPage(page + 1);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCodeTemplates();
  }, []);

  const toggleSidebar = () => {
    setSideBarState(!sideBarState);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Fixed header */}
      <AppBar 
        position="fixed" 
        className="bg-slate-800 border-b border-slate-700"
        sx={{ boxShadow: 'none' }}
      >
        <div className="p-3 flex flex-col sm:flex-row items-center gap-3">
          <Typography 
            className="text-xl sm:text-2xl text-blue-400 flex-shrink-0" 
            variant="h5"
          >
            Scriptorium
          </Typography>
          <TextField 
            className="w-full"
            color="info"
            variant="outlined"
            label="Search All..."
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgb(30, 41, 59)',
                '&:hover': {
                  backgroundColor: 'rgb(30, 41, 59, 0.8)',
                },
              },
            }}
          />
          <Button 
            className="bg-blue-600 hover:bg-blue-700 px-6 min-w-[100px] whitespace-nowrap h-9"
            variant="contained"
            size="small"
          >
            Sign In
          </Button>
        </div>
      </AppBar>

      {/* Content container with correct top padding */}
      <div className="pt-16"> {/* Matches header height */}
        <div className="flex relative">
          {/* Overlay */}
          <div 
            onClick={toggleSidebar}
            className={`fixed inset-0 bg-black transition-opacity duration-300 ${
              sideBarState ? "opacity-50 visible" : "opacity-0 invisible"
            } md:hidden`}
          />

          {/* Sidebar */}
          <aside className={`
            fixed md:sticky top-16 h-[calc(100vh-4rem)]
            transform transition-transform duration-300 w-64
            ${sideBarState ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            bg-slate-800 border-r border-slate-700 z-40
          `}>
            <div className="p-4 h-full flex flex-col">
              <TextField
                color="info"
                variant="outlined"
                label="Search Templates..."
                size="small"
                className="mb-4"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgb(30, 41, 59)',
                    '&:hover': {
                      backgroundColor: 'rgb(30, 41, 59, 0.8)',
                    },
                  },
                }}
              />
              
              <Typography variant="h6" className="mb-2 text-blue-400">
                Tags
              </Typography>
              
              <FormGroup className="flex-1 overflow-y-auto p-2 border border-slate-700 rounded bg-slate-900/50">
                <FormControlLabel 
                  control={
                    <Checkbox 
                      sx={{
                        color: 'rgb(96, 165, 250)',
                        '&.Mui-checked': {
                          color: 'rgb(96, 165, 250)',
                        },
                      }}
                    />
                  } 
                  label="React" 
                />
                <FormControlLabel 
                  control={
                    <Checkbox 
                      sx={{
                        color: 'rgb(96, 165, 250)',
                        '&.Mui-checked': {
                          color: 'rgb(96, 165, 250)',
                        },
                      }}
                    />
                  } 
                  label="TypeScript" 
                />
                <FormControlLabel 
                  control={
                    <Checkbox 
                      sx={{
                        color: 'rgb(96, 165, 250)',
                        '&.Mui-checked': {
                          color: 'rgb(96, 165, 250)',
                        },
                      }}
                    />
                  } 
                  label="Next.js" 
                />
                <FormControlLabel 
                  control={
                    <Checkbox 
                      sx={{
                        color: 'rgb(96, 165, 250)',
                        '&.Mui-checked': {
                          color: 'rgb(96, 165, 250)',
                        },
                      }}
                    />
                  } 
                  label="Tailwind" 
                />
                <FormControlLabel 
                  control={
                    <Checkbox 
                      sx={{
                        color: 'rgb(96, 165, 250)',
                        '&.Mui-checked': {
                          color: 'rgb(96, 165, 250)',
                        },
                      }}
                    />
                  } 
                  label="Material UI" 
                />
              </FormGroup>
            </div>

            {/* Mobile toggle button */}
            <button 
              onClick={toggleSidebar}
              className="absolute right-0 top-1/2 translate-x-full bg-slate-800 p-2 rounded-r-xl md:hidden hover:bg-slate-700"
            >
              {sideBarState ? "←" : "→"}
            </button>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-4">
                <Typography className="text-red-500">{error}</Typography>
              </div>
            )}
            
            <InfiniteScroll
              dataLength={codeTemplates.length}
              next={fetchCodeTemplates}
              hasMore={hasMore}
              loader={
                <div className="text-center p-4">
                  <Typography className="text-blue-400">Loading...</Typography>
                </div>
              }
              endMessage={
                <Typography className="text-center p-4 text-slate-400">
                  You've seen all templates!
                </Typography>
              }
            >
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {codeTemplates.map((template, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-slate-800 border border-slate-700 
                             hover:border-blue-500/50 transition-all cursor-pointer"
                  >
                    <Typography className="text-xl text-blue-400 mb-2">
                      {template.title}
                    </Typography>
                    <Typography className="text-slate-300 line-clamp-2">
                      {template.explanation}
                    </Typography>
                  </div>
                ))}
              </div>
            </InfiniteScroll>
          </main>
        </div>
      </div>
    </div>
  );
}
