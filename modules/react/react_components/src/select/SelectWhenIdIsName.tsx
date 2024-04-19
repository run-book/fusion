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

export type SingleSelectProps<S> = LensProps<S, string, any> & {
  name: string
  options: string[]
}
export function SingleSelect<S> ( { name, state, options }: SingleSelectProps<S> ) {
  const selected = state.optJson ()
  return <Select
    value={selected || ''}
    onChange={e => state.setJson ( e.target?.value, 'Selectit' )}
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
  const legalValues = state.optJson1 () || {}
  const selected: NameAnd<string> = state.optJson2 () || {}
  const keys = Object.keys ( legalValues || {} )
  const selectedState = state.state2 ()
  return <>{keys.map ( key => <SingleSelect state={selectedState.focusOn ( key )} name={key} options={legalValues[ key ]}/> )}</>
}