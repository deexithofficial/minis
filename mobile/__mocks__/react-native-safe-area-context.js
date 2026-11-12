// Manual mock for node_modules/react-native-safe-area-context, auto-applied
// by Jest to every require/import of this module in tests (ours and
// @react-navigation/elements', which reads SafeAreaInsetsContext directly).
//
// The real SafeAreaProvider waits for a native onLayout measurement before
// rendering its children, which never fires under react-test-renderer, so
// every screen wrapped in a SafeAreaView would render as empty. This mock
// renders synchronously with fixed, zeroed insets instead.
const React = require('react');
const { View } = require('react-native');

const insets = { top: 0, right: 0, bottom: 0, left: 0 };
const frame = { x: 0, y: 0, width: 320, height: 640 };

const SafeAreaInsetsContext = React.createContext(insets);
const SafeAreaFrameContext = React.createContext(frame);

function SafeAreaProvider({ children, initialMetrics }) {
  const metrics = initialMetrics ?? { insets, frame };
  return React.createElement(
    SafeAreaFrameContext.Provider,
    { value: metrics.frame },
    React.createElement(SafeAreaInsetsContext.Provider, { value: metrics.insets }, children)
  );
}

function SafeAreaView({ children, ...props }) {
  return React.createElement(View, props, children);
}

function useSafeAreaInsets() {
  return React.useContext(SafeAreaInsetsContext);
}

function useSafeAreaFrame() {
  return React.useContext(SafeAreaFrameContext);
}

module.exports = {
  SafeAreaProvider,
  SafeAreaView,
  SafeAreaInsetsContext,
  SafeAreaFrameContext,
  useSafeAreaInsets,
  useSafeAreaFrame,
  initialWindowMetrics: { insets, frame },
};
