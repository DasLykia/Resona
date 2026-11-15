import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  ref?: React.Ref<HTMLButtonElement>; // React 19: forwarded via ...props
}

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-lg font-medium select-none whitespace-nowrap " +
  "transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] active:duration-75 " +
  "disabled:opacity-45 disabled:pointer-events-none " +
  // Hit slop: the clickable area extends a few px past small buttons
  "before:absolute before:-inset-1 before:content-['']";

const variants = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "bg-text/[0.07] text-text hover:bg-text/[0.11]",
  danger: "bg-danger/10 text-danger hover:bg-danger/[0.16]",
  ghost: "text-text-muted hover:text-text hover:bg-text/[0.06]",
  outline: "border border-border-strong text-text hover:bg-text/[0.05]",
};

const sizes = {
  sm: "h-7 px-2.5 text-[13px]",
  md: "h-8 px-3.5 text-[13px]",
  lg: "h-10 px-5 text-sm",
  icon: "h-8 w-8",
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading,
  disabled,
  ...props
}) => (
  <button
    className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    disabled={disabled || isLoading}
    {...props}
  >
    {isLoading && (
      <span className="w-3.5 h-3.5 rounded-full border-[1.5px] border-current border-t-transparent animate-spin" />
    )}
    {children}
  </button>
);
