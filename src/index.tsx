import Editor, { EditorHandle } from "./Editor";
import { htmlToRichTextJSON } from "./contentUtils";
import { setupURLPolyfill } from 'react-native-url-polyfill';

setupURLPolyfill();

export { Editor, EditorHandle, htmlToRichTextJSON };
