import React from 'react';
import {Image, Platform, StyleSheet, Text, View} from 'react-native';

interface LogoImageProps {
  style?: any;
  width?: number;
  height?: number;
}

const LogoImage: React.FC<LogoImageProps> = ({style, width = 120, height = 40}) => {
  const getImageSource = () => {
    if (Platform.OS === 'android') {
      return require('../../android/app/src/main/res/drawable/isp_logo.png');
    } else {
      return require('../../ios/ISPApp/isp_logo.png');
    }
  };

  return (
    <View style={[{width, height}, style]}>
      <Image
        source={getImageSource()}
        style={{
          width: '100%',
          height: '100%',
          resizeMode: 'contain',
        }}
        onError={() => {
          console.log('Failed to load logo image');
        }}
      />
    </View>
  );
};

export default LogoImage; 