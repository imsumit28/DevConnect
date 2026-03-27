import React from 'react';
import { Link } from 'react-router-dom';

const sizeMap = {
  small: { height: 'h-6', wrapper: 'gap-1' },
  medium: { height: 'h-9 sm:h-8', wrapper: 'gap-1.5' },
  large: { height: 'h-10', wrapper: 'gap-2' },
  xlarge: { height: 'h-12 sm:h-14', wrapper: 'gap-2.5' },
};

const Logo = ({ size = 'medium', clickable = true, className = '', hover = true }) => {
  const { height, wrapper } = sizeMap[size] || sizeMap.medium;

  const content = (
    <div className={`flex items-center ${wrapper} ${className}`}>
      <img
        src="/assets/devconnect-logo.png"
        alt="DevConnect"
        className={`${height} w-auto object-contain`}
        draggable={false}
      />
    </div>
  );

  if (clickable) {
    return (
      <Link
        to="/"
        className={`inline-flex focus:outline-none transition-all duration-200 ${hover ? 'hover:opacity-95 hover:-translate-y-0.5' : ''}`}
        aria-label="DevConnect Home"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
