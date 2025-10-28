import React, { useState, memo } from 'react';
import { Project, Course, Person, Company, FAQ, CurriculumDay, Module, Lesson, MarketAnalysis } from '../types';
import EditableField from './EditableField';
import MindMapView from './MindMapView';
import { Icons } from './icons';
import { decode, decodeAudioData } from '../utils/audio';
import { exportInstructorsToXlsx, exportLeadsToXlsx } from '../utils/export';

interface CourseOutlineProps {
  project: Project;
  onUpdateField: <T extends keyof Course>(field: T, value: Course[T]) => void;
  onUpdateNestedField: (path: (string | number)[], value: string) => void;
  onReorderNestedList: (path: (string | number)[], oldIndex: number, newIndex: number) => void;
  onRefine: (path: (string | number)[], content: string, type: 'concise' | 'professional' | 'simple') => void;
  generateSpeech: (text: string) => Promise<string>;
  onGenerateLessonContent: (path: (string|number)[], lesson: Lesson, contentType: 'lectureNotes' | 'keyTalkingPoints' | 'quizQuestions') => void;
  onGenerateOutreach: (recipient: Person | Company, type: 'instructor' | 'lead') => void;
}

const CourseOutline: React.FC<CourseOutlineProps> = (props) => {
    const [viewMode, setViewMode] = useState<'list' | 'mindmap'>('list');

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-16 text-slate-800 dark:text-slate-200">
            <div className="flex justify-end">
                <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
            </div>

            {viewMode === 'list' && <ListView {...props} />}
            {viewMode === 'mindmap' && <MindMapView {...props} />}
        </div>
    );
};


