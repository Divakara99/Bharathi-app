const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for React Native Reanimated
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-reanimated': require.resolve('react-native-reanimated'),
};

module.exports = config; 