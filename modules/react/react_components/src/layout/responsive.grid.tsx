import React from 'react';
import Grid from '@mui/material/Grid';
import { LensProps } from "@focuson/state";
import { NameAnd } from "@laoban/utils";

export type ResponsiveSelectableGridProps<S, T> = LensProps<S, string, any> & {
  items: NameAnd<T>
  children: ( name: string, t: T ) => React.ReactElement
}
export function ResponsiveSelectableGrid<S, T> ( { state, items, children }: ResponsiveSelectableGridProps<S, T> ) {
  const keys = Object.keys ( items ).sort ()
  return (
    <Grid container spacing={2}>
      {keys.map ( key => (
        <Grid item xs={12} sm={6} md={3} key={key} onClick={() => state.setJson ( key, '' )}>{children ( key, items[ key ] )}</Grid>
      ) )}
    </Grid>
  );
}