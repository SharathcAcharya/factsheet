import React, { useState, useEffect } from 'react';
import { Icons } from './icons';

interface OutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  draftText: string;
  recipientName: string;
}

const OutreachModal: React.FC<OutreachModalProps> = ({ isOpen, onClose, isLoading, draftText, recipientName }) => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsCopied(false);
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(draftText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Outreach Draft for {recipientName}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="p-6 min-h-[250px] flex items-center justify-center">
          {isLoading ? (
            <div className="text-center">
              <Icons.loader className="mx-auto h-8 w-8 text-blue-500 animate-spin" />
              <p className="mt-4 text-slate-600 dark:text-slate-400">Generating personalized draft...</p>
            </div>
          ) : (
            <textarea
              readOnly
              value={draftText}
              className="w-full h-64 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          )}
        </div>
        <div className="flex justify-end items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 rounded-b-lg">
          <button 
            onClick={handleCopy} 
            disabled={isLoading || !draftText}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCopied ? <Icons.check className="w-4 h-4" /> : <Icons.copy className="w-4 h-4" />}
            {isCopied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutreachModal;
