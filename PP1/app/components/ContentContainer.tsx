import React from "react";

interface ContentContainerProps {
  children: React.ReactNode;
  key: number;
}

const ContentContainer: React.FC<ContentContainerProps> = ({children, key}) => {
  return (
    <div key={key} className={"p-3 transition focus:border border-primary bg-slate-700 active:bg-slate-700 hover:bg-slate-800 rounded lg:rounded-lg m-4  h-32"}>
      {children}
    </div>
  );
}

export default ContentContainer;
