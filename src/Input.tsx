import React, {ForwardedRef, forwardRef} from "react";
import {
  StyleSheet,
  TextInput,
  Text,
  TextInputProps
} from "react-native";
import {COLORS} from "./constants";
import {Theme} from "./types";

interface Props extends TextInputProps {
  error?: boolean;
  dirty?: boolean;
  theme?: Theme;
  helperText?: string;
}

const Input = forwardRef(({ theme, error, dirty, helperText, ...inputProps }: Props, ref: ForwardedRef<TextInput>) => {
  return (
    <>
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
  helperText: {
    marginTop: 5,
    fontSize: 12,
    color: COLORS.ERROR,
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
});

export default Input;