// --- View Switcher ---
const ViewSwitcher: React.FC<{
    viewMode: 'list' | 'mindmap';
    setViewMode: (mode: 'list' | 'mindmap') => void;
}> = ({ viewMode, setViewMode }) => (
    <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
        <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
        >
            <Icons.list className="w-4 h-4" />
            List
        </button>
        <button
            onClick={() => setViewMode('mindmap')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'mindmap' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
        >
            <Icons.gitBranch className="w-4 h-4" />
            Mind Map
        </button>
    </div>
);


// --- List View Component ---
const ListView: React.FC<CourseOutlineProps> = ({ project, onUpdateField, onUpdateNestedField, onRefine, generateSpeech, onGenerateLessonContent, onGenerateOutreach }) => {
  const { course } = project;
  
  const handleUpdateStringList = (list: string[], index: number, value: string, updateFn: (newList: string[]) => void) => {
      const newList = [...list];
      newList[index] = value;
      updateFn(newList);
  }

  return (
    <div id="course-content" className="max-w-4xl mx-auto space-y-12">
      {/* Title */}
      <section>
        <EditableField 
            value={course.title} 
            onSave={(val) => onUpdateField('title', val)}
            path={['title']}
            onRefine={onRefine}
            className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-500"
            textareaClassName="text-4xl font-extrabold tracking-tight"
        />
      </section>
      
      {/* Description */}
      <Card title="Description" icon={<Icons.fileText className="w-5 h-5"/>} copyText={course.description}>
        <EditableField 
            value={course.description} 
            onSave={(val) => onUpdateField('description', val)}
            path={['description']}
            onRefine={onRefine}
            className="text-lg text-slate-600 dark:text-slate-400"
            textareaClassName="text-lg"
        />
      </Card>

      {/* Market Analysis */}
      <Card title="Market Analysis" icon={<Icons.dollarSign className="w-5 h-5"/>} copyText={formatMarketAnalysis(course.marketAnalysis)}>
          <div className="space-y-4">
              <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Suggested Pricing</h4>
                  <p className="text-slate-600 dark:text-slate-400">{course.marketAnalysis.suggestedPricing}</p>
              </div>
              <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Competitor Courses</h4>
                  <ul className="list-disc list-outside space-y-2 pl-5 mt-2">
                      {course.marketAnalysis.competitorCourses.map((c, i) => (
                          <li key={i} className="text-slate-600 dark:text-slate-400">
                              <span>{c.name} by <strong>{c.provider}</strong></span>
                              <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-block ml-2 text-blue-500 hover:underline">
                                  <Icons.link className="w-4 h-4 inline-block"/>
                              </a>
                          </li>
                      ))}
                  </ul>
              </div>
          </div>
      </Card>

      {/* Learning Outcomes */}
      <Card title="Learning Outcomes" icon={<Icons.target className="w-5 h-5"/>} copyText={formatList(course.learningOutcomes)}>
        <ul className="list-disc list-inside space-y-2">
            {course.learningOutcomes.map((outcome, index) => (
                <li key={index}>
                    <EditableField 
                        value={outcome}
                        onSave={(val) => handleUpdateStringList(course.learningOutcomes, index, val, (l) => onUpdateField('learningOutcomes', l))}
                        path={['learningOutcomes', index]}
                        onRefine={onRefine}
                        className="inline"
                    />
                </li>
            ))}
        </ul>
      </Card>
      
      {/* Key Assignment */}
      <Card title="Key Assignment" icon={<Icons.assignment className="w-5 h-5"/>} copyText={course.keyAssignment}>
        <EditableField 
            value={course.keyAssignment} 
            onSave={(val) => onUpdateField('keyAssignment', val)}
            path={['keyAssignment']}
            onRefine={onRefine}
        />
      </Card>

      {/* Curriculum */}
      <Card title="Curriculum" icon={<Icons.calendar className="w-5 h-5"/>} copyText={formatCurriculum(course.curriculum)}>
        <div className="space-y-8">
            {course.curriculum.map((day, dayIndex) => (
                <DaySection 
                    key={day.day} 
                    day={day} 
                    dayIndex={dayIndex} 
                    onUpdateNestedField={onUpdateNestedField}
                    onRefine={onRefine}
                    generateSpeech={generateSpeech}
                    onGenerateLessonContent={onGenerateLessonContent}
                />
            ))}
        </div>
      </Card>

      {/* Dual Column Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Instructors */}
        <Card 
            title="Potential Instructors" 
            icon={<Icons.users className="w-5 h-5"/>} 
            copyText={formatPeople(course.potentialInstructors)}
            onExport={() => exportInstructorsToXlsx(course.potentialInstructors, course.title)}
        >
            <div className="space-y-2">
                {course.potentialInstructors.map((p, i) => (
                    <PersonCard key={i} person={p} path={['potentialInstructors', i]} onUpdate={onUpdateNestedField} onGenerateOutreach={onGenerateOutreach} outreachType="instructor" />
                ))}
            </div>
        </Card>
        
        {/* Leads */}
        <Card 
            title="Potential Client Leads" 
            icon={<Icons.briefcase className="w-5 h-5"/>} 
            copyText={formatCompanies(course.potentialLeads)}
            onExport={() => exportLeadsToXlsx(course.potentialLeads, course.title)}
        >
            <div className="space-y-2">
                {course.potentialLeads.map((c, i) => {
                    if ('expertiseSummary' in c) {
                        return <PersonCard key={i} person={c as Person} path={['potentialLeads', i]} onUpdate={onUpdateNestedField} onGenerateOutreach={onGenerateOutreach} outreachType="lead" />;
                    }
                    return <CompanyCard key={i} company={c as Company} path={['potentialLeads', i]} onUpdate={onUpdateNestedField} onGenerateOutreach={onGenerateOutreach}/>;
                })}
            </div>
        </Card>
      </div>

      {/* FAQ */}
      <Card title="Frequently Asked Questions" icon={<Icons.help className="w-5 h-5"/>} copyText={formatFaq(course.faq)}>
        <div className="space-y-6">
            {course.faq.map((item, index) => (
                <div key={index}>
                    <EditableField 
                        value={item.question}
                        onSave={(val) => onUpdateNestedField(['faq', index, 'question'], val)}
                        path={['faq', index, 'question']}
                        onRefine={onRefine}
                        className="font-semibold text-slate-900 dark:text-white"
                        textareaClassName="font-semibold"
                    />
                    <EditableField 
                        value={item.answer}
                        onSave={(val) => onUpdateNestedField(['faq', index, 'answer'], val)}
                        path={['faq', index, 'answer']}
                        onRefine={onRefine}
                        className="mt-1 text-slate-600 dark:text-slate-400"
                    />
                </div>
            ))}
        </div>
      </Card>
    </div>
  );
};


// --- Helper functions and components for List View ---
const formatList = (items: string[]) => items.map(item => `- ${item}`).join('\n');
const formatPeople = (people: Person[]) => people.map(p => `${p.name} (${p.title || 'N/A'})\nLocation: ${p.location || 'N/A'}\nRelevancy: ${p.relevancyScore}/100\nSummary: ${p.expertiseSummary}\nLinkedIn: ${p.linkedin}`).join('\n\n');
const formatCompanies = (companies: (Person | Company)[]) => companies.map(c => {
    if ('expertiseSummary' in c) {
        const p = c as Person;
        return `${p.name} (${p.title || 'N/A'})\nLocation: ${p.location || 'N/A'}\nRelevancy: ${p.relevancyScore}/100\nReason: ${p.expertiseSummary}\nLinkedIn: ${p.linkedin}`;
    }
    return `${c.name}\nLocation: ${c.location || 'N/A'}\nRelevancy: ${c.relevancyScore ?? 'N/A'}/100\nReason: ${c.relevancyReason || c.reason || 'N/A'}\nLinkedIn: ${c.linkedin}`;
}).join('\n\n');
const formatFaq = (faqs: FAQ[]) => faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
const formatMarketAnalysis = (analysis: MarketAnalysis) => {
    let text = `Suggested Pricing: ${analysis.suggestedPricing}\n\n`;
    text += 'Competitor Courses:\n';
    analysis.competitorCourses.forEach(c => {
        text += `- ${c.name} by ${c.provider} (${c.url})\n`;
    });
    return text;
};
const formatCurriculum = (curriculum: CurriculumDay[]) => {
    let text = '';
    curriculum.forEach(day => {
        text += `Day ${day.day}: ${day.title}\n`;
        day.modules.forEach(module => {
            text += `  Module: ${module.title}\n`;
            module.lessons.forEach(lesson => {
                text += `    - ${lesson.title}: ${lesson.description}\n`;
            });
        });
        text += '\n';
    });
    return text.trim();
};


const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = async () => {
    if (isCopied) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="relative group">
        <button
          onClick={handleCopy}
          aria-label="Copy section to clipboard"
          className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
        >
          {isCopied ? <Icons.check className="w-4 h-4 text-green-500" /> : <Icons.copy className="w-4 h-4" />}
        </button>
        <div className="absolute top-full mt-2 -translate-x-1/2 left-1/2 invisible group-hover:visible bg-slate-800 text-white text-xs rounded py-1 px-2 z-10 whitespace-nowrap">
            {isCopied ? 'Copied!' : 'Copy to clipboard'}
        </div>
    </div>
  );
};

