import React from 'react';
import { Card, CardContent, Grid, Typography } from '@mui/material';

export interface ResponseCardData {
  title: string;
  component: React.ReactNode;  // This allows any React component to be passed
}

interface CardBodyProps {
  title: string;
  component: React.ReactNode;
}

export const CardBody: React.FC<CardBodyProps> = ( { title, component } ) => (
  <>
    <Typography variant="h5" component="div" gutterBottom>
      {title}
    </Typography>
    {component}
  </>
);


export interface ResponseTwoColumnCardsProps {
  cards: ResponseCardData[];
  singleColumn?: boolean;
}
export const ResponseTwoColumnCards: React.FC<ResponseTwoColumnCardsProps> = ( { cards, singleColumn } ) => {
  const columnSize = singleColumn ? 12 : 6; // Default to 2 columns unless forced to 1
  return (
    <Grid container spacing={2}>
      {cards.map ( ( card, index ) => (
        <Grid item xs={12} sm={12} md={columnSize} key={index}>
          <Card raised  sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%' }}>
              <CardBody title={card.title} component={card.component}/>
            </CardContent>
          </Card>
        </Grid>
      ) )}
    </Grid>
  );
};


