import React from 'react';
import { Icons } from './icons';

interface GenerationProgressProps {
  message: string;
}

const GenerationProgress: React.FC<GenerationProgressProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700">
        <Icons.loader className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
        <h2 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">Generating Your Course...</h2>
        <p className="mt-2 text-md text-slate-600 dark:text-slate-400 animate-pulse">{message}</p>
      </div>
    </div>
  );
};

export default GenerationProgress;