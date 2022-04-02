import React, {RefObject, useMemo, useState} from "react";
import {View, StyleSheet, Image, KeyboardAvoidingView, Platform} from "react-native";
import QuillEditor from "react-native-cn-quill";
import ToolbarButton from "./ToolbarButton";
import {COLORS} from "./constants";
import {Theme} from "./types";

const ThemedIcon = ({ icon, theme }: { icon: string; theme?: Theme }) => {
  return (
    <Image
      source={ICONS[`${icon}_${theme || 'light'}`]}
      resizeMode="contain"
      style={{ flex: 1 }}
    />
  )
}

const MemoizedThemedIcon = React.memo(ThemedIcon);

const VerticalDivider = ({ theme }: { theme?: Theme }) => {
  return (
    <View
      style={{
        marginHorizontal: 5,
        width: 2,
        backgroundColor: theme === 'dark' ? COLORS.DARK_DISABLED_TEXT : COLORS.DARK_GRAY,
        height: '100%'
      }}
    />
  )
}

export const TOOLBAR_HEIGHT = 40;

enum FORMAT {
  BOLD = 'bold',
  ITALIC = 'italic',
  STRIKE = 'strike',
  CODE = 'code',
  CODE_BLOCK = 'code_block',
  BLOCKQUOTE = 'blockquote',
  HEADER = 'header',
  SUPER = 'super',
  LIST = 'list',
  SPOILER = 'spoiler',
}

const STYLES = {
  [FORMAT.SPOILER]: {
    // light: { color: COLORS.DARK_TEXT, background: COLORS.DARK_BACKGROUND },
    light: { color: 'white', background: 'black' },
    // dark: { color: COLORS.DARK_GRAY, background: 'white' },
    dark: { color: 'black', background: 'white' },
  }
}

interface Props {
  editor: RefObject<QuillEditor>;
  onAddLink: () => void;
  focusEditor: () => void;
  onAddImagePress: () => void;
  theme?: Theme;
  visible: boolean;
  allowAddImage: boolean;
}

const ICONS: { [key: string]: any } = {
  bold_light: require('./assets/bold_light.png'),
  bold_dark: require('./assets/bold_dark.png'),
  italic_light: require('./assets/italic_light.png'),
  italic_dark: require('./assets/italic_dark.png'),
  strike_light: require('./assets/strike_light.png'),
  strike_dark: require('./assets/strike_dark.png'),
  code_light: require('./assets/code_light.png'),
  code_dark: require('./assets/code_dark.png'),
  header_light: require('./assets/header_light.png'),
  header_dark: require('./assets/header_dark.png'),
  code_block_light: require('./assets/code_block_light.png'),
  code_block_dark: require('./assets/code_block_dark.png'),
  blockquote_light: require('./assets/blockquote_light.png'),
  blockquote_dark: require('./assets/blockquote_dark.png'),
  super_light: require('./assets/super_light.png'),
  super_dark: require('./assets/super_dark.png'),
  list_light: require('./assets/list_light.png'),
  list_dark: require('./assets/list_dark.png'),
  number_light: require('./assets/number_light.png'),
  number_dark: require('./assets/number_dark.png'),
  eraser_light: require('./assets/eraser_light.png'),
  eraser_dark: require('./assets/eraser_dark.png'),
  link_light: require('./assets/link_light.png'),
  link_dark: require('./assets/link_dark.png'),
  clear_format_light: require('./assets/clear_format_light.png'),
  clear_format_dark: require('./assets/clear_format_dark.png'),
  image_light: require('./assets/image_light.png'),
  image_dark: require('./assets/image_dark.png'),
  spoiler_light: require('./assets/spoiler_light.png'),
  spoiler_dark: require('./assets/spoiler_dark.png'),
}

