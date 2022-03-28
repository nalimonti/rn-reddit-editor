import {EditorProps as QuillEditorProps} from "react-native-cn-quill/lib/typescript/editor/quill-editor";

export type Theme = 'dark'|'light';

export interface EditorProps {
  theme?: Theme;
  pickImage: () => void;
  editorProps?: QuillEditorProps;
  setHtml: (html: string) => void;
}

export interface RichTextJSONSegment {
  e: 'text'|'spoilertext'|'raw'|'link'|'img'|'blockquote'|'par'|'h'|'list'|'li'|'code';
  o?: boolean;
  l?: number;
  id?: string;
  t?: string;
  f?: Array<number[]>;
  c?: RichTextJSONSegment[] | string;
  u?: string;
}
