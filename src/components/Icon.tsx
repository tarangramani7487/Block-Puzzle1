import { memo } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'gear'
  | 'sound-on'
  | 'sound-off'
  | 'vibrate'
  | 'undo'
  | 'restart'
  | 'home'
  | 'crown'
  | 'play'
  | 'close'
  | 'help'
  | 'trophy'
  | 'pause';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
}

/** Gear outline generated from polar coordinates (8 teeth). */
const GEAR_PATH = (() => {
  const teeth = 8;
  const outer = 10.2;
  const inner = 7.6;
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const w = (Math.PI * 2) / teeth;
    const angles: [number, number][] = [
      [a - w * 0.5, inner],
      [a - w * 0.22, inner],
      [a - w * 0.15, outer],
      [a + w * 0.15, outer],
      [a + w * 0.22, inner],
    ];
    for (const [ang, r] of angles) pts.push(`${(12 + r * Math.cos(ang)).toFixed(2)} ${(12 + r * Math.sin(ang)).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
})();

export const Icon = memo(function Icon({ name, size = 24, color = '#fff' }: Props) {
  const stroke = { stroke: color, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'gear' && (
        <>
          <Path d={GEAR_PATH} {...stroke} />
          <Circle cx={12} cy={12} r={3} {...stroke} />
        </>
      )}
      {(name === 'sound-on' || name === 'sound-off') && <Path d="M4 9h4l5-4v14l-5-4H4z" {...stroke} fill={color} />}
      {name === 'sound-on' && <Path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" {...stroke} />}
      {name === 'sound-off' && <Path d="M17 9.5l5 5M22 9.5l-5 5" {...stroke} />}
      {name === 'vibrate' && (
        <>
          <Rect x={8} y={4} width={8} height={16} rx={2} {...stroke} />
          <Path d="M4.5 8v8M19.5 8v8M1.5 10.5v3M22.5 10.5v3" {...stroke} />
        </>
      )}
      {name === 'undo' && <Path d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H11" {...stroke} />}
      {name === 'restart' && <Path d="M20.5 13a8.5 8.5 0 11-2.5-6.5M20.5 3.5v5h-5" {...stroke} />}
      {name === 'home' && <Path d="M3 11l9-8 9 8M5.5 9.5V20h4.5v-6h4v6h4.5V9.5" {...stroke} />}
      {name === 'crown' && <Path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill={color} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />}
      {name === 'play' && <Path d="M8 5v14l11-7z" fill={color} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...stroke} />}
      {name === 'trophy' && (
        <>
          <Path d="M7 3h10v6a5 5 0 01-10 0z" fill={color} />
          <Path d="M7 5H3.5a3.5 3.5 0 003.8 4M17 5h3.5a3.5 3.5 0 01-3.8 4" {...stroke} />
          <Path d="M12 14v4M8 21h8l-1-3H9z" {...stroke} fill={color} />
        </>
      )}
      {name === 'pause' && (
        <>
          <Rect x={6} y={4} width={4} height={16} rx={1.2} fill={color} />
          <Rect x={14} y={4} width={4} height={16} rx={1.2} fill={color} />
        </>
      )}
      {name === 'help' && (
        <>
          <Circle cx={12} cy={12} r={9.5} {...stroke} />
          <Path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.8-2.5 2-2.5 4" {...stroke} />
          <Circle cx={12} cy={17.2} r={1.2} fill={color} />
        </>
      )}
    </Svg>
  );
});
