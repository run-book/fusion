import { Button, ButtonProps } from "@mui/material";
import React from "react";

export type HideNavButtonProps = ButtonProps & {
  title: string
  children: React.ReactNode
}
export function HideNavButton ( { title, children, ...rest }: HideNavButtonProps ) {
  const [ hidden, setHidden ] = React.useState ( false )
  return <><Button variant='contained' {...rest} onClick={() => setHidden ( !hidden )}>{title}</Button>{hidden ? null : children}</>
}