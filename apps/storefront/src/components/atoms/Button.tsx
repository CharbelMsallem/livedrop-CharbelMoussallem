import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'font-bold rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 focus-ring relative overflow-hidden';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary to-secondary text-white hover:from-teal-700 hover:to-cyan-700 shadow-lg hover:shadow-2xl hover:-translate-y-0.5',
    secondary: 'bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-xl',
    outline: 'border-2 border-gray-300 text-gray-700 hover:border-primary hover:text-primary hover:bg-teal-50 hover:shadow-md',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm',
    md: 'px-5 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base',
    lg: 'px-7 py-3.5 text-base sm:px-8 sm:py-4 sm:text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {variant === 'primary' && (
        <span className="absolute inset-0 bg-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      )}
    </button>
  );
}