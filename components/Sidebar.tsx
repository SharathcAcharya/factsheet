import React, { memo } from 'react';
import { Project } from '../types';
import { Icons } from './icons';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onCreateNew: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onDeleteProject,
  onCreateNew,
  isOpen,
  onClose,
}) => {
  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-4 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <Icons.logo className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">CourseSync</h1>
          </div>
          <button onClick={onClose} className="md:hidden p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
              <Icons.close className="w-6 h-6" />
          </button>
        </div>
        <button
          onClick={onCreateNew}
          className="w-full flex items-center justify-center gap-2 mb-4 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
        >
          <Icons.plus className="w-4 h-4" />
          New Course
        </button>
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-2">My Projects</h2>
        <div className="flex-1 overflow-y-auto -mr-2 pr-2">
          {projects.length > 0 ? (
            <ul>
              {projects.map((project) => (
                <li key={project.id} className="p-1">
                  <button
                    onClick={() => onSelectProject(project.id)}
                    className={`w-full text-left p-2 rounded-md group flex justify-between items-center transition-all duration-200 ${
                      activeProjectId === project.id
                        ? 'bg-blue-50 dark:bg-blue-900/50 border-l-4 border-blue-500'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`flex flex-col ${activeProjectId === project.id ? 'pl-1' : 'pl-2'}`}>
                      <span className={`text-sm font-medium ${
                          activeProjectId === project.id ? 'text-blue-700 dark:text-blue-200' : 'text-slate-700 dark:text-slate-200'
                      }`}>{project.topic}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                      aria-label={`Delete project ${project.topic}`}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1"
                    >
                      <Icons.trash className="w-4 h-4" />
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4 px-4 py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p>No projects yet.</p>
              <p>Generate a new course to get started.</p>
            </div>
          )}
        </div>
      </aside>
      {isOpen && <div onClick={onClose} className="fixed inset-0 bg-black/60 z-30 md:hidden" aria-hidden="true" />}
    </>
  );
};

export default memo(Sidebar);