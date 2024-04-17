import React from "react";
import { MenuItem, Select } from "@mui/material";
import { LensProps } from "@focuson/state";

export type SelectWhenIdIsNameProps<S> = LensProps<S, string, any> & {
  purpose: string
  options: string[] // In this case the id is the name
}
export function SelectWhenIdIsName<S> ( { state, purpose, options }: SelectWhenIdIsNameProps<S> ) {
  const selected = state.optJson ()
  return <Select
    value={selected || ''}
    onChange={e => state.setJson ( e.target?.value, 'Selectit' )}
    aria-label={`Select${purpose ? ' ' + purpose : ''}`}
    displayEmpty
    fullWidth
  > <MenuItem disabled value=""> <em>Please select a {purpose}</em> </MenuItem>
    {options.map ( ( option ) => (
      <MenuItem key={option} value={option}>{option}</MenuItem>
    ) )}
  </Select>
}