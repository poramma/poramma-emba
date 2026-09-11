import React from "react";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    [key: string]: any;
}

export const Card: React.FC<CardProps> = ({children, className, ...props}) => {
    return (
        <div className={`p-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`} {...props}>
            {children}
        </div>
    )
}
  
export default Card;