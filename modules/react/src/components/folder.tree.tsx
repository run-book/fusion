import React from 'react';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ErrorIcon from '@mui/icons-material/Error';
import { flatMap } from "@laoban/utils";
import { SvgIconComponent } from "@mui/icons-material";
import { LensProps } from "@focuson/state";

export type AFile = {
  id: string;
  label: string;
  contents: any
  contentType: 'json' | 'string'
  errors: string[]
};

export type AFolder = {
  id: string;
  label: string;
  children: FileOrFolder[]
};
export function isFolder ( item: FileOrFolder ): item is AFolder {
  return 'children' in item
}

export type FileOrFolder = AFile | AFolder;

export function allIdsForItem ( item: FileOrFolder ): string[] {
  if ( isFolder ( item ) ) {
    return [ item.id, ...flatMap ( item.children, allIdsForItem ) ]
  } else {
    return [ item.id ]
  }
}
export function allIds ( items: FileOrFolder[] ): string[] {
  return flatMap ( items, allIdsForItem )

}
const getIconForItem = ( item: FileOrFolder ): React.ReactElement<SvgIconComponent> => {
  if ( isFolder ( item ) ) {
    // This is a folder
    return <FolderIcon/>;
  } else {
    // This is a file; check for errors
    if ( item.errors.length > 0 ) {
      return <ErrorIcon color="error"/>;
    } else {
      return <InsertDriveFileIcon/>;
    }
  }
};

function findItemWithId ( items: FileOrFolder[], id: string ): FileOrFolder | undefined {
  for ( let item of items ) {
    if ( item.id === id ) {
      return item
    }
    if ( isFolder ( item ) ) {
      let found = findItemWithId ( item.children, id )
      if ( found ) {
        return found
      }
    }
  }
  return undefined

}
interface FolderTreeProps<S> extends LensProps<S, string, any> {
  rootFolder: FileOrFolder[];
}

export function FolderTree<S> ( { rootFolder, state }: FolderTreeProps<S> ) {
  return <RichTreeView items={rootFolder}
                       onSelectedItemsChange={(( event, itemId ) => {
                         console.log ( 'Selected item:', itemId )
                         if ( itemId ) {
                           const item = findItemWithId ( rootFolder, itemId )
                           if ( item && !isFolder ( item ) ) {
                             console.log ( 'Selected item:', item )
                             if ( item.contentType === 'json' )
                               state.setJson ( JSON.stringify ( item.contents, null, 2 ), '' )
                             else
                               state.setJson ( item.contents, '' )
                           }
                         }
                       })}
                       defaultExpandedItems={allIds ( rootFolder )}/>
}