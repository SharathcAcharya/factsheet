import React, { useState } from 'react';
import { Icons } from './icons';
import { CourseGenerationParams } from '../App';

interface GeneratorFormProps {
  onGenerate: (params: CourseGenerationParams) => void;
  isLoading: boolean;
}

// --- Helper Components (Moved Outside of GeneratorForm to prevent re-rendering issues) ---

const FormSection: React.FC<{title:string, children: React.ReactNode}> = ({title, children}) => (
  <div>
      <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">{title}</h2>
      {children}
  </div>
);

interface InputFieldProps {
    label: string;
    name: keyof CourseGenerationParams;
    value: string;
    placeholder: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({label, name, value, placeholder, required, onChange}) => (
  <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <input type="text" name={name} id={name} value={value} onChange={onChange} required={required}
      className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      placeholder={placeholder} />
  </div>
);

interface SelectFieldProps {
    label: string;
    name: keyof CourseGenerationParams;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    children: React.ReactNode;
}
const SelectField: React.FC<SelectFieldProps> = ({label, name, value, children, onChange}) => (
  <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <select name={name} id={name} value={value} onChange={onChange}
      className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
          {children}
      </select>
  </div>
);

// --- Main Form Component ---

const GeneratorForm: React.FC<GeneratorFormProps> = ({ onGenerate, isLoading }) => {
  const [formData, setFormData] = useState<CourseGenerationParams>({
    topic: '',
    difficulty: 'Beginner',
    summary: '',
    country: '',
    city: '',
    duration: '1 Day',
    skills: '',
    experience: 'Any',
    style: 'Any',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDurationChange = (duration: string) => {
      setFormData(prev => ({ ...prev, duration }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.topic && formData.country && formData.city) {
        onGenerate(formData);
    }
  };
  
  const isFormValid = formData.topic && formData.country && formData.city;

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900/70 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 space-y-8">
      
      <FormSection title="1. The Core Idea">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-1">
            <InputField label="Course Topic" name="topic" value={formData.topic} placeholder="e.g., Introduction to Quantum Computing" onChange={handleChange} required />
          </div>
          <div>
            <SelectField label="Difficulty Level" name="difficulty" value={formData.difficulty} onChange={handleChange}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
            </SelectField>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="summary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Course Summary (Optional)</label>
            <textarea name="summary" id="summary" value={formData.summary} onChange={handleChange} rows={3}
              className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Briefly describe the course goals, content, and what students will learn..."></textarea>
          </div>
        </div>
      </FormSection>

      <FormSection title="2. Logistics">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InputField label="Country" name="country" value={formData.country} placeholder="e.g., USA" onChange={handleChange} required />
          <InputField label="City" name="city" value={formData.city} placeholder="e.g., San Francisco" onChange={handleChange} required />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration</label>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-1">
              {['1 Day', '2 Days', '3 Days'].map(d => (
                <button type="button" key={d} onClick={() => handleDurationChange(d)}
                  className={`flex-1 text-sm py-1.5 rounded-md transition-all duration-200 ${formData.duration === d ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="3. Instructor Preferences (Optional)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <InputField label="Specific Skills" name="skills" value={formData.skills} placeholder="e.g., React, AWS" onChange={handleChange} />
          </div>
          <div>
            <SelectField label="Min. Experience" name="experience" value={formData.experience} onChange={handleChange}>
                <option>Any</option>
                <option>1-3 years</option>
                <option>3-5 years</option>
                <option>5+ years</option>
            </SelectField>
          </div>
          <div>
            <SelectField label="Teaching Style" name="style" value={formData.style} onChange={handleChange}>
                <option>Any</option>
                <option>Project-based</option>
                <option>Lecture-style</option>
                <option>Hands-on labs</option>
            </SelectField>
          </div>
        </div>
      </FormSection>
      
      {/* Submit Button */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
        <button type="submit" disabled={!isFormValid || isLoading}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform hover:scale-105 duration-300 ease-in-out">
          {isLoading ? <Icons.loader className="w-5 h-5 animate-spin" /> : <Icons.sparkles className="w-5 h-5" />}
          {isLoading ? 'Generating...' : 'Generate with AI'}
        </button>
      </div>
    </form>
  )
}

export default GeneratorForm;