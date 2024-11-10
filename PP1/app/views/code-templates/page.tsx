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
import {useState} from "react";

export function CodeTemplates() {
  const [sideBarState, setSideBarState] = useState(false);
  const toggleSidebar = () => {
    setSideBarState(!sideBarState);
  }
  return (
    <div className={"bg-slate-900"}>
      <AppBar position="fixed" className={"bg-blend-darken bg-primary grid-rows-1 sticky"}>
        <div className={"m-2 items-center grid grid-cols-3"}>
          <Typography className={"m-1"} variant="h5">Scriptorium</Typography>
          <TextField fullWidth color={"secondary"} variant={"outlined"}
                     label={"Search All..."}/>
          <div className={"m-1"}>
            <Button className={"float-end bg-secondary"} variant={"contained"}>Sign In</Button>
          </div>
        </div>
      </AppBar>

      <div className={"grid grid-rows-8 grid-cols-7 overflow-auto h-screen gap-3"}>
        <div
          className={`${sideBarState ? "": "-translate-x-72"} duration-700 flex  fixed rounded-r border-b-4 border-t-4 border-r-4 border-slate-800 h-screen col-span-2 sm:col-span-1 top-24`}>
          <aside className={"bg-secondary overflow-auto z-10"}>
            <div className={"m-3"}>
              <div className={"m-3"}>
                <TextField color={"info"} fullWidth variant={"outlined"}
                           label={"Search Code Templates..."}/>
              </div>
              <div className={"h-65"}>
                <Typography className={"m-3"} variant={"h6"}>Tags:</Typography>
                <FormGroup
                  className={"m-3 p-3 h-44 rounded border overflow-y-scroll grid grid-cols-1"}>
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
            <button onClick={toggleSidebar} className={"float-end bg-slate-800 p-2 rounded-l-xl items-start"}>&lt;</button>
          </aside>
        </div>
        <div className={`${sideBarState ? "-translate-x-7" : ""} duration-700 flex fixed h-screen col-span-2 sm:col-span-1 top-24 z-50`}>
          <button onClick={toggleSidebar} className={"flex fixed bg-slate-800 p-2 rounded-r-xl"}>&gt;</button>
        </div>
          <div className={"col-span-5 sm:col-span-6 z-5"}>
            {["Code Templates", "Code Templates", "Code Templates", "Code Templates"].map((template, key) => {
              return (
                <div key={key} className={"p-3 rounded lg:rounded-lg m-4 bg-slate-700 h-32"}>
                  <Typography className={"text-xl sm:text-2xl"}>{template}</Typography>
                </div>
              );
              })
            }

          </div>
        </div>
      </div>
      );
      }
