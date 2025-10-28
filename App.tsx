import React, { useState, useEffect, useCallback, memo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CourseOutline from './components/CourseOutline';
import GenerationProgress from './components/GenerationProgress';
import GeneratorForm from './components/GeneratorForm';
import OutreachModal from './components/OutreachModal';
import useLocalStorage from './hooks/useLocalStorage';
import useHistory from './hooks/useHistory';
import { generateCourseOutline, refineText, generateSpeech, generateLessonContent, generateOutreachDraft } from './services/geminiService';
import { Project, Course, Lesson, Person, Company } from './types';
import { exportToPdf, exportToJson, exportToMarkdown, exportToTxt, exportToScorm } from './utils/export';

export interface CourseGenerationParams {
  topic: string;
  difficulty: string;
  summary: string;
  country: string;
  city: string;
  duration: string;
  skills: string;
  experience: string;
  style: string;
}

const App: React.FC = () => {
  const [projects, setProjects] = useLocalStorage<Project[]>('ai-course-projects', []);
  const [activeProjectId, setActiveProjectId] = useLocalStorage<string | null>('ai-course-active-project', null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('ai-course-theme', 'light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State for outreach modal
  const [isOutreachModalOpen, setIsOutreachModalOpen] = useState(false);
  const [outreachDraft, setOutreachDraft] = useState('');
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [currentRecipient, setCurrentRecipient] = useState<Person | Company | null>(null);

  const {
    state: currentProject,
    setState: setCurrentProject,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory
  } = useHistory<Project | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (activeProjectId) {
      const projectToLoad = projects.find(p => p.id === activeProjectId) || null;
      if (currentProject?.id !== projectToLoad?.id) {
         setCurrentProject(projectToLoad, true);
      }
    } else if (projects.length > 0) {
      setActiveProjectId(projects[0].id);
    } else {
        setCurrentProject(null, true);
    }
  }, [activeProjectId, projects, setCurrentProject]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z') {
          event.preventDefault();
          undo();
        } else if (event.key === 'y') {
          event.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  const handleGenerate = async (params: CourseGenerationParams) => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Generating course outline...');
    try {
      const courseData = await generateCourseOutline(params, (progress) => setLoadingMessage(progress));
      const newProject: Project = {
        id: `proj_${Date.now()}`,
        topic: params.topic,
        course: courseData,
        createdAt: new Date().toISOString(),
      };
      setProjects([newProject, ...projects]);
      setActiveProjectId(newProject.id);
      setCurrentProject(newProject, true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateField = <T extends keyof Course>(field: T, value: Course[T]) => {
    if (!currentProject) return;
    const updatedCourse = { ...currentProject.course, [field]: value };
    const updatedProject = { ...currentProject, course: updatedCourse };
    setCurrentProject(updatedProject);
  };
  
  const handleUpdateNestedField = (path: (string|number)[], value: string) => {
    if (!currentProject) return;
    
    const newCourse = JSON.parse(JSON.stringify(currentProject.course));
    let current: any = newCourse;
    for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    
    const updatedProject = { ...currentProject, course: newCourse };
    setCurrentProject(updatedProject);
  };

  const handleReorderNestedList = (path: (string|number)[], oldIndex: number, newIndex: number) => {
      if (!currentProject) return;
      
      const newCourse = JSON.parse(JSON.stringify(currentProject.course));
      let current: any = newCourse;
      for (let i = 0; i < path.length; i++) {
          current = current[path[i]];
      }

      if (Array.isArray(current) && oldIndex >= 0 && oldIndex < current.length && newIndex >= 0 && newIndex < current.length) {
        const [movedItem] = current.splice(oldIndex, 1);
        current.splice(newIndex, 0, movedItem);
        
        const updatedProject = { ...currentProject, course: newCourse };
        setCurrentProject(updatedProject);
      }
  };

  const autoSave = useCallback(() => {
    if (currentProject) {
      const projectIndex = projects.findIndex(p => p.id === currentProject.id);
      if (projectIndex !== -1) {
        const newProjects = [...projects];
        newProjects[projectIndex] = currentProject;
        setProjects(newProjects);
      }
    }
  }, [currentProject, projects, setProjects]);

  useEffect(() => {
    const timer = setTimeout(() => {
      autoSave();
    }, 3000); // Auto-save every 3 seconds after a change
    return () => clearTimeout(timer);
  }, [currentProject, autoSave]);

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    const project = projects.find(p => p.id === projectId) || null;
    setCurrentProject(project, true); // Clear history for new project
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleDeleteProject = (projectId: string) => {
    const newProjects = projects.filter(p => p.id !== projectId);
    setProjects(newProjects);
    if (activeProjectId === projectId) {
      const newActiveId = newProjects.length > 0 ? newProjects[0].id : null;
      setActiveProjectId(newActiveId);
    }
  };

  const handleCreateNew = () => {
    setActiveProjectId(null);
    setCurrentProject(null, true);
    setIsSidebarOpen(false); // Close sidebar on mobile after creating new
  };
  
  const handleRefine = async (path: (string | number)[], content: string, type: 'concise' | 'professional' | 'simple') => {
    setLoadingMessage(`Refining text to be more ${type}...`);
    setIsLoading(true);
    try {
        const refinedContent = await refineText(content, type);
        handleUpdateNestedField(path, refinedContent);
    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to refine text.');
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleExport = (format: 'pdf' | 'json' | 'md' | 'txt' | 'scorm') => {
    if (!currentProject) return;
    switch (format) {
      case 'pdf': exportToPdf(currentProject.course); break;
      case 'json': exportToJson(currentProject.course); break;
      case 'md': exportToMarkdown(currentProject.course); break;
      case 'txt': exportToTxt(currentProject.course); break;
      case 'scorm': exportToScorm(currentProject.course); break;
    }
  };

  const handleGenerateLessonContent = async (
    path: (string | number)[],
    lesson: Lesson,
    contentType: 'lectureNotes' | 'keyTalkingPoints' | 'quizQuestions'
  ) => {
      if (!currentProject) return;
      const contentTypeFormatted = contentType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      setLoadingMessage(`Generating ${contentTypeFormatted}...`);
      setIsLoading(true);
      try {
          const content = await generateLessonContent(currentProject.course.title, lesson.title, lesson.description, contentType);
          handleUpdateNestedField([...path, contentType], content);
      } catch (err) {
          console.error(err);
          setError(err instanceof Error ? err.message : `Failed to generate ${contentType}.`);
      } finally {
          setIsLoading(false);
      }
  };

  const handleGenerateOutreach = async (recipient: Person | Company, type: 'instructor' | 'lead') => {
    if (!currentProject) return;
    setCurrentRecipient(recipient);
    setIsOutreachModalOpen(true);
    setIsGeneratingOutreach(true);
    setOutreachDraft(''); // Clear previous draft
    try {
        const draft = await generateOutreachDraft(currentProject.course.title, recipient, type);
        setOutreachDraft(draft);
    } catch (err) {
        console.error(err);
        setOutreachDraft('Failed to generate outreach draft. Please try again.');
    } finally {
        setIsGeneratingOutreach(false);
    }
  };
  
  return (
    <div className={`font-sans text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 min-h-screen`}>
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onDeleteProject={handleDeleteProject}
        onCreateNew={handleCreateNew}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col md:ml-72">
        <Header
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          onToggleSidebar={() => setIsSidebarOpen(true)}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onExport={handleExport}
          projectExists={!!currentProject}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {isLoading && <GenerationProgress message={loadingMessage} />}
            {!isLoading && !currentProject && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center max-w-4xl mx-auto">
                  <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500">
                    AI Course & Instructor Finder
                  </h1>
                  <p className="mt-4 text-xl text-slate-600 dark:text-slate-400">
                    Instantly craft detailed, localized training plans and find real instructors with Gemini.
                  </p>
                </div>
                <div className="w-full max-w-4xl mt-10">
                    <GeneratorForm onGenerate={handleGenerate} isLoading={isLoading} />
                    {error && <p className="mt-4 text-center text-red-500">{error}</p>}
                </div>
              </div>
            )}
            {!isLoading && currentProject && (
              <CourseOutline
                project={currentProject}
                onUpdateField={handleUpdateField}
                onUpdateNestedField={handleUpdateNestedField}
                onReorderNestedList={handleReorderNestedList}
                onRefine={handleRefine}
                generateSpeech={generateSpeech}
                onGenerateLessonContent={handleGenerateLessonContent}
                onGenerateOutreach={handleGenerateOutreach}
              />
            )}
        </main>
      </div>
       <OutreachModal
        isOpen={isOutreachModalOpen}
        onClose={() => setIsOutreachModalOpen(false)}
        isLoading={isGeneratingOutreach}
        draftText={outreachDraft}
        recipientName={currentRecipient?.name || ''}
      />
    </div>
  );
};

export default memo(App);