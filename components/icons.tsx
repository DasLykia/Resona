import React from 'react';

// Resona's own small icon set: 16px grid, 1.5px stroke, round caps, so icons match Geist's text weight.
type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

const Svg: React.FC<IconProps> = ({ size = 16, children, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor"
    strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    {children}
  </svg>
);

export const IconClose = (p: IconProps) => <Svg {...p}><path d="M4 4l8 8M12 4l-8 8" /></Svg>;

// The app mark: three bars of a voice waveform
export const IconMark = (p: IconProps) => (
  <Svg {...p}><path d="M4 6v4M8 3.5v9M12 5.5v5" /></Svg>
);
