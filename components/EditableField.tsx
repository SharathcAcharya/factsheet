
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './icons';

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  path: (string|number)[];
  onRefine?: (path: (string|number)[], content: string, type: 'concise' | 'professional' | 'simple') => void;
  className?: string;
  textareaClassName?: string;
  placeholder?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({ value, onSave, path, onRefine, className, textareaClassName, placeholder="Edit..." }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [isHovering, setIsHovering] = useState(false);
  const [isRefineMenuOpen, setIsRefineMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);
  
  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsRefineMenuOpen(false);
        if (isEditing) {
          handleSave();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, wrapperRef, onSave, currentValue]);


  const handleSave = () => {
    if (currentValue.trim() !== value.trim()) {
      onSave(currentValue);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  const handleRefineClick = (type: 'concise' | 'professional' | 'simple') => {
    if (onRefine) {
        onRefine(path, currentValue, type);
    }
    setIsRefineMenuOpen(false);
  };

  const hasValue = value && value.trim().length > 0;

  if (isEditing) {
    return (
      <div ref={wrapperRef} className="relative w-full">
        <textarea
          ref={textareaRef}
          value={currentValue}
          onChange={(e) => {
            setCurrentValue(e.target.value);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${e.target.scrollHeight}px`;
            }
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`w-full p-1 -m-1 bg-primary-50 dark:bg-primary-900/50 border border-primary-300 dark:border-primary-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none overflow-hidden ${textareaClassName || className}`}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`relative rounded-md -m-2 p-2 cursor-text transition-colors duration-200 ${isHovering ? 'bg-gray-100 dark:bg-gray-800' : ''} ${className}`}
      onClick={() => setIsEditing(true)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {setIsHovering(false); setIsRefineMenuOpen(false);}}
    >
      <span className={!hasValue ? 'text-gray-400 italic' : ''}>{hasValue ? value : placeholder}</span>
      {onRefine && isHovering && (
        <div className="absolute top-0 right-0 -mr-2 -mt-2">
            <button
              onClick={(e) => {
                  e.stopPropagation();
                  setIsRefineMenuOpen(!isRefineMenuOpen);
              }}
              aria-label="Refine text with AI"
              className="p-1 bg-white dark:bg-gray-700 rounded-full shadow-md hover:bg-primary-100 dark:hover:bg-primary-800 text-primary-600 dark:text-primary-300"
            >
                <Icons.sparkles className="w-4 h-4" />
            </button>
            {isRefineMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                  <button onClick={(e) => { e.stopPropagation(); handleRefineClick('concise'); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Make Concise</button>
                  <button onClick={(e) => { e.stopPropagation(); handleRefineClick('professional'); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Make Professional</button>
                  <button onClick={(e) => { e.stopPropagation(); handleRefineClick('simple'); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Simplify</button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default EditableField;