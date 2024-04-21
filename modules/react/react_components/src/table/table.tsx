import { LensProps } from "@focuson/state";
import { Paper, Table, TableCell, TableBody, TableHead, TableRow, TableContainer } from "@mui/material";
import React from "react";

export type DataTableProps = {
  cols: string[],
  rows: React.ReactNode[][]
  noData?: React.ReactNode
}

export function DataTable ( { cols, rows, noData }: DataTableProps ) {
  const dataRowSx={
    '&:nth-of-type(odd)': { backgroundColor: '#f5f5f5' },
    '&:nth-of-type(even)': { backgroundColor: '#e0e0e0' },
  }
  return <TableContainer component={Paper}>
    <Table size="small">
      <TableHead>
        <TableRow sx={{
          '& > th': {
            backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold'
          }
        }}>{cols.map ( ( col, index ) => <TableCell key={index}>{col}</TableCell> )}</TableRow>
      </TableHead>
      <TableBody>
        {rows.map ( ( row, index ) => (
          <TableRow
            key={index}
            sx={dataRowSx}
          >{row.map ( ( cell, index ) => <TableCell key={index}>{cell}</TableCell> )}
          </TableRow>
        ) )}
        {rows.length === 0 && noData && <TableRow sx={dataRowSx}><TableCell colSpan={100}>{noData}</TableCell></TableRow>}

      </TableBody>
    </Table>
  </TableContainer>

}