import React, { useState, memo } from 'react';
import { Project, Lesson, Module, CurriculumDay } from '../types';
import EditableField from './EditableField';

interface MindMapViewProps {
  project: Project;
  onUpdateNestedField: (path: (string | number)[], value: string) => void;
  onReorderNestedList: (path: (string | number)[], oldIndex: number, newIndex: number) => void;
  onRefine: (path: (string | number)[], content: string, type: 'concise' | 'professional' | 'simple') => void;
}

const MindMapView: React.FC<MindMapViewProps> = ({ project, ...props }) => {
  const { course } = project;

  return (
    <div id="course-content-mindmap" className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg min-w-full overflow-x-auto space-y-4">
       <div className="md:hidden text-center text-sm p-3 bg-blue-50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-lg border border-blue-200 dark:border-blue-800">
          <p><strong>Pro Tip:</strong> For the best mind map experience, rotate your device to landscape mode or use a larger screen.</p>
      </div>
      <div className="flex items-start gap-8">
        {/* Course Title Node */}
        <div className="flex-shrink-0">
            <Node type="course" title={course.title} path={['title']} onUpdate={props.onUpdateNestedField} onRefine={props.onRefine} />
        </div>
        
        {/* Days Column */}
        <div className="flex flex-col gap-16">
          {course.curriculum.map((day, dayIndex) => (
            <div key={day.day} className="flex items-start gap-8 relative">
                {/* Connecting Line from Course to Day */}
                <div className="absolute top-1/2 -left-8 h-px w-8 bg-slate-400 dark:bg-slate-600"></div>
              
                <div className="flex-shrink-0">
                    <Node type="day" title={`Day ${day.day}: ${day.title}`} path={['curriculum', dayIndex, 'title']} onUpdate={props.onUpdateNestedField} onRefine={props.onRefine} />
                </div>
              
                {/* Modules Column */}
                <div className="flex flex-col gap-8">
                {day.modules.map((module, modIndex) => (
                    <div key={modIndex} className="flex items-start gap-8 relative">
                        {/* Connecting Line from Day to Module */}
                        <div className="absolute top-1/2 -left-8 h-px w-8 bg-slate-400 dark:bg-slate-600"></div>
                        <div className="flex-shrink-0">
                            <Node type="module" title={module.title} path={['curriculum', dayIndex, 'modules', modIndex, 'title']} onUpdate={props.onUpdateNestedField} onRefine={props.onRefine} />
                        </div>
                        
                        {/* Lessons Column */}
                        <LessonColumn
                            lessons={module.lessons}
                            modulePath={['curriculum', dayIndex, 'modules', modIndex]}
                            {...props}
                        />
                    </div>
                ))}
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface NodeProps {
    type: 'course' | 'day' | 'module' | 'lesson';
    title: string;
    description?: string;
    path: (string | number)[];
    onUpdate: (path: (string | number)[], value: string) => void;
    onRefine: MindMapViewProps['onRefine'];
}

const Node: React.FC<NodeProps & { children?: React.ReactNode, draggableProps?: any }> = memo(({ type, title, description, path, onUpdate, onRefine, children, draggableProps }) => {
    const nodeStyles = {
        course: "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl",
        day: "bg-blue-100 dark:bg-blue-900 border-2 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 shadow-lg",
        module: "bg-purple-100 dark:bg-purple-900 border-2 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200 shadow-md",
        lesson: "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm"
    };
    
    const titleStyles = {
        course: "text-xl font-bold",
        day: "text-lg font-bold",
        module: "font-semibold",
        lesson: "font-medium"
    };

    return (
        <div 
            className={`p-4 rounded-lg w-64 flex-shrink-0 transition-all ${nodeStyles[type]} ${draggableProps ? 'cursor-grab' : ''}`}
            {...draggableProps}
        >
            <EditableField
                value={title}
                onSave={(val) => onUpdate(path, val)}
                path={path}
                onRefine={onRefine}
                className={titleStyles[type]}
                textareaClassName={titleStyles[type]}
            />
            {description && (
                 <EditableField
                    value={description}
                    onSave={(val) => onUpdate([...path, 'description'], val)}
                    path={[...path, 'description']}
                    onRefine={onRefine}
                    className="text-sm text-slate-600 dark:text-slate-400 mt-1"
                    textareaClassName="text-sm"
                />
            )}
            {children}
        </div>
    );
});

interface LessonColumnProps extends Omit<MindMapViewProps, 'project'> {
    lessons: Lesson[];
    modulePath: (string | number)[];
}

const LessonColumn: React.FC<LessonColumnProps> = memo(({ lessons, modulePath, onUpdateNestedField, onReorderNestedList, onRefine }) => {
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({
            index,
            path: [...modulePath, 'lessons']
        }));
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };
    
    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
        e.preventDefault();
        setDragOverIndex(null);
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            const { index: dragIndex, path: dragPath } = data;
            const currentPathStr = JSON.stringify([...modulePath, 'lessons']);

            if (JSON.stringify(dragPath) === currentPathStr && dragIndex !== dropIndex) {
                onReorderNestedList(dragPath, dragIndex, dropIndex);
            }
        } catch (error) {
            console.error("Error parsing drag data:", error);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {lessons.map((lesson, lessonIndex) => (
                <div key={lessonIndex} className="relative"
                    onDragOver={(e) => handleDragOver(e, lessonIndex)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, lessonIndex)}
                >
                    {/* Connecting line from Module to Lesson */}
                    <div className="absolute top-1/2 -left-8 h-px w-8 bg-slate-400 dark:bg-slate-600"></div>
                    
                    {/* Drop indicator */}
                    {dragOverIndex === lessonIndex && <div className="absolute -top-2 left-0 w-full h-1 bg-blue-500 rounded-full"></div>}

                    <Node
                        type="lesson"
                        title={lesson.title}
                        description={lesson.description}
                        path={[...modulePath, 'lessons', lessonIndex, 'title']}
                        onUpdate={(path, val) => onUpdateNestedField(path.slice(0, -1), val)}
                        onRefine={onRefine}
                        draggableProps={{
                            draggable: true,
                            onDragStart: (e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, lessonIndex)
                        }}
                    />
                </div>
            ))}
        </div>
    );
});

export default memo(MindMapView);