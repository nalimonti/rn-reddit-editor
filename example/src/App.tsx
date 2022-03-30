import * as React from 'react';
import {Button, StyleSheet, View, SafeAreaView, StatusBar, ActivityIndicator} from 'react-native';
import { Editor, EditorHandle, htmlToRichTextJSON } from 'rn-reddit-editor';
import {useRef, useState} from "react";

export default function App() {
  const [theme, setTheme] = useState('light');
  const editor = useRef<EditorHandle>();
  const [html, setHtml] = useState<string>();
  const [loading, setLoading] = useState(false);

  const _pickImage = async () => {
    try {
      setLoading(true);
      await editor?.current?.addImage('http://rayleehomes.com/wp-content/uploads/2020/09/Raylee_DreamHome_Images2.jpg', 'My awesome caption!');
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
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
      />
      <View style={{ flex: 1, position: 'relative' }}>
        <Editor
          theme={theme}
          ref={editor}
          pickImage={_pickImage}
          setHtml={setHtml}
          accessToken={''}
        />
        {
          loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="blue" />
            </View>
          )
        }
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
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
