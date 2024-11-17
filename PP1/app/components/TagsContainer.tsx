import {Checkbox, FormControlLabel, FormGroup, Typography} from "@mui/material";
import React from "react";
import {Tag} from "@/app/types";

interface TagsContainerProps {
  tags: Tag[];
  selectedTags: string[];
  handleSelectedTags: (tags: string[]) => void;
}

const TagsContainer: React.FC<TagsContainerProps> = ({ tags, selectedTags, handleSelectedTags }) => {

  const handleChange = (tagName: string) => {
    console.log(tagName); // TODO: Remove this line
    if (selectedTags.includes(tagName)) {
      handleSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      handleSelectedTags([...selectedTags, tagName]);
    }
    console.log(selectedTags); // TODO: Remove this line
  }

  return (
    <div className={"h-65"}>
      <Typography className={"m-3"} variant={"h6"}>Tags:</Typography>
      <FormGroup
        className={"m-3 p-3 h-44 rounded border " +
          "sm:overflow-y-hidden overflow-y-scroll sm:hover:overflow-y-scroll " +
          "grid grid-cols-1"}>
        {tags.map((tag, key)=> {
          return (
            <FormControlLabel key={key} control={<Checkbox onChange={(e) => handleChange(e.target.name)} name={tag.name}/>} label={tag.name}/>
          )
        })
        }
      </FormGroup>
    </div>
  )
}

export default TagsContainer;