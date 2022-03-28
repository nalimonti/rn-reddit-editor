import React, {forwardRef} from "react";
import {
  StyleSheet,
  TextInput,
  Text,
  TextInputProps, View, Pressable, Image
} from "react-native";
import {COLORS} from "./constants";
import {Theme} from "./types";

const INPUT_HEIGHT = 40,
  clearDarkIcon = require('./assets/close_dark.png'),
  clearLightIcon = require('./assets/close_light.png');

interface Props extends TextInputProps {
  error?: boolean;
  dirty?: boolean;
  theme?: Theme;
  helperText?: string;
}

const Input = forwardRef<TextInput, Props>(({ theme, error, dirty, helperText, ...inputProps }, ref) => {

  const clearInput = () => !!inputProps.onChangeText ? inputProps.onChangeText('') : undefined

  return (
    <>
      <View style={{ position: 'relative', marginTop: 10 }}>
        <TextInput
          ref={ref}
          style={[
            styles.input,
            theme === 'dark' && { borderBottomColor: COLORS.DARK_DISABLED_TEXT, color: COLORS.DARK_TEXT, backgroundColor: COLORS.DARK_BACKGROUND },
            error && dirty && { borderBottomColor: theme === 'dark' ? COLORS.DARK_ERROR : COLORS.ERROR }
          ]}
          placeholderTextColor={theme === 'dark' ? COLORS.DARK_DISABLED_TEXT : 'gray'}
          { ...inputProps }
        />
        {
          !!(inputProps.value && inputProps.value.length) && (
            <View style={styles.clearIconContainer}>
              <Pressable
                hitSlop={5}
                onPress={clearInput}
                style={({ pressed }) => ({
                  padding: 5,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Image
                  source={theme === 'dark' ? clearDarkIcon : clearLightIcon}
                  style={{ height: 18, width: 18 }}
                  resizeMode="contain"
                />
              </Pressable>
            </View>
          )
        }
      </View>
      {
        !!helperText?.length && (
          <Text style={[
            styles.helperText,
            theme === 'dark' && { color: COLORS.DARK_ERROR }
          ]}>{ helperText }</Text>
        )
      }
    </>
  );
});

const styles = StyleSheet.create({
  clearIconContainer: {
    height: INPUT_HEIGHT,
    width: INPUT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
  },
  helperText: {
    marginTop: 5,
    fontSize: 12,
    color: COLORS.ERROR,
  },
  input: {
    height: INPUT_HEIGHT,
    backgroundColor: COLORS.INPUT_BG,
    padding: 8,
    paddingRight: 40,
    fontSize: 16,
    borderBottomColor: '#bbb',
    borderBottomWidth: 1,
    borderTopRightRadius: 4,
    borderTopLeftRadius: 4,
    color: COLORS.DARK_GRAY,
  },
});

export default Input;
