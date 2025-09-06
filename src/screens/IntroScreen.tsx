import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  StatusBar,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const ICON_MAP: { [key: string]: any } = {
  'computer.png': require('../assets/intro-icons/computer.png'),
  'game-controller.png': require('../assets/intro-icons/game-controller.png'),
  'movie.png': require('../assets/intro-icons/movie.png'),
  'payment-method.png': require('../assets/intro-icons/payment-method.png'),
  'security.png': require('../assets/intro-icons/security.png'),
  'speed.png': require('../assets/intro-icons/speed.png'),
  'wifi.png': require('../assets/intro-icons/wifi.png'),
};

const TAGS = [
  { icon: 'movie.png', x: 0.12, y: 0.22 },
  { icon: 'wifi.png', x: 0.68, y: 0.18 },
  { icon: 'computer.png', x: 0.18, y: 0.58 },
  { icon: 'game-controller.png', x: 0.72, y: 0.62 },
  { icon: 'security.png', x: 0.08, y: 0.78 },
  { icon: 'speed.png', x: 0.50, y: 0.76 },
  { icon: 'payment-method.png', x: 0.82, y: 0.42 },
];

const IntroScreen = ({ navigation }: any) => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(TAGS.map(() => new Animated.Value(0))).current;
  const tagPositions = useRef(TAGS.map(() => ({ x: new Animated.Value(0), y: new Animated.Value(0) }))).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimations = () => {
      Animated.sequence([
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: false,
          }),
        ]),
      ]).start();

      TAGS.forEach((_, i) => {
        Animated.timing(tagOpacity[i], {
          toValue: 1,
          duration: 400,
          delay: 200 + i * 100,
          useNativeDriver: false,
        }).start();
      });
    };

    startAnimations();
  }, []);

  useEffect(() => {
    TAGS.forEach((tag, i) => {
      const startRandomMovement = () => {
        const margin = 80;
        const tx = Math.random() * (width - margin * 2) + margin;
        const ty = Math.random() * (height - margin * 2) + margin;
        const dur = Math.round((3500 + Math.random() * 3000) * 1.3);

        Animated.parallel([
          Animated.timing(tagPositions[i].x, {
            toValue: tx,
            duration: dur,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: false,
          }),
          Animated.timing(tagPositions[i].y, {
            toValue: ty,
            duration: dur,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: false,
          }),
          Animated.timing(tagOpacity[i], {
            toValue: 0.7 + Math.random() * 0.3,
            duration: dur / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
        ]).start(() => startRandomMovement());
      };

      tagPositions[i].x.setValue(width * tag.x);
      tagPositions[i].y.setValue(height * tag.y);
      startRandomMovement();
    });
  }, [TAGS, width, height, tagPositions, tagOpacity]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace('Login');
    }, 5000);
    return () => clearTimeout(timeout);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Animated.View style={[styles.background, { opacity: backgroundOpacity }]}>
        <LinearGradient
          colors={['#f8f9fa', '#f8f9fa', '#f8f9fa']}
          style={styles.gradient}
        />
      </Animated.View>



      <View style={styles.logoContainer}>
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../assets/isp_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {TAGS.map((t, i) => (
        <Animated.View
          key={`${t.icon}-${i}`}
          style={[
            styles.tag,
            {
              left: tagPositions[i].x,
              top: tagPositions[i].y,
              opacity: tagOpacity[i],
            },
          ]}
        >
          <View style={styles.tagBackground}>
            <Image source={ICON_MAP[t.icon]} style={styles.tagImage} resizeMode="contain" />
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },

  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 120,
  },
  tag: {
    position: 'absolute',
    zIndex: 5,
  },
  tagBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tagImage: {
    width: 48,
    height: 48,
  },
});

export default IntroScreen;


