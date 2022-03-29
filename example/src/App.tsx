import * as React from 'react';
import {Button, StyleSheet, View, ActivityIndicator, StatusBar, SafeAreaView} from 'react-native';
import { Editor, EditorHandle, htmlToRichTextJSON } from 'rn-reddit-editor';
import {useEffect, useRef, useState} from "react";

export default function App() {
  const [theme, setTheme] = useState('light');
  const editor = useRef<EditorHandle>();
  const [html, setHtml] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('editor', editor.current)
    if (editor.current) setTimeout(() => editor?.current?.focus(), 1000)
  }, [ editor ])

  const _pickImage = async () => {
    // await editor?.current?.addImage('https://picsum.photos/200/300');
    try {
      setLoading(true);
      await editor?.current?.addImage('http://rayleehomes.com/wp-content/uploads/2020/09/Raylee_DreamHome_Images2.jpg');
      setLoading(false);
    }
    catch (e) {
      setLoading(false);
    }
  }

  const _submit = async () => {
    console.log(htmlToRichTextJSON(html));
  }

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        animated={true}
        barStyle="dark-content"
      />
      <View style={{ flex: 1 }}>
        <Editor
          theme={theme}
          ref={editor}
          pickImage={_pickImage}
          setHtml={setHtml}
          accessToken="152403989466-qkwEoeHZmX6H-M847oQhhBwm9SDHtg"
        />
      </View>
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
    </SafeAreaView>
  )

  return (
    <View style={styles.container}>
      <View style={{ flex: 1, backgroundColor: 'red' }}>
        <Editor
          theme={theme}
          ref={editor}
          pickImage={_pickImage}
          setHtml={setHtml}
          accessToken="152403989466-qkwEoeHZmX6H-M847oQhhBwm9SDHtg"
        />
      </View>
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
      {/*{*/}
      {/*  loading && (*/}
      {/*    <View style={styles.loadingOverlay}>*/}
      {/*      <ActivityIndicator size="large" />*/}
      {/*    </View>*/}
      {/*  )*/}
      {/*}*/}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
