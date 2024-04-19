import React from "react";
import { MenuItem, Select } from "@mui/material";
import { LensProps, LensProps2 } from "@focuson/state";
import { NameAnd } from "@laoban/utils";

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

export type SingleSelectProps<S> = LensProps2<S, string[], string, any> & {
  name: string
}
export function SingleSelect<S> ( { name, state }: SingleSelectProps<S> ) {
  const options = state.optJson1 () || []
  const selected = state.optJson2 ()
  return <Select
    value={selected || ''}
    onChange={e => state.state2 ().setJson ( e.target?.value, 'Selectit' )}
    aria-label={`Select`}
    displayEmpty
    fullWidth
  > <MenuItem disabled value=""> <em>Please select a {name}</em> </MenuItem>
    {options.map ( ( option ) => (
      <MenuItem key={option} value={option}>{option}</MenuItem>
    ) )}
  </Select>
}

export type MultipleSelectProps<S> = LensProps2<S, NameAnd<string[]>, NameAnd<string>, any>
export function MultipleSelects<S> ( { state }: MultipleSelectProps<S> ) {
  const keys = Object.keys ( state.optJson1 () || {} )
  return <>{keys.map ( key => <SingleSelect state={state.focus1On ( key ).focus2On ( key )} name={key}/> )}</>
}