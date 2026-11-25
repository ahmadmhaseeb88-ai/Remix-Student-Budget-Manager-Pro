import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', iconOnly = false }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Modern Vault + Growth Pulse Fintech Emblem */}
      <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-900 text-white shadow-md shadow-emerald-500/20 ring-1 ring-white/20 shrink-0">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
        >
          {/* Outer Shield / Vault Frame */}
          <path
            d="M16 3L27 7V15C27 21.6 22.3 27.7 16 29C9.7 27.7 5 21.6 5 15V7L16 3Z"
            fill="white"
            fillOpacity="0.15"
            stroke="white"
            strokeWidth="1.5"
          />
          {/* Currency / Growth Pulse Wave */}
          <path
            d="M9 17L13 13L17 17L23 10"
            stroke="#34D399"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="23" cy="10" r="2" fill="#FBBF24" />
          <path
            d="M12 21H20"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
              Paisa<span className="text-emerald-600">Track</span>
            </span>
            <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              AI
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
              PRO
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 hidden sm:block">
            سمارٹ مالیاتی مینیجر · Smart Money OS
          </span>
        </div>
      )}
    </div>
  );
};
