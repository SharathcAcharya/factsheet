import React, { useState, memo } from 'react';
import { Icons } from './icons';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: (format: 'pdf' | 'json' | 'md' | 'txt' | 'scorm') => void;
  projectExists: boolean;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  projectExists,
  onToggleSidebar,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const HeaderButton: React.FC<{ onClick?: () => void; disabled?: boolean; children: React.ReactNode; tooltip: string }> = ({ onClick, disabled, children, tooltip }) => (
    <div className="relative group">
        <button
          onClick={onClick}
          disabled={disabled}
          aria-label={tooltip}
          className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          {children}
        </button>
        <div className="absolute top-full mt-2 -translate-x-1/2 left-1/2 invisible group-hover:visible bg-slate-800 text-white text-xs rounded py-1 px-2 z-10 whitespace-nowrap pointer-events-none">
            {tooltip}
        </div>
    </div>
  );

  return (
    <header className="flex items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
      <button onClick={onToggleSidebar} aria-label="Open sidebar" className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 md:hidden">
          <Icons.menu className="w-6 h-6" />
      </button>
      
      <div className="flex-grow"></div> {/* Spacer to push buttons right */}
      
      <div className="flex items-center gap-2">
        <HeaderButton onClick={onUndo} disabled={!canUndo} tooltip="Undo (Ctrl+Z)">
          <Icons.undo className="w-5 h-5" />
        </HeaderButton>
        <HeaderButton onClick={onRedo} disabled={!canRedo} tooltip="Redo (Ctrl+Y)">
          <Icons.redo className="w-5 h-5" />
        </HeaderButton>
        
        <div className="h-6 border-l border-slate-300 dark:border-slate-600 mx-2"></div>
        
        <div className="relative">
          <HeaderButton
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            disabled={!projectExists}
            tooltip="Export"
          >
            <Icons.download className="w-5 h-5" />
          </HeaderButton>
          {isExportMenuOpen && (
            <div 
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20"
              onMouseLeave={() => setIsExportMenuOpen(false)}
            >
              <button onClick={() => { onExport('pdf'); setIsExportMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                <Icons.file className="w-4 h-4" /> Export as PDF
              </button>
              <button onClick={() => { onExport('md'); setIsExportMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                <Icons.fileText className="w-4 h-4" /> Export as Markdown
              </button>
              <button onClick={() => { onExport('txt'); setIsExportMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                <Icons.fileText className="w-4 h-4" /> Export as TXT
              </button>
               <button onClick={() => { onExport('scorm'); setIsExportMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                <Icons.archive className="w-4 h-4" /> Export as SCORM (ZIP)
              </button>
              <div className="my-1 border-t border-slate-200 dark:border-slate-700"></div>
              <button onClick={() => { onExport('json'); setIsExportMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                <Icons.code className="w-4 h-4" /> Export as JSON
              </button>
            </div>
          )}
        </div>

        <div className="h-6 border-l border-slate-300 dark:border-slate-600 mx-2"></div>
        
        <HeaderButton onClick={onToggleTheme} tooltip={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? <Icons.moon className="w-5 h-5" /> : <Icons.sun className="w-5 h-5" />}
        </HeaderButton>
      </div>
    </header>
  );
};

export default memo(Header);