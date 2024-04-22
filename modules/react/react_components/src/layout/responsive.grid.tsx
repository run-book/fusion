import React from 'react';
import Grid from '@mui/material/Grid';
import { LensProps, LensState } from "@focuson/state";
import { NameAnd } from "@laoban/utils";

export type ResponsiveSelectableGridProps<S, T> = {
  state?: LensState<S, string, any>;
  items: NameAnd<T>
  children: ( name: string, t: T ) => React.ReactElement
}
export function ResponsiveSelectableGridSize4<S, T> ( { state, items, children }: ResponsiveSelectableGridProps<S, T> ) {
  const keys = Object.keys ( items ).sort ()
  return (
    <Grid container spacing={2}>
      {keys.map ( key => (
        <Grid item xs={12} sm={6} md={3} key={key} onClick={() => state?.setJson ( key, '' )}>{children ( key, items[ key ] )}</Grid>
      ) )}
    </Grid>
  );
}
export function ResponsiveSelectableGridSize2<S, T> ( { state, items, children }: ResponsiveSelectableGridProps<S, T> ) {
  const keys = Object.keys ( items ).sort ()
  return (
    <Grid container spacing={2}>
      {keys.map ( key => (
        <Grid item xs={12} sm={6} md={6} key={key} onClick={() => state?.setJson ( key, '' )}>{children ( key, items[ key ] )}</Grid>
      ) )}
    </Grid>
  );
}