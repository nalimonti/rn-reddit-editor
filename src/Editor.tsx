import React, {forwardRef, useImperativeHandle, useMemo, useRef, useState} from "react";
import QuillEditor from 'react-native-cn-quill';
import {EditorProps} from './types';
import {View} from "react-native";
import Toolbar from "./Toolbar";
import LinkModal from "./LinkModal";
import {COLORS} from "./constants";

export interface EditorHandle {
  addImage: (url: string) => Promise<any>;
  getContents: () => Promise<string>;
  focus: () => void;
  blur: () => void;
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
  }))

  const getContents = async () => await editor?.current?.getContents();

  const onAddImagePress = async () => {
    const range = await editor?.current?.getSelection();
    setInsertAt(range?.index ?? 0);
    props.pickImage();
  }

  const addImage = async (url: string) => {
    await editor?.current?.insertEmbed(insertAt || 0, 'image', url);
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
    background: props.theme === 'dark' ? COLORS.ELEVATION_ONE : COLORS.INPUT_BG,
    placeholder: props.theme === 'dark' ? COLORS.DARK_SECONDARY_TEXT : COLORS.DARK_GRAY,
    color: props.theme === 'dark' ? COLORS.DARK_TEXT : COLORS.DARK_GRAY,
  }), [ props.theme ])

  return (
    <>
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <View style={{ flex: 1 }}>
          <QuillEditor
            ref={editor}
            style={{ flex: 1 }}
            theme={editorTheme}
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
