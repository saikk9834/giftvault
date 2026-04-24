import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AvatarProps {
  name: string;
  uri?: string;
  size?: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getGradientColors(name: string): [string, string] {
  const gradients: [string, string][] = [
    ['#C084FC', '#F472B6'],
    ['#F472B6', '#FB923C'],
    ['#60A5FA', '#C084FC'],
    ['#34D399', '#60A5FA'],
    ['#F59E0B', '#F472B6'],
  ];
  const idx = name.charCodeAt(0) % gradients.length;
  return gradients[idx];
}

export function Avatar({ name, uri, size = 44 }: AvatarProps) {
  const initials = getInitials(name);
  const [c1, c2] = getGradientColors(name);
  const fontSize = size * 0.38;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <LinearGradient
      colors={[c1, c2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#1A1A2E',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
