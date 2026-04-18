
import React from 'react';

// --- TOAST HELPER ---
export const toast = (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
  console.log(`TOAST [${props.variant || 'default'}]: ${props.title} - ${props.description}`);
  if (props.variant === 'destructive') {
    alert(`${props.title}: ${props.description}`);
  }
};

// --- BUTTONS ---

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon' | 'danger' | 'outline';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  size = 'md',
  className = '', 
  ...props 
}) => {
  const baseStyles = "transition-all duration-200 font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 rounded",
    md: "text-sm px-6 py-3 rounded-md",
    lg: "text-base px-8 py-4 rounded-lg"
  };

  const variants = {
    primary: "bg-gold-500 hover:bg-gold-600 text-white shadow-sm uppercase", 
    secondary: "bg-white border-2 border-gold-500 text-gold-500 hover:bg-gold-50 uppercase", 
    ghost: "text-charcoal-700 hover:text-charcoal-900 hover:bg-gray-200",
    danger: "text-red-600 hover:bg-red-50",
    icon: "p-2 text-charcoal-500 hover:bg-gray-100 rounded-full",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50 text-charcoal-700"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

// --- INPUTS (Soft-Box Style) ---

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  isMonospaced?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ 
  label, 
  error, 
  icon, 
  className = '', 
  isMonospaced = false,
  ...props 
}, ref) => {
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-charcoal-700 mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            {icon}
          </div>
        )}
        <input 
          ref={ref}
          className={`
            w-full bg-white 
            border border-gray-300 rounded-md
            focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:border-2
            outline-none 
            py-2.5 px-3
            text-charcoal-900 placeholder-gray-400 font-medium
            transition-all duration-100
            shadow-sm
            ${icon ? 'pl-9' : ''}
            ${isMonospaced ? 'font-mono' : 'font-sans'}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-red-600 text-xs mt-1 font-bold">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

// --- UNDERLINE INPUT (Legacy support if needed) ---

interface UnderlineInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const UnderlineInput: React.FC<UnderlineInputProps> = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-charcoal-700 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input 
        className={`
          w-full bg-transparent 
          border-b border-gray-300
          focus:border-gold-500
          outline-none 
          py-2 px-0
          text-charcoal-900 placeholder-gray-400
          transition-all duration-200
          font-sans
        `}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => {
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-charcoal-700 mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select 
        className={`
          w-full bg-white 
          border border-gray-300 rounded-md
          focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:border-2
          outline-none 
          py-2.5 px-3
          text-charcoal-900 font-medium
          shadow-sm
          font-sans
          cursor-pointer
        `}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

// --- CARDS ---

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; headerAction?: React.ReactNode }> = ({ 
  children, 
  className = '',
  title,
  headerAction
}) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-card ${className}`}>
      {(title || headerAction) && (
        <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
          {title && <h3 className="font-bold text-charcoal-900 text-sm tracking-wide uppercase">{title}</h3>}
          {headerAction}
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
};

// --- LOGO (BRAND ICON) ---

export const Logo: React.FC<{ className?: string, light?: boolean }> = ({ className = '', light = false }) => (
  <div className={`flex flex-col items-center justify-center ${className}`}>
    <div className="relative flex items-center justify-center w-16 h-16">
        <img src="/logo.png" alt="MJ Logo" className="w-full h-full object-contain" />
    </div>
  </div>
);
