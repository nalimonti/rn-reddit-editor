import React, {forwardRef, useImperativeHandle, useMemo, useRef, useState} from "react";
import QuillEditor from 'react-native-cn-quill';
import {EditorProps} from './types';
import {View} from "react-native";
import Toolbar from "./Toolbar";
import LinkModal from "./LinkModal";
import {COLORS} from "./constants";
import {uploadImage} from "./uploadUtils";

const CUSTOM_QUILL_JS = `
const InlineBlot = Quill.import('blots/block');

class ImageBlot extends InlineBlot {
  static create(data) {
    const node = super.create(data);
    node.setAttribute('src', data.url);
    node.setAttribute('data-asset-id', data.assetId);
    node.setAttribute('data-caption'', data.caption);
    node.setAttribute('data-src', data.url);
    return node;
  }
  static value(domNode) {
    const { src, 'asset-id': assetId, caption } = domNode.dataset;
    return { src, assetId, caption };
  }
}

ImageBlot.blotName = 'imageBlot';
ImageBlot.className = 'image-blot';
ImageBlot.tagName = 'img';

Quill.register({ 'formats/imageBlot': ImageBlot });
`;

export interface EditorHandle {
  addImage: (url: string) => Promise<any>;
  getContents: () => Promise<{ contents: any; html?: string }>;
  focus: () => void;
  blur: () => void;
  dangerouslyPasteHTML: (index: number, html: string) => void;
}

const Editor = forwardRef<EditorHandle, EditorProps>((props, ref) => {
  const editor = useRef<QuillEditor>(null);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [insertAt, setInsertAt] = useState<number>();

  useImperativeHandle(ref, () => ({
    addImage,
    getContents,
    focus: focusEditor,
    blur: blurEditor,
    dangerouslyPasteHTML
  }))

  const dangerouslyPasteHTML = (index: number, html: string) => editor?.current?.dangerouslyPasteHTML(index, html);

  const getContents = async () => await editor?.current?.getContents();

  const onAddImagePress = async () => {
    const range = await editor?.current?.getSelection();
    setInsertAt(range?.index ?? 0);
    props.pickImage();
  }

  const addImage = async (url: string) => {
    if (!props.accessToken) throw new Error('Access token required for image upload');
    const assetId = await uploadImage(url, props.accessToken);
    // console.log('asset id', assetId)
    // await editor?.current?.insertEmbed(insertAt || 0, 'image', url);
    await editor?.current?.insertEmbed(insertAt || 0, 'imageBlot', { url, assetId });
    // await editor?.current?.dangerouslyPasteHTML(0, `<img src="${url}" class="foo" data-asset-id="abxcz234">`)
    setInsertAt(undefined);
  }

  const onAddLink = async () => {
    const range = await editor?.current?.getSelection();
    setInsertAt(range?.index ?? 0);
    setLinkModalVisible(true);
  }

  const addLink = async (title: string, url: string) => {
    const idx = typeof insertAt === 'number' ? insertAt : 0,
      text = title?.length ? title : url;
    await editor?.current?.insertText(idx, text, { link: url });
    await editor?.current?.setSelection(idx + text.length, 0);
    editor?.current?.format('link', undefined);
    setInsertAt(undefined);
  }

  const focusEditor = () => editor?.current?.focus();

  const blurEditor = () => editor?.current?.blur();

  const editorTheme = useMemo(() => ({
    // background: props.theme === 'dark' ? COLORS.ELEVATION_ONE : COLORS.INPUT_BG,
    background: 'orange',
    placeholder: props.theme === 'dark' ? COLORS.DARK_SECONDARY_TEXT : COLORS.DARK_GRAY,
    color: props.theme === 'dark' ? COLORS.DARK_TEXT : COLORS.DARK_GRAY,
  }), [ props.theme ])

  const onHtmlChange = ({ html }: { html: string }) => props.setHtml(html);

  return (
    <>
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <View style={{ flex: 1, backgroundColor: 'pink' }}>
          <QuillEditor
            ref={editor}
            style={{ flex: 1 }}
            theme={editorTheme}
            onHtmlChange={onHtmlChange}
            customJS={CUSTOM_QUILL_JS}
            {...(props.editorProps || {})}
          />
        </View>
        <Toolbar
          editor={editor}
          onAddLink={onAddLink}
          focusEditor={focusEditor}
          onAddImagePress={onAddImagePress}
          theme={props.theme}
        />
      </View>
      <LinkModal
        visible={linkModalVisible}
        setVisible={setLinkModalVisible}
        onSave={addLink}
        theme={props.theme}
      />
    </>
  )
})

export default Editor
