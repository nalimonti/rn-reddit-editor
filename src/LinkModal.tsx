import React, {useEffect, useRef, useState} from "react";
import {Modal, StyleSheet, Text, Pressable, View, TextInput, KeyboardAvoidingView, Platform} from "react-native";
import {COLORS} from "./constants";
import {Theme} from "./types";
import Input from "./Input";
import {isValidURL} from "./contentUtils";

interface Props {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  onSave: (title: string, url: string) => void;
  theme?: Theme;
}

const LinkModal = (props: Props) => {
  const titleInput = useRef<TextInput>(null);
  const urlInput = useRef<TextInput>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty && (title.length || url.length)) setDirty(true);
    validateURL();
  }, [ url ])

  useEffect(() => {
    if (props.visible) {
      titleInput?.current?.focus();
      setDirty(false);
    }
    else reset();
  }, [ props.visible ])

  const validateURL = () => {
    let error: string|undefined = undefined;
    if (!!(url && url.length)) error = 'Required field';
    if (!isValidURL(url)) error = 'Invalid URL';
    setErrors(prev => ({
      ...(prev || {}),
      url: error
    }));
  }

  const reset = () => {
    setTitle('');
    setUrl('');
    setErrors({});
  }

  const close = () => props.setVisible(false);

  const save = () => {
    props.onSave(title, url);
    close();
  }

  const invalid = !!Object.values(errors).filter(x => !!x).length;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={props.visible}
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.centeredView}>
          <View
            style={[
              styles.modalView,
              props.theme === 'dark' && { backgroundColor: COLORS.ELEVATION_THREE }
            ]}
          >
            <Input
              value={title}
              onChangeText={setTitle}
              ref={titleInput}
              placeholder="Title"
              returnKeyType="next"
              blurOnSubmit={false}
              selectTextOnFocus={true}
              onSubmitEditing={() => urlInput?.current?.focus()}
              theme={props.theme}
              dirty={dirty}
              error={!!errors.title}
              helperText={!!errors.title && dirty ? errors.title : undefined}
            />
            <Input
              value={url}
              onChangeText={setUrl}
              ref={urlInput}
              placeholder="URL"
              selectTextOnFocus={true}
              returnKeyType="done"
              blurOnSubmit={true}
              theme={props.theme}
              dirty={dirty}
              error={!!errors.url}
              helperText={!!errors.url && dirty ? errors.url : undefined}
              autoCapitalize="none"
              autoComplete="off"
            />
            <View style={styles.actionsRow}>
              <Pressable
                style={({ pressed }) => ({
                  opacity: pressed ? 0.6 : 1,
                })}
                hitSlop={5}
                onPress={close}
              >
                <Text style={{ color: props.theme === 'dark' ? COLORS.DARK_SECONDARY_TEXT : COLORS.DARK_GRAY }}>CANCEL</Text>
              </Pressable>
              <Pressable
                disabled={invalid}
                hitSlop={5}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.6 : 1,
                  backgroundColor: invalid ? '#bbb' : '#0d6efd',
                  ...styles.saveBtn,
                })}
                onPress={save}
              >
                <Text style={{ color: 'white' }}>SAVE</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  helperText: {
    marginTop: 5,
    fontSize: 12,
    color: 'darkred',
  },
  input: {
    backgroundColor: COLORS.INPUT_BG,
    padding: 8,
    marginTop: 10,
    fontSize: 16,
    borderBottomColor: '#bbb',
    borderBottomWidth: 1,
    borderTopRightRadius: 4,
    borderTopLeftRadius: 4,
    color: COLORS.DARK_GRAY,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: 'column',
    width: '80%',
  },
  saveBtn: {
    marginLeft: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {
      height: 2,
      width: 1
    },
    shadowRadius: 0.3
  }
});

export default LinkModal;
