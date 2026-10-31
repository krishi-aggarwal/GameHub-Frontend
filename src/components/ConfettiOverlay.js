import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const CONFETTI_COLORS = ['#8B5CF6', '#00F0FF', '#10E775', '#FF2E93', '#FFB800', '#FFFFFF'];
const PIECE_COUNT = 32;

export default function ConfettiOverlay({ active, onFinished }) {
  const pieces = useRef(
    Array.from({ length: PIECE_COUNT }, (_, index) => ({
      id: index,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      left: Math.random() * 95 + '%',
      size: Math.random() * 8 + 8,
      isCircle: index % 3 === 0,
      animY: new Animated.Value(0),
      animRot: new Animated.Value(0),
      animOpacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (!active) return;

    pieces.forEach((p) => {
      p.animY.setValue(0);
      p.animRot.setValue(0);
      p.animOpacity.setValue(1);
    });

    const animations = pieces.map((p, idx) => {
      const delay = (idx % 6) * 40;
      const duration = 1400 + Math.random() * 600;

      return Animated.parallel([
        Animated.timing(p.animY, {
          toValue: 550,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(p.animRot, {
          toValue: Math.random() > 0.5 ? 720 : -720,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(duration * 0.65 + delay),
          Animated.timing(p.animOpacity, {
            toValue: 0,
            duration: duration * 0.35,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start(() => {
      if (onFinished) onFinished();
    });
  }, [active, onFinished, pieces]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {pieces.map((p) => {
        const spin = p.animRot.interpolate({
          inputRange: [-720, 720],
          outputRange: ['-720deg', '720deg'],
        });

        return (
          <Animated.View
            key={p.id}
            style={[
              styles.piece,
              {
                left: p.left,
                width: p.size,
                height: p.isCircle ? p.size : p.size * 1.6,
                borderRadius: p.isCircle ? p.size / 2 : 2,
                backgroundColor: p.color,
                opacity: p.animOpacity,
                transform: [{ translateY: p.animY }, { rotate: spin }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    overflow: 'hidden',
  },
  piece: {
    position: 'absolute',
    top: -30,
  },
});
