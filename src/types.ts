import {EditorProps as QuillEditorProps} from "react-native-cn-quill/lib/typescript/editor/quill-editor";

export type Theme = 'dark'|'light';

export interface EditorProps {
  theme?: Theme;
  pickImage: () => void;
  editorProps?: QuillEditorProps;
}

export interface QuillOp {
  insert?: string | { image: string };
  attributes?: {
    header?: string;
    bold?: boolean;
    blockquote?: boolean;
    italic?: boolean;
    strike?: boolean;
    code?: boolean;
    'code-block'?: boolean;
    script?: 'super';
    color?: string;
    background?: string;
    list?: 'ordered'|'bullet';
    link?: string;
  }
}

export interface PostQuillSegment {
  text?: string;
  attributes?: {
    header?: string;
    bold?: boolean;
    blockquote?: boolean;
    italic?: boolean;
    strike?: boolean;
    code?: boolean;
    'code-block'?: boolean;
    script?: 'super';
    color?: string;
    background?: string;
    list?: 'ordered'|'bullet';
    link?: string;
    image?: string;
  }
}

export interface PostJSONSegment {
  e: 'text'|'spoilertext'|'raw'|'link'|'img';
  id?: string;
  t?: string;
  f?: Array<number[]>;
  c?: [ { e: 'text', t: string } ] | string;
  u?: string;
}
