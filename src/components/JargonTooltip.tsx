import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AVIATION_GLOSSARY } from '../data/jargon';

interface JargonTooltipProps {
  term: keyof typeof AVIATION_GLOSSARY;
  children?: React.ReactNode;
  align?: 'center' | 'right' | 'left';
}

export const JargonTooltip: React.FC<JargonTooltipProps> = ({ term, children, align = 'center' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number } | null>(null);

  const data = AVIATION_GLOSSARY[term];

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const tooltipWidth = 288; // w-72

    // Horizontal positioning
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    if (align === 'right') {
      left = rect.right - tooltipWidth;
    } else if (align === 'left') {
      left = rect.left;
    }

    // Clamp horizontally to stay within viewport bounds with 12px margin
    left = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, left));

    // Vertical positioning: default to popping upwards (since bottom tray is at the bottom of the screen),
    // but if not enough room on top (e.g. rect.top < 180), pop downwards.
    if (rect.top >= 180) {
      setCoords({
        bottom: window.innerHeight - rect.top + 8,
        left,
      });
    } else {
      setCoords({
        top: rect.bottom + 8,
        left,
      });
    }
  }, [align]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, updatePosition]);

  if (!data) return <>{children}</>;

  return (
    <span className="relative inline-flex items-center gap-1 group">
      {children}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-4 h-4 rounded-full bg-white/[0.08] hover:bg-primary/25 text-outline hover:text-primary border border-white/[0.15] flex items-center justify-center text-[10px] font-mono transition-colors cursor-pointer shrink-0"
        aria-label={`Aviation Glossary: ${data.title}`}
      >
        ?
      </button>

      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={tooltipRef}
            style={{
              position: 'fixed',
              left: `${coords.left}px`,
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="z-[99999] w-72 p-3.5 rounded-xl bg-[#0e1422]/95 border border-primary/40 shadow-[0_12px_40px_rgba(0,0,0,0.9)] text-left pointer-events-auto backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
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
          </div>,
          document.body
        )}
    </span>
  );
};
