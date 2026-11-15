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

// Transport: filled glyphs read better than strokes at small sizes, so these fill with the stroke colour
export const IconPlay = (p: IconProps) => <Svg {...p}><path d="M5 3.5v9l7.5-4.5z" fill="currentColor" /></Svg>;
export const IconPause = (p: IconProps) => <Svg {...p}><path d="M5.25 3.5v9M10.75 3.5v9" strokeWidth={2.25} /></Svg>;
export const IconPrev = (p: IconProps) => <Svg {...p}><path d="M4 3.5v9" /><path d="M12.5 3.5v9L6 8z" fill="currentColor" /></Svg>;
export const IconNext = (p: IconProps) => <Svg {...p}><path d="M12 3.5v9" /><path d="M3.5 3.5v9L10 8z" fill="currentColor" /></Svg>;
export const IconChevronLeft = (p: IconProps) => <Svg {...p}><path d="M10 3.5L5.5 8l4.5 4.5" /></Svg>;
export const IconChevronRight = (p: IconProps) => <Svg {...p}><path d="M6 3.5L10.5 8 6 12.5" /></Svg>;

export const IconGrip = (p: IconProps) => (
  <Svg {...p}><circle cx="6" cy="4" r=".9" fill="currentColor" stroke="none" /><circle cx="10" cy="4" r=".9" fill="currentColor" stroke="none" /><circle cx="6" cy="8" r=".9" fill="currentColor" stroke="none" /><circle cx="10" cy="8" r=".9" fill="currentColor" stroke="none" /><circle cx="6" cy="12" r=".9" fill="currentColor" stroke="none" /><circle cx="10" cy="12" r=".9" fill="currentColor" stroke="none" /></Svg>
);
export const IconSearch = (p: IconProps) => <Svg {...p}><circle cx="7" cy="7" r="4.25" /><path d="M10.25 10.25L13.5 13.5" /></Svg>;

// The app mark: three bars of a voice waveform
export const IconMark = (p: IconProps) => (
  <Svg {...p}><path d="M4 6v4M8 3.5v9M12 5.5v5" /></Svg>
);
