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
import {useEffect, useState} from "react";
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

    try {
      const response = await fetch(`${domain}/api/code-templates/search?page=${page}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log(data);
      if(data.status === "error") {
        console.log(data.message);
      }
      else {
        setCodeTemplates(prevItems => [...prevItems, ...data.template]);
      }
      setHasMore(data.hasMore);
      setPage(page + 1);
    }
    catch (err: Error) {
      setError(err.message);
    }
    finally{
      setIsLoading(false);
    }
  }
  useEffect(() => {
    fetchCodeTemplates();
  }, []);

  const toggleSidebar = () => {
    setSideBarState(!sideBarState);
  }
  return (
    <div className={"bg-slate-900"}>
      <AppBar className={"bg-blend-darken bg-primary grid-rows-1 sticky "}>
        <div className={"m-2 items-center grid grid-cols-3"}>
          <Typography className={"m-1"} variant="h5">Scriptorium</Typography>
          <TextField fullWidth color={"secondary"} variant={"outlined"}
                     label={"Search All..."}/>
          <div className={"m-1"}>
            <Button className={"float-end bg-secondary"} variant={"contained"}>Sign In</Button>
          </div>
        </div>
      </AppBar>

      <div className={"grid grid-cols-7 gap-3"}>
        <div onClick={toggleSidebar} className={`fixed transition duration-700 bg-black ${sideBarState ? "opacity-50" : "opacity-0 -z-10"} w-full h-full`}></div>
        <div className={`${sideBarState ? "z-50": "-translate-x-72"} duration-700 flex  fixed rounded-r border-b-4 border-t-4 border-r-4 border-slate-800 h-screen col-span-2 sm:col-span-1 top-24`}>
          <aside className={"bg-secondary overflow-auto"}>
            <div className={"m-3"}>
              <div className={"m-3"}>
                <TextField color={"info"} fullWidth variant={"outlined"}
                           label={"Search Code Templates..."}/>
              </div>
              <div className={"h-65"}>
                <Typography className={"m-3"} variant={"h6"}>Tags:</Typography>
                <FormGroup
                  className={"m-3 p-3 h-44 rounded border overflow-y-hidden hover:overflow-y-scroll grid grid-cols-1"}>
                  <FormControlLabel control={<Checkbox/>} label={"Tag 1"}/>
                  <FormControlLabel control={<Checkbox/>} label={"Tag 2"}/>
                  <FormControlLabel control={<Checkbox/>} label={"Tag 3"}/>
                  <FormControlLabel control={<Checkbox/>} label={"Tag 3"}/>
                  <FormControlLabel control={<Checkbox/>} label={"Tag 3"}/>
                  <FormControlLabel control={<Checkbox/>} label={"Tag 3"}/>
                  <FormControlLabel control={<Checkbox/>} label={"Tag 3"}/>
                </FormGroup>
              </div>
            </div>
            <button onClick={toggleSidebar} className={"float-end bg-slate-800 hover:brightness-75 active:brightness-50 p-2 rounded-l-xl items-start"}>&lt;</button>
          </aside>
        </div>
        <div className={`${sideBarState ? "-translate-x-7" : ""} duration-700 flex fixed h-screen col-span-2 sm:col-span-1 top-24 z-50`}>
          <button onClick={toggleSidebar} className={"flex fixed bg-slate-800 hover:brightness-75 active:brightness-50 p-2 rounded-r-xl"}>&gt;</button>
        </div>
          <div className={"col-span-5 sm:col-span-6"}>
            <InfiniteScroll
              dataLength={codeTemplates.length}
              next={fetchCodeTemplates}
              hasMore={hasMore}
              loader={<h1>Loading...</h1>}
              endMessage={
                <p style={{ textAlign: "center" }}>
                  <b>Yay! You have seen it all</b>
                </p>
              }
            >
            {codeTemplates.map((template, key) => {
              return (
                <div key={key} className={"p-3 transition focus:border border-primary active:brightness-50 hover:brightness-75 rounded lg:rounded-lg m-4 bg-slate-700 h-32"}>
                  <Typography className={"text-xl sm:text-2xl"}>{template.title}</Typography>
                  <Typography className={"text-lg truncate"}>{template.explanation}</Typography>
                </div>
              );
              })
            }
            </InfiniteScroll>

          </div>
        </div>
      </div>
      );
      }