const Toolbar = (props: Props) => {
  const [activeFormats, setActiveFormats] = useState<Partial<Record<FORMAT, string|boolean>>>({});

  const addFormat = (format: FORMAT, quillValue?: string) => setActiveFormats(prev => ({
    ...(prev || {}),
    [format]: quillValue || true,
  }));

  const removeFormats = (formats: FORMAT[]) => setActiveFormats(prev =>
    (Object.keys(prev) as FORMAT[]).reduce((acc, key: FORMAT) => {
      if (formats.indexOf(key) >= 0) return acc;
      return { ...acc, [key]: prev[key] };
    }, {})
  )

  const formatActive = (format: FORMAT, quillValue?: string) => {
    const { [format]: val } = activeFormats || {};
    if (quillValue) return val === quillValue;
    return !!val;
  }

  const applyOrInsertStyle = async (formats: Record<string, any>, defaultText = '') => {
    const range = await props.editor?.current?.getSelection();
    if (!range || !range.length) {
      const text = await props.editor?.current?.getText();
      props.editor?.current?.insertText(text.length - 1, defaultText, formats);
      await props.editor?.current?.setSelection(text.length - 1, defaultText.length);
      return;
    }
    const selectedText = await props.editor?.current?.getText(range.index, range.length);
    props.editor?.current?.deleteText(range.index, range.length);
    props.editor?.current?.insertText(range.index, selectedText, formats);
  }

  const toggleStyle = (format: FORMAT.SPOILER) => async () => {
    const { [format]: formatStyle } = STYLES,
      themedStyle = formatStyle[props.theme || 'light'];
    if (!(format in activeFormats))
      await applyOrInsertStyle(themedStyle, 'spoiler');
    else
      Object.keys(themedStyle).forEach(x => props.editor?.current?.format(x, undefined))
    toggleFormat(format)();
  }

  const toggleFormat = (format: FORMAT, quillKey?: string, quillValue?: string) => () => {
    if (formatActive(format, quillValue)) {
      removeFormats([ format ]);
      if (quillKey) props.editor?.current?.format(quillKey, false);
      return;
    }
    if ([FORMAT.BOLD, FORMAT.ITALIC, FORMAT.STRIKE].indexOf(format) < 0) {
      const formats = Object.keys(activeFormats) as FORMAT[];
      removeFormats(formats);
    }
    addFormat(format, quillValue);
    if (quillKey) props.editor?.current?.format(quillKey, quillValue || true);
    if ((quillKey === 'code' || quillKey === 'code-block') && props.theme === 'dark') {
      props.editor?.current?.format('color', 'crimson');
      props.editor?.current?.format('background', 'white');
    }
  }

  const erase = async () => {
    const text = await props.editor?.current?.getText();
    props.editor?.current?.deleteText(0, text.length - 1);
  }

  const clearFormat = async () => {
    const range = await props.editor?.current?.getSelection();
    // if text is selected
    if (range && range.length) {
      // re-insert selection with no formatting
      const selectedText = await props.editor?.current?.getText(range.index, range.length);
      props.editor?.current?.deleteText(range.index, range.length);
      props.editor?.current?.insertText(range.index, selectedText, {});
    }
    [ ...Object.values(FORMAT), 'color', 'background' ].map(format => props.editor?.current?.format(format, undefined))
    setActiveFormats({});
  }

  const divider = useMemo(() => (
    <VerticalDivider theme={props.theme} />
  ), [ props.theme ])



  const addSpoiler = async () => {
    // await props.editor?.current?.insertEmbed(0, 'spoiler', 'spoiler!');
    const text = await props.editor?.current?.getText();
    await props.editor?.current?.insertText(text.length - 1, 'spoiler', { spoiler: true });
  }

  return (
    <KeyboardAvoidingView
      onTouchStart={(e) => e.stopPropagation()}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={20}
    >
      {
        props.visible && (
          <View
            style={[
              styles.container,
              props.theme === 'dark' && { backgroundColor: COLORS.DARK_BACKGROUND }
            ]}
          >
            <ToolbarButton
              active={formatActive(FORMAT.BOLD)}
              onPress={() => {
                toggleFormat(FORMAT.BOLD, 'bold')()
              }}
              theme={props.theme}
            >
              <MemoizedThemedIcon icon={FORMAT.BOLD} theme={props.theme} />
            </ToolbarButton>
            <ToolbarButton
              active={formatActive(FORMAT.ITALIC)}
              onPress={toggleFormat(FORMAT.ITALIC, 'italic')}
              theme={props.theme}
            >
              <MemoizedThemedIcon icon={FORMAT.ITALIC} theme={props.theme} />
            </ToolbarButton>
            <ToolbarButton
              active={formatActive(FORMAT.STRIKE)}
              onPress={toggleFormat(FORMAT.STRIKE, 'strike')}
              theme={props.theme}
            >
              <MemoizedThemedIcon icon={FORMAT.STRIKE} theme={props.theme} />
            </ToolbarButton>
            { divider }
            <ToolbarButton
              active={formatActive(FORMAT.CODE)}
              onPress={toggleFormat(FORMAT.CODE, 'code')}
              theme={props.theme}
            >
              <MemoizedThemedIcon icon={FORMAT.CODE} theme={props.theme} />
            </ToolbarButton>
            <ToolbarButton
              active={formatActive(FORMAT.CODE_BLOCK)}
              theme={props.theme}
              onPress={toggleFormat(FORMAT.CODE_BLOCK, 'code-block')}
            >
              <MemoizedThemedIcon icon={FORMAT.CODE_BLOCK} theme={props.theme} />
            </ToolbarButton>
            <ToolbarButton
              active={formatActive(FORMAT.BLOCKQUOTE)}
              theme={props.theme}
              onPress={toggleFormat(FORMAT.BLOCKQUOTE, 'blockquote')}
            >
              <MemoizedThemedIcon icon={FORMAT.BLOCKQUOTE} theme={props.theme} />
            </ToolbarButton>
            { divider }
            <ToolbarButton
              active={formatActive(FORMAT.HEADER)}
              onPress={toggleFormat(FORMAT.HEADER, 'header')}
            >
              <MemoizedThemedIcon icon={FORMAT.HEADER} theme={props.theme} />
            </ToolbarButton>
            <ToolbarButton
              active={formatActive(FORMAT.SUPER)}
              onPress={toggleFormat(FORMAT.SUPER, 'script', 'super')}
            >
              <MemoizedThemedIcon icon={FORMAT.SUPER} theme={props.theme} />
            </ToolbarButton>
            <VerticalDivider />
            <ToolbarButton
              active={formatActive(FORMAT.LIST, 'bullet')}
              onPress={toggleFormat(FORMAT.LIST, 'list', 'bullet')}
            >
              <MemoizedThemedIcon icon={FORMAT.LIST} theme={props.theme} />
            </ToolbarButton>
            <ToolbarButton
              active={formatActive(FORMAT.LIST, 'ordered')}
              onPress={toggleFormat(FORMAT.LIST, 'list', 'ordered')}
            >
              <MemoizedThemedIcon icon="number" theme={props.theme} />
            </ToolbarButton>
            { divider }
            <ToolbarButton onPress={props.onAddLink}>
              <MemoizedThemedIcon icon="link" theme={props.theme} />
            </ToolbarButton>
            {
              props.allowAddImage && (
                <ToolbarButton onPress={props.onAddImagePress}>
                  <MemoizedThemedIcon icon="image" theme={props.theme} />
                </ToolbarButton>
              )
            }
            { divider }
            <ToolbarButton
              active={formatActive(FORMAT.SPOILER)}
              // onPress={toggleStyle(FORMAT.SPOILER)}
              onPress={addSpoiler}
            >
              <MemoizedThemedIcon icon={FORMAT.SPOILER} theme={props.theme} />
            </ToolbarButton>
            <ToolbarButton
              onPress={erase}
            >
              <MemoizedThemedIcon icon="eraser" theme={props.theme} />
            </ToolbarButton>
            <ToolbarButton onPress={clearFormat}>
              <MemoizedThemedIcon icon="clear_format" theme={props.theme} />
            </ToolbarButton>
          </View>
        )
      }
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    height: TOOLBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ddd',
    paddingVertical: 5,
    paddingHorizontal: 5,
  }
})

export default Toolbar