const Card: React.FC<{title: string, icon: React.ReactNode, children: React.ReactNode, copyText?: string, onExport?: () => void}> = memo(({ title, icon, children, copyText, onExport }) => (
    <section>
        <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                  {icon}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
            </div>
            <div className="flex items-center gap-1">
                {onExport && (
                    <div className="relative group">
                        <button
                          onClick={onExport}
                          aria-label="Export section as Excel"
                          className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                        >
                          <Icons.sheet className="w-4 h-4" />
                        </button>
                        <div className="absolute top-full mt-2 -translate-x-1/2 left-1/2 invisible group-hover:visible bg-slate-800 text-white text-xs rounded py-1 px-2 z-10 whitespace-nowrap">
                            Export as Excel
                        </div>
                    </div>
                )}
                {copyText && <CopyButton textToCopy={copyText} />}
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-sm p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-800">
            {children}
        </div>
    </section>
));


const DaySection: React.FC<{
  day: CurriculumDay;
  dayIndex: number;
  onUpdateNestedField: (path: (string | number)[], value: string) => void;
  onRefine: CourseOutlineProps['onRefine'];
  generateSpeech: (text: string) => Promise<string>;
  onGenerateLessonContent: CourseOutlineProps['onGenerateLessonContent'];
}> = memo(({ day, dayIndex, onUpdateNestedField, onRefine, generateSpeech, onGenerateLessonContent }) => (
    <div>
        <h3 className="text-xl font-bold flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Icons.flag className="w-5 h-5"/>
            <span>Day {day.day}: </span>
            <EditableField 
                value={day.title}
                onSave={(val) => onUpdateNestedField(['curriculum', dayIndex, 'title'], val)}
                path={['curriculum', dayIndex, 'title']}
                onRefine={onRefine}
                className="inline"
                textareaClassName="text-xl font-bold"
            />
        </h3>
        <div className="mt-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800 space-y-6">
            {day.modules.map((module, modIndex) => (
                <ModuleSection 
                    key={modIndex} 
                    module={module} 
                    path={['curriculum', dayIndex, 'modules', modIndex]} 
                    onUpdateNestedField={onUpdateNestedField} 
                    onRefine={onRefine}
                    generateSpeech={generateSpeech}
                    onGenerateLessonContent={onGenerateLessonContent}
                />
            ))}
        </div>
    </div>
));


