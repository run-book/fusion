import React from 'react';
import { hydrate } from 'react-dom';

function App() {
  return (
    <div>
      <h1>The Wizard Of Oz</h1>
    </div>
  );
}

hydrate(<App />, document.getElementById('root'));
