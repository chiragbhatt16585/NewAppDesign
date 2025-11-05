module.exports = {
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        // Enable iOS autolinking for fonts; Android remains manually configured
        android: null,
      },
    },
  },
  assets: ['./node_modules/react-native-vector-icons/Fonts'],
}; 