import React, { useEffect } from 'react';
import { View, Text } from 'react-native';

const BiometricAuthScreen = ({ navigation, onAuthSuccess }: any) => {
  useEffect(() => {
    // Immediately proceed to app/home
    if (onAuthSuccess) {
      onAuthSuccess();
    } else if (navigation) {
      navigation.navigate('Home');
    }
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Authentication is disabled.</Text>
    </View>
  );
};

export default BiometricAuthScreen; 