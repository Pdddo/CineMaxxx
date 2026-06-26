import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility function to merge tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    
    const variants = {
      primary: 'bg-[#FF6900] hover:bg-[#e55e00] text-black shadow-[0_0_15px_rgba(255,105,0,0.5)] hover:shadow-[0_0_25px_rgba(255,105,0,0.8)] border border-[#FF6900]/50 font-bold',
      secondary: 'bg-black/80 hover:bg-black text-white backdrop-blur-md border border-slate-700',
      outline: 'bg-transparent border border-[#FF6900]/50 text-[#FF6900] hover:bg-[#FF6900]/10',
      ghost: 'bg-transparent text-slate-300 hover:text-white hover:bg-black/50',
      danger: 'bg-red-600/90 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-8 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-[#FF6900]/50 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
