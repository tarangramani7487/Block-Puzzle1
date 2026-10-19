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
  | 'pause'
  | 'coin'
  | 'calendar'
  | 'palette'
  | 'target'
  | 'check'
  | 'lock'
  | 'back'
  | 'flame'
  | 'gift';

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
      {name === 'coin' && (
        <>
          <Circle cx={12} cy={12} r={10} fill={color} />
          <Circle cx={12} cy={12} r={6.8} fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth={1.6} />
          <Path d="M12 8.2v7.6M10 9.8h3a1.6 1.6 0 010 3.2h-2a1.6 1.6 0 000 3.2h3" stroke="rgba(0,0,0,0.3)" strokeWidth={1.4} fill="none" strokeLinecap="round" />
        </>
      )}
      {name === 'calendar' && (
        <>
          <Rect x={3.5} y={5} width={17} height={15.5} rx={3} {...stroke} />
          <Path d="M3.5 10h17M8 3v4M16 3v4" {...stroke} />
          <Rect x={7} y={13} width={3.5} height={3.5} rx={0.8} fill={color} />
        </>
      )}
      {name === 'palette' && (
        <>
          <Path d="M12 3a9 9 0 100 18c1.4 0 2-1 1.4-2.2-.7-1.4.2-2.8 1.8-2.8H18a3 3 0 003-3A9 9 0 0012 3z" {...stroke} />
          <Circle cx={7.5} cy={11} r={1.5} fill={color} />
          <Circle cx={10.5} cy={7} r={1.5} fill={color} />
          <Circle cx={15} cy={7.5} r={1.5} fill={color} />
        </>
      )}
      {name === 'target' && (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Circle cx={12} cy={12} r={5} {...stroke} />
          <Circle cx={12} cy={12} r={1.6} fill={color} />
        </>
      )}
      {name === 'check' && <Path d="M5 12.5l4.5 4.5L19 7.5" {...stroke} strokeWidth={3} />}
      {name === 'lock' && (
        <>
          <Rect x={5} y={10.5} width={14} height={10} rx={2.5} fill={color} />
          <Path d="M8 10.5V8a4 4 0 018 0v2.5" {...stroke} />
        </>
      )}
      {name === 'back' && <Path d="M15 5l-7 7 7 7" {...stroke} strokeWidth={2.8} />}
      {name === 'flame' && (
        <Path d="M12 2.5c.8 3.6 5.5 5.6 5.5 11a5.5 5.5 0 01-11 0c0-2.4 1.2-4 2.5-5.2.2 1.7.9 2.8 2 3.2C10.6 8.4 11 5.2 12 2.5z" fill={color} stroke={color} strokeWidth={1} strokeLinejoin="round" />
      )}
      {name === 'gift' && (
        <>
          <Rect x={3.5} y={8} width={17} height={4.5} rx={1.2} {...stroke} />
          <Path d="M5 12.5V20h14v-7.5M12 8v12M12 8c-1.5-3.5-6-3.5-5 0M12 8c1.5-3.5 6-3.5 5 0" {...stroke} />
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
