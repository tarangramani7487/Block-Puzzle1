import { Platform, type TextStyle } from 'react-native';

const heavy: TextStyle = {
  fontWeight: '900',
  fontFamily: Platform.select({ ios: 'Avenir Next', android: 'sans-serif-black', default: undefined }),
};

const bold: TextStyle = {
  fontWeight: '800',
  fontFamily: Platform.select({ ios: 'Avenir Next', android: 'sans-serif-condensed', default: undefined }),
};

export const typography = {
  hero: { ...heavy, fontSize: 44, letterSpacing: 1 },
  score: { ...heavy, fontSize: 40, fontVariant: ['tabular-nums'] },
  title: { ...heavy, fontSize: 20, letterSpacing: 2 },
  label: { ...bold, fontSize: 12, letterSpacing: 1.5 },
  body: { fontSize: 15, fontWeight: '500', lineHeight: 21 },
  button: { ...heavy, fontSize: 18, letterSpacing: 1 },
} satisfies Record<string, TextStyle>;
