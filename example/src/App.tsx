import * as React from 'react';

import {Button, StyleSheet, View} from 'react-native';
import { Editor, serializeQuillContent } from 'rn-reddit-editor';
import {useRef, useState} from "react";

export default function App() {
  const [theme, setTheme] = useState('dark');
  const editor = useRef();
  const [html, setHtml] = useState<string>();

  const _pickImage = async () => {
    await editor?.current?.addImage('https://picsum.photos/200/300');
  }

  const _submit = async () => {
    serializeQuillContent(html);
  }

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <View style={styles.container}>
      <Editor theme={theme} ref={editor} pickImage={_pickImage} setHtml={setHtml} />
      <Button
        color="#841584"
        onPress={toggleTheme}
        title="Toggle Theme"
      />
      <Button
        color="#841584"
        onPress={_submit}
        title="Submit"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
