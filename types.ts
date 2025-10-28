
export interface FAQ {
  question: string;
  answer: string;
}

export interface Person {
  name: string;
  linkedin: string;
  title?: string;
  location?: string;
  relevancyScore: number;
  expertiseSummary: string;
}

export interface Company {
  name:string;
  linkedin: string;
  reason?: string; // Kept for backward compatibility from localStorage. New generations will use relevancyReason.
  location?: string;
  relevancyScore?: number;
  relevancyReason?: string;
}

export interface Lesson {
  title: string;
  description: string;
  lectureNotes?: string;
  keyTalkingPoints?: string;
  quizQuestions?: string;
}

export interface Module {
  title: string;
  lessons: Lesson[];
}

export interface CurriculumDay {
  day: number;
  title: string;
  modules: Module[];
}

export interface MarketAnalysis {
    suggestedPricing: string;
    competitorCourses: {
        name: string;
        provider: string;
        url: string;
    }[];
}

export interface Course {
  title: string;
  description: string;
  learningOutcomes: string[];
  keyAssignment: string;
  curriculum: CurriculumDay[];
  marketAnalysis: MarketAnalysis;
  potentialInstructors: Person[];
  potentialLeads: (Person | Company)[];
  faq: FAQ[];
}

export interface Project {
  id: string;
  topic: string;
  course: Course;
  createdAt: string;
}