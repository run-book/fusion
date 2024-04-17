import React from 'react';
import { Button, Toolbar } from "@mui/material";
import { FusionWorkbenchLayout } from "./layout/app.layout";
import { SizingContext } from "./layout/sizing.context";

import { addEventStoreListener, EventStore, eventStore, setEventStoreValue } from "@itsmworkbench/eventstore";
import { FusionState } from "./state/fusion.state";
import { LensProps, lensState } from '@focuson/state';
import { FolderTree } from "./components/folder.tree";
import { mockInputFolders, mockOutputFolders } from "./state/mock.dir.structure";
import { createRoot } from 'react-dom/client';
import { JsonEditor2 } from "./components/editor.json2";
import { TransformButton } from "./buttons/transform.button";
import { SuggestButton } from "./buttons/suggest.button";
import { inputSchema, outputSchema, tx_suggestion } from "./state/suggestions";

const rootElement = document.getElementById ( 'root' );
if ( !rootElement ) throw new Error ( 'Failed to find the root element' );
const root = createRoot ( rootElement );

const container: EventStore<FusionState> = eventStore<FusionState> ()
const setJson = setEventStoreValue ( container );
addEventStoreListener ( container, (( _, s, setJson ) => {
  const state = lensState ( s, setJson, 'state', {} )
  return root.render ( <App state={state}/> );
}) )

function App ( { state }: LensProps<FusionState, FusionState, any> ) {
  const editingState = state.focusOn ( 'editing' )
  const editingJson = editingState.optJson ()
  return (
    <SizingContext.Provider value={{ leftDrawerWidth: '240px', rightDrawerWidth: '240px' }}>
      <FusionWorkbenchLayout
        directoryTreeComponent={<div>
          <FolderTree rootFolder={mockInputFolders} state={editingState.focusOn ( 'input' )}/>
          <FolderTree rootFolder={mockOutputFolders} state={editingState.focusOn ( 'output' )}/>
        </div>}
        inputDataComponent={
          <><JsonEditor2 language='json' height='500px' state={editingState.focusOn ( 'input' )}/></>}
        editorComponent={
          <>
            <JsonEditor2 language='json' validate='off' height='480px' state={editingState.focusOn ( 'transformer' )}/>
            <SuggestButton input={editingJson?.input} suggest={inputSchema} output={editingJson?.output} state={editingState.focusOn ( 'transformer' )}>Suggest Input Schema</SuggestButton>
            <SuggestButton input={editingJson?.input} suggest={tx_suggestion} output={editingJson?.output} state={editingState.focusOn ( 'transformer' )}>Suggest Tx</SuggestButton>
            <SuggestButton input={editingJson?.input} suggest={outputSchema} output={editingJson?.output} state={editingState.focusOn ( 'transformer' )}>Suggest Output Schema</SuggestButton>
            <TransformButton input={editingJson?.input} tx={editingJson?.transformer} state={editingState.focusOn ( 'output' )}>Transform</TransformButton>
          </>}
        outputDataComponent={
          <>
            <JsonEditor2 language='json' height='500px' state={editingState.focusOn ( 'output' )}/>
          </>
        }
        validationErrorsComponent={<div>Validation Errors</div>}/>
    </SizingContext.Provider>)
}

setJson ( {} )
