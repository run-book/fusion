import React, { useState } from "react";
import { Editor, useMonaco } from "@monaco-editor/react";

import { hasErrors } from "@laoban/utils";
import { yamlWriterToStringWithErrorsEmbedded } from "@itsmworkbench/yaml";

export interface JsonEditorProps {
  json: any
  Suggest: ( setJson: ( json: string ) => void ) => React.ReactNode
  Save: ( json: string | string[] | undefined ) => React.ReactNode | undefined
  onChange: ( json: string|undefined ) => void
  height?: string
}

export function JsonEditor<S> ( {  json, Save, height, Suggest, onChange }: JsonEditorProps ) {
  const [ jsonContent, setJsonContent ] = useState<string | undefined> (JSON.stringify(json||{},null,2) );
  const jsonString = hasErrors ( jsonContent ) ? 'Errors\n' + jsonContent.join ( '\n' ) : jsonContent
  const monaco = useMonaco (); // needed to initialise
  return (<>
      <Editor
        height={height || '300px'}
        language="yaml"
        value={jsonString}
        options={{
          minimap: { enabled: false },
        }}
        onChange={e => {
          onChange ( e )
          setJsonContent ( e );
        }}
      />
      {Suggest ( setJsonContent )}
      {Save ( jsonContent )}
    </>
  )
    ;
}