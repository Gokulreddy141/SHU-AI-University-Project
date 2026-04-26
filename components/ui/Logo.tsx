import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Outer Glow / Shield */}
            <path
                d="M50 5C25 5 10 20 10 40C10 70 40 90 50 95C60 90 90 70 90 40C90 20 75 5 50 5Z"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary/20"
                fill="currentColor"
            />

            {/* Aperture / Eye Outer Ring */}
            <circle
                cx="50"
                cy="45"
                r="22"
                stroke="currentColor"
                strokeWidth="6"
                className="text-primary/50"
                fill="transparent"
            />

            {/* Inner Lens / Iris */}
            <circle
                cx="50"
                cy="45"
                r="10"
                fill="currentColor"
                className="text-primary drop-shadow-[0_0_8px_rgba(230,126,92,0.8)]"
            />

            {/* Decorative Tech Nodes */}
            <circle cx="50" cy="15" r="3" className="text-primary-light" fill="currentColor" />
            <circle cx="20" cy="40" r="3" className="text-primary-light" fill="currentColor" />
            <circle cx="80" cy="40" r="3" className="text-primary-light" fill="currentColor" />
        </svg>
    );
};
