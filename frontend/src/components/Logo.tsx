import React from 'react';

export function Logo({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <rect width="24" height="24" rx="5" fill="currentColor" />
      <path d="M7 7H15V9.5H7V7Z" fill="#0f0f0f" />
      <path d="M7 11.5H17V14H7V11.5Z" fill="#0f0f0f" />
      <path d="M7 16H12V18.5H7V16Z" fill="#0f0f0f" />
    </svg>
  );
}
