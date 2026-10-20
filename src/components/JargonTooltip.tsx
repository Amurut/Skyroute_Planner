import React, { useState } from 'react';
import { AVIATION_GLOSSARY } from '../data/jargon';

interface JargonTooltipProps {
  term: keyof typeof AVIATION_GLOSSARY;
  children?: React.ReactNode;
  align?: 'center' | 'right' | 'left';
}

export const JargonTooltip: React.FC<JargonTooltipProps> = ({ term, children, align = 'center' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const data = AVIATION_GLOSSARY[term];

  if (!data) return <>{children}</>;

  const alignClasses =
    align === 'right'
      ? 'right-0'
      : align === 'left'
      ? 'left-0'
      : 'left-1/2 -translate-x-1/2';

  return (
    <span className="relative inline-flex items-center gap-1 group">
      {children}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="w-4 h-4 rounded-full bg-white/[0.08] hover:bg-primary/25 text-outline hover:text-primary border border-white/[0.15] flex items-center justify-center text-[10px] font-mono transition-colors cursor-pointer"
      >
        ?
      </button>

      {isOpen && (
        <div
          className={`absolute bottom-full ${alignClasses} mb-3 z-[60] w-72 p-3.5 rounded-xl bg-[#0e1422] border border-primary/40 shadow-[0_12px_36px_rgba(0,0,0,0.85)] text-left pointer-events-auto backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/[0.08]">
            <span className="text-xs font-bold text-primary font-mono">{data.title}</span>
            <span className="text-[9px] font-mono text-outline uppercase">{data.term}</span>
          </div>
          <p className="text-[11px] text-on-surface leading-relaxed mb-2.5">{data.explanation}</p>
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/25 text-[10px] font-mono text-primary flex items-start gap-1.5">
            <span className="shrink-0 text-secondary text-xs">💡</span>
            <span className="leading-tight">{data.simTip}</span>
          </div>
        </div>
      )}
    </span>
  );
};
