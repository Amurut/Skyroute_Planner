import React, { useState } from 'react';
import { AVIATION_GLOSSARY } from '../data/jargon';

interface JargonTooltipProps {
  term: keyof typeof AVIATION_GLOSSARY;
  children?: React.ReactNode;
}

export const JargonTooltip: React.FC<JargonTooltipProps> = ({ term, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const data = AVIATION_GLOSSARY[term];

  if (!data) return <>{children}</>;

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
        className="w-4 h-4 rounded-full bg-white/[0.06] hover:bg-primary/20 text-outline hover:text-primary border border-white/[0.1] flex items-center justify-center text-[10px] font-mono transition-colors cursor-help"
        title="Click or hover for beginner explanation"
      >
        ?
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-3 rounded-xl bg-[#0e1422] border border-primary/30 shadow-2xl text-left pointer-events-auto backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/[0.08]">
            <span className="text-xs font-bold text-primary font-mono">{data.title}</span>
            <span className="text-[9px] font-mono text-outline uppercase">{data.term}</span>
          </div>
          <p className="text-[11px] text-on-surface leading-relaxed mb-2">{data.explanation}</p>
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary flex items-start gap-1">
            <span className="shrink-0 text-secondary">💡</span>
            <span>{data.simTip}</span>
          </div>
        </div>
      )}
    </span>
  );
};