const ModuleSection: React.FC<{
  module: Module;
  path: (string | number)[];
  onUpdateNestedField: (path: (string | number)[], value: string) => void;
  onRefine: CourseOutlineProps['onRefine'];
  generateSpeech: (text: string) => Promise<string>;
  onGenerateLessonContent: CourseOutlineProps['onGenerateLessonContent'];
}> = memo(({ module, path, onUpdateNestedField, onRefine, generateSpeech, onGenerateLessonContent }) => (
    <div>
        <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200">
            <EditableField 
                value={module.title}
                onSave={(val) => onUpdateNestedField([...path, 'title'], val)}
                path={[...path, 'title']}
                onRefine={onRefine}
                className="inline"
                textareaClassName="text-lg font-semibold"
            />
        </h4>
        <div className="mt-2 space-y-3">
            {module.lessons.map((lesson, lessonIndex) => (
                <LessonItem 
                    key={lessonIndex} 
                    lesson={lesson} 
                    path={[...path, 'lessons', lessonIndex]} 
                    onUpdateNestedField={onUpdateNestedField}
                    onRefine={onRefine}
                    generateSpeech={generateSpeech}
                    onGenerateLessonContent={onGenerateLessonContent}
                />
            ))}
        </div>
    </div>
));

const LessonItem: React.FC<{
  lesson: Lesson;
  path: (string | number)[];
  onUpdateNestedField: (path: (string | number)[], value: string) => void;
  onRefine: CourseOutlineProps['onRefine'];
  generateSpeech: (text: string) => Promise<string>;
  onGenerateLessonContent: CourseOutlineProps['onGenerateLessonContent'];
}> = memo(({ lesson, path, onUpdateNestedField, onRefine, generateSpeech, onGenerateLessonContent }) => {
    const [audioState, setAudioState] = React.useState<'idle' | 'loading' | 'playing'>('idle');
    const audioContextRef = React.useRef<AudioContext | null>(null);
    const audioSourceRef = React.useRef<AudioBufferSourceNode | null>(null);
    const [isAiMenuOpen, setIsAiMenuOpen] = React.useState(false);

    const handlePlayAudio = async () => {
        if (audioState === 'playing' && audioSourceRef.current) {
            audioSourceRef.current.stop();
            setAudioState('idle');
            return;
        }

        setAudioState('loading');
        try {
            const base64Audio = await generateSpeech(lesson.description);
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => setAudioState('idle');
            source.start(0);

            audioSourceRef.current = source;
            setAudioState('playing');
        } catch (error) {
            console.error("Failed to play audio:", error);
            setAudioState('idle');
        }
    };

    const handleGenerateContent = (contentType: 'lectureNotes' | 'keyTalkingPoints' | 'quizQuestions') => {
        onGenerateLessonContent(path, lesson, contentType);
        setIsAiMenuOpen(false);
    };
    
    return (
        <div className="pl-8 relative group">
            <div className="absolute left-[3px] top-2.5 h-full border-l-2 border-slate-200 dark:border-slate-700"></div>
            <div className="absolute left-[-5px] top-2 w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded-full border-2 border-blue-300 dark:border-blue-700"></div>
            
            <div className="flex items-start gap-2">
                <div className="flex-grow">
                    <EditableField
                        value={lesson.title}
                        onSave={(val) => onUpdateNestedField([...path, 'title'], val)}
                        path={[...path, 'title']}
                        onRefine={onRefine}
                        className="font-medium"
                        textareaClassName="font-medium"
                    />
                    <EditableField
                        value={lesson.description}
                        onSave={(val) => onUpdateNestedField([...path, 'description'], val)}
                        path={[...path, 'description']}
                        onRefine={onRefine}
                        className="text-sm text-slate-600 dark:text-slate-400 mt-1"
                        textareaClassName="text-sm"
                    />
                </div>
                <div className="flex items-center flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={handlePlayAudio}
                      aria-label={audioState === 'playing' ? `Pause narration for ${lesson.title}` : `Play narration for ${lesson.title}`}
                      className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                        {audioState === 'loading' ? <Icons.loader className="w-4 h-4 animate-spin"/> :
                         audioState === 'playing' ? <Icons.pause className="w-4 h-4" /> :
                         <Icons.play className="w-4 h-4" />}
                    </button>
                    <div className="relative">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsAiMenuOpen(!isAiMenuOpen); }}
                            aria-label="Generate additional lesson content with AI"
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Icons.sparkles className="w-4 h-4" />
                        </button>
                        {isAiMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20">
                                <button onClick={() => handleGenerateContent('lectureNotes')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700">Generate Lecture Notes</button>
                                <button onClick={() => handleGenerateContent('keyTalkingPoints')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700">Generate Key Points</button>
                                <button onClick={() => handleGenerateContent('quizQuestions')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700">Generate Quiz</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                {lesson.lectureNotes && (
                    <GeneratedContentSection
                        title="Lecture Notes"
                        icon={<Icons.fileText className="w-4 h-4 text-slate-500"/>}
                        content={lesson.lectureNotes}
                        path={[...path, 'lectureNotes']}
                        onSave={onUpdateNestedField}
                        onRefine={onRefine}
                    />
                )}
                {lesson.keyTalkingPoints && (
                    <GeneratedContentSection
                        title="Key Talking Points"
                        icon={<Icons.target className="w-4 h-4 text-slate-500"/>}
                        content={lesson.keyTalkingPoints}
                        path={[...path, 'keyTalkingPoints']}
                        onSave={onUpdateNestedField}
                        onRefine={onRefine}
                    />
                )}
                {lesson.quizQuestions && (
                    <GeneratedContentSection
                        title="Quiz Questions"
                        icon={<Icons.help className="w-4 h-4 text-slate-500"/>}
                        content={lesson.quizQuestions}
                        path={[...path, 'quizQuestions']}
                        onSave={onUpdateNestedField}
                        onRefine={onRefine}
                    />
                )}
            </div>
        </div>
    )
});

const GeneratedContentSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  content: string;
  path: (string|number)[];
  onSave: (path: (string|number)[], value: string) => void;
  onRefine: CourseOutlineProps['onRefine'];
}> = ({ title, icon, content, path, onSave, onRefine }) => (
    <div className="pl-4 mt-4 border-l-2 border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
            {icon}
            <h5 className="font-semibold text-sm text-slate-700 dark:text-slate-300">{title}</h5>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-sans">
             <EditableField 
                value={content}
                onSave={(val) => onSave(path, val)}
                path={path}
                onRefine={onRefine}
                className="w-full"
                textareaClassName="text-sm"
             />
        </div>
    </div>
);


const PersonCard: React.FC<{
  person: Person;
  path: (string | number)[];
  onUpdate: (path: (string | number)[], value: string) => void;
  onGenerateOutreach: CourseOutlineProps['onGenerateOutreach'];
  outreachType: 'instructor' | 'lead';
}> = memo(({ person, path, onUpdate, onGenerateOutreach, outreachType }) => {
    const scoreColor = person.relevancyScore > 75 ? 'text-green-500' : person.relevancyScore > 50 ? 'text-yellow-500' : 'text-red-500';

    return (
        <div className="p-3 border border-transparent rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
             <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-700 flex-shrink-0">
                    {person.name.charAt(0)}
                </div>
                <div className="flex-1">
                    <EditableField value={person.name} onSave={val => onUpdate([...path, 'name'], val)} path={[...path, 'name']} className="font-semibold" textareaClassName="font-semibold"/>
                    <EditableField value={person.title || ''} onSave={val => onUpdate([...path, 'title'], val)} path={[...path, 'title']} className="text-sm text-slate-500" textareaClassName="text-sm" placeholder="Role or Title"/>
                    {person.location && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            <Icons.mapPin className="w-3 h-3 flex-shrink-0" />
                            <EditableField value={person.location} onSave={val => onUpdate([...path, 'location'], val)} path={[...path, 'location']} className="text-xs" textareaClassName="text-xs" placeholder="Location"/>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-center">
                    <div className={`text-lg font-bold ${scoreColor}`}>{person.relevancyScore}</div>
                    <div className="text-xs text-slate-400">Score</div>
                </div>
            </div>
            <div className="mt-2 pl-2">
                <EditableField value={person.expertiseSummary} onSave={val => onUpdate([...path, 'expertiseSummary'], val)} path={[...path, 'expertiseSummary']} className="text-sm text-slate-600 dark:text-slate-400" textareaClassName="text-sm" placeholder="Expertise summary..."/>
            </div>
            <div className="flex justify-end items-center mt-1 -mb-2 -mr-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button onClick={() => onGenerateOutreach(person, outreachType)} className="p-2 text-slate-400 hover:text-blue-500" aria-label={`Generate outreach for ${person.name}`}>
                    <Icons.mail className="w-5 h-5" />
                </button>
                <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-500" aria-label={`LinkedIn profile of ${person.name}`}>
                    <Icons.linkedin className="w-5 h-5" />
                </a>
            </div>
        </div>
    );
});


const CompanyCard: React.FC<{
  company: Company;
  path: (string | number)[];
  onUpdate: (path: (string | number)[], value: string) => void;
  onGenerateOutreach: CourseOutlineProps['onGenerateOutreach'];
}> = memo(({ company, path, onUpdate, onGenerateOutreach }) => {
    const score = company.relevancyScore ?? 0;
    const scoreColor = score > 75 ? 'text-green-500' : score > 50 ? 'text-yellow-500' : 'text-red-500';

    return (
    <div className="group p-3 border border-transparent rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-700 flex-shrink-0">
                {company.name.charAt(0)}
            </div>
            <div className="flex-1">
                <EditableField value={company.name} onSave={val => onUpdate([...path, 'name'], val)} path={[...path, 'name']} className="font-semibold" textareaClassName="font-semibold"/>
                {company.location && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <Icons.mapPin className="w-3 h-3 flex-shrink-0" />
                        <EditableField value={company.location} onSave={val => onUpdate([...path, 'location'], val)} path={[...path, 'location']} className="text-xs" textareaClassName="text-xs" placeholder="Location"/>
                    </div>
                )}
            </div>
            {company.relevancyScore !== undefined && (
                <div className="flex flex-col items-center">
                    <div className={`text-lg font-bold ${scoreColor}`}>{score}</div>
                    <div className="text-xs text-slate-400">Score</div>
                </div>
            )}
        </div>
        <div className="mt-2 pl-2">
            <EditableField value={company.relevancyReason || company.reason || ''} onSave={val => onUpdate([...path, 'relevancyReason'], val)} path={[...path, 'relevancyReason']} className="text-sm text-slate-600 dark:text-slate-400" textareaClassName="text-sm" placeholder="Reason for outreach"/>
        </div>
        <div className="flex justify-end items-center mt-1 -mb-2 -mr-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button onClick={() => onGenerateOutreach(company, 'lead')} className="p-2 text-slate-400 hover:text-blue-500" aria-label={`Generate outreach for ${company.name}`}>
                <Icons.mail className="w-5 h-5" />
            </button>
            <a href={company.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-500" aria-label={`LinkedIn profile of ${company.name}`}>
                <Icons.linkedin className="w-5 h-5" />
            </a>
        </div>
    </div>
    );
});

export default memo(CourseOutline);