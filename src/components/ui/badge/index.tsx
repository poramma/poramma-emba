type BadgeVariant = "light" | "solid" | "outline" | "ghost" | "info" | "success" | "secondary";
type BadgeSize = "sm" | "md" | "xs";
type BadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "gray"
  | "blue"
  | "red"
  | "green"
  | "violet"
  | "orange"
  | "dark";

interface BadgeProps {
  onClick?: () => void;
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: BadgeColor;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  onClick,
  variant = "light",
  color = "primary",
  size = "md",
  startIcon,
  endIcon,
  children,
  className,
}) => {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium";

  const sizeStyles = {
    sm: "text-theme-xs",
    md: "text-sm",
    xs: "text-xs"
  };

  const variants = {
    light: {
      primary:
        "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
      success:
        "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
      error:
        "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
      warning:
        "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
      info: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500",
      light: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      dark: "bg-gray-500 text-white dark:bg-white/5 dark:text-white",
      gray: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-500",
      red: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-500",
      green: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-500",
      violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-500",
      orange: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-500",
    },
    outline: {
      primary:
        "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
      success:
        "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
      error:
        "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
      warning:
        "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
      info: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500",
      light: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      dark: "bg-gray-500 text-white dark:bg-white/5 dark:text-white",
      gray: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      blue: "border border-blue-500 text-blue-600 bg-transparent dark:text-blue-400 dark:border-blue-400",
      red: "border border-red-500 text-red-600 bg-transparent dark:text-red-400 dark:border-red-400",
      green: "border border-green-500 text-green-600 bg-transparent dark:text-green-400 dark:border-green-400",
      violet: "border border-violet-500 text-violet-600 bg-transparent dark:text-violet-400 dark:border-violet-400",
      orange: "border border-orange-500 text-orange-600 bg-transparent dark:text-orange-400 dark:border-orange-400",
    },
    solid: {
      primary: "bg-brand-500 text-white dark:text-white",
      success: "bg-success-500 text-white dark:text-white",
      error: "bg-error-500 text-white dark:text-white",
      warning: "bg-warning-500 text-white dark:text-white",
      info: "bg-blue-light-500 text-white dark:text-white",
      light: "bg-gray-400 dark:bg-white/5 text-white dark:text-white/80",
      dark: "bg-gray-700 text-white dark:text-white",
      gray: "bg-gray-400 dark:bg-white/5 text-white dark:text-white/80",
      blue: "bg-blue-500 text-white dark:text-white",
      red: "bg-red-500 text-white dark:text-white",
      green: "bg-green-500 text-white dark:text-white",
      violet: "bg-violet-500 text-white dark:text-white",
      orange: "bg-orange-500 text-white dark:text-white",
    },
    ghost: {
      primary:
        "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
      success:
        "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
      error:
        "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
      warning:
        "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
      info: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500",
      light: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      dark: "bg-gray-500 text-white dark:bg-white/5 dark:text-white",
      gray: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      blue: "bg-transparent text-blue-600 dark:text-blue-400",
      red: "bg-transparent text-red-600 dark:text-red-400",
      green: "bg-transparent text-green-600 dark:text-green-400",
      violet: "bg-transparent text-violet-600 dark:text-violet-400",
      orange: "bg-transparent text-orange-600 dark:text-orange-400",
    },
    info: {
      primary:
        "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
      success:
        "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
      error:
        "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
      warning:
        "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
      info: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500",
      light: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      dark: "bg-gray-500 text-white dark:bg-white/5 dark:text-white",
      gray: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      blue: "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-500",
      red: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-500",
      green: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-500",
      violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-500",
      orange: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-500",
    },
    success:{
      primary:
        "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
      success:
        "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
      error:
        "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
      warning:
        "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
      info: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500",
      light: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      dark: "bg-gray-500 text-white dark:bg-white/5 dark:text-white",
      gray: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-500",
      red: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-500",
      green: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-500",
      violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-500",
      orange: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-500",
    },
    secondary:{
      primary:
        "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
      success:
        "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
      error:
        "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
      warning:
        "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
      info: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500",
      light: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      dark: "bg-gray-500 text-white dark:bg-white/5 dark:text-white",
      gray: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      blue: "bg-gray-100 text-blue-600 dark:bg-white/5 dark:text-blue-400",
      red: "bg-gray-100 text-red-600 dark:bg-white/5 dark:text-red-400",
      green: "bg-gray-100 text-green-600 dark:bg-white/5 dark:text-green-400",
      violet: "bg-gray-100 text-violet-600 dark:bg-white/5 dark:text-violet-400",
      orange: "bg-gray-100 text-orange-600 dark:bg-white/5 dark:text-orange-400",
    }
  };

  const sizeClass = sizeStyles[size];
  const colorStyles = variants[variant][color];

  return (
    <span onClick={onClick} className={`${baseStyles} ${sizeClass} ${colorStyles} ${className}`}>
      {startIcon && <span className="mr-1">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-1">{endIcon}</span>}
    </span>
  );
};

export default Badge;