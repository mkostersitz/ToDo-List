// Minimal react-native mock for bun test runner
const React = require('react');

const View = ({ children, ...props }) => React.createElement('View', props, children);
const Text = ({ children, ...props }) => React.createElement('Text', props, children);
const TouchableOpacity = ({ children, onPress, ...props }) =>
  React.createElement('TouchableOpacity', { ...props, onClick: onPress }, children);
const StyleSheet = { create: (s) => s, flatten: (s) => s };

module.exports = {
  View, Text, TouchableOpacity, StyleSheet,
  Animated: { Value: class { constructor(v) { this._value = v; } }, timing: () => ({ start: () => {} }) },
  Platform: { OS: 'ios', select: (o) => o.ios ?? o.default },
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
};
