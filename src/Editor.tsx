import React, {forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState} from "react";
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
    node.setAttribute('data-asset-id', data.assetId || '');
    node.setAttribute('data-caption', data.caption || '');
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
  addImage: (url: string, caption?: string) => Promise<any>;
  getContents: () => Promise<any>;
  focus: () => void;
  blur: () => void;
  dangerouslyPasteHTML: (index: number, html: string) => void;
}

const Editor = forwardRef<EditorHandle, EditorProps>((props, ref) => {
  const editor = useRef<QuillEditor>(null);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [insertAt, setInsertAt] = useState<number>();
  const [focused, setFocused] = useState(false);

  useImperativeHandle(ref, () => ({
    addImage,
    getContents,
    focus: focusEditor,
    blur: blurEditor,
    dangerouslyPasteHTML
  }))

  useEffect(() => {
    if (props.onChangeFocus) props.onChangeFocus(focused);
  }, [ focused ])

  const dangerouslyPasteHTML = (index: number, html: string) => editor?.current?.dangerouslyPasteHTML(index, html);

  const getContents = async () => await editor?.current?.getContents();

  const onAddImagePress = async () => {
    const range = await editor?.current?.getSelection();
    setInsertAt(range?.index ?? 0);
    props.pickImage();
  }

  const addImage = async (url: string, caption?: string) => {
    if (!props.accessToken || !props.accessToken.length) throw new Error('Access token required for image upload');
    const assetId = await uploadImage(url, props.accessToken);
    await editor?.current?.insertEmbed(insertAt || 0, 'imageBlot', { url, assetId, caption });
    setInsertAt(undefined);
    const text = await editor?.current?.getText();
    await editor?.current?.insertText(text.length - 1, '\n');
    await editor?.current?.setSelection(text.length + 1, 0);
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
    background: props.theme === 'dark' ? COLORS.ELEVATION_ONE : COLORS.INPUT_BG,
    placeholder: props.theme === 'dark' ? COLORS.DARK_SECONDARY_TEXT : COLORS.DARK_GRAY,
    color: props.theme === 'dark' ? COLORS.DARK_TEXT : COLORS.DARK_GRAY,
  }), [ props.theme ])

  const onHtmlChange = ({ html }: { html: string }) => props.setHtml(html);

  const onFocus = () => setFocused(true);

  const onBlur = () => setFocused(false);

  return (
    <>
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <View style={{ flex: 1 }}>
          <QuillEditor
            ref={editor}
            style={{ flex: 1 }}
            theme={editorTheme}
            onHtmlChange={onHtmlChange}
            customJS={CUSTOM_QUILL_JS}
            onFocus={onFocus}
            onBlur={onBlur}
            {...(props.editorProps || {})}
          />
        </View>
        <Toolbar
          editor={editor}
          onAddLink={onAddLink}
          focusEditor={focusEditor}
          onAddImagePress={onAddImagePress}
          theme={props.theme}
          visible={focused}
          allowAddImage={!!(props.accessToken && props.accessToken.length)}
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
