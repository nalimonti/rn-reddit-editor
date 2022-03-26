import React, {useRef} from "react";
import {PressableProps, StyleSheet, Animated} from "react-native";
import {Pressable} from "react-native";

const ICON_SIZE = 30;

interface Props extends PressableProps {
  active?: boolean;
  theme?: 'dark'|'light';
}

const ToolbarButton = (props: Props) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.parallel([
    Animated.spring(scale, { toValue: 1.2, useNativeDriver: true }),
    Animated.timing(opacity, { toValue: 0.7, useNativeDriver: true, duration: 100 })
  ]).start();

  const onPressOut = () => Animated.parallel([
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    Animated.timing(opacity, { toValue: 1, useNativeDriver: true, duration: 100 })
  ]).start();

  return (
    <Pressable
      hitSlop={props.hitSlop || 1}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={props.onPress}
      style={styles.pressable}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [ { scale } ],
            opacity,
            ...(props.active ? { backgroundColor: props.theme === 'dark' ? 'rgba(255,255,255,0.04)' : '#aaa' } : {})
          }
        ]}
      >
        { props.children }
      </Animated.View>
    </Pressable>
  )
}


const styles = StyleSheet.create({
  pressable: {
    height: ICON_SIZE,
    width: ICON_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    padding: 4,
    borderRadius: 3,
  }
})

export default ToolbarButton
