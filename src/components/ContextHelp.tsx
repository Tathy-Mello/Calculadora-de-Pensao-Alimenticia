/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface ContextHelpProps {
  title: string;
  content: string;
  interference?: string;
  impacto?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const ContextHelp: React.FC<ContextHelpProps> = ({
  title,
  content,
  interference,
  impacto,
  side = 'top',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const helpImpact = impacto || interference;

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-slate-400 hover:text-slate-700 focus:outline-hidden p-0.5 rounded cursor-pointer transition-colors"
        aria-label={`Ajuda sobre ${title}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-64 p-3 bg-slate-900 text-white rounded-lg shadow-lg text-[11px] leading-relaxed bottom-full left-1/2 -translate-x-1/2 mb-1.5 pointer-events-none transition-all"
        >
          <div className="font-bold text-emerald-400 mb-1 flex items-center justify-between">
            <span>{title}</span>
          </div>
          <p className="text-slate-200">{content}</p>
          {helpImpact && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-300">
              <strong className="text-slate-100">Impacto no cálculo:</strong> {helpImpact}
            </div>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};
