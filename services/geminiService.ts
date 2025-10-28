

import { GoogleGenAI, Modality } from '@google/genai';
import { Course, Person, Company } from '../types';
import { CourseGenerationParams } from '../App';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Client-Side Rate Limiter ---
const RATE_LIMIT_COUNT = 15; // Max requests
const RATE_LIMIT_INTERVAL = 60 * 1000; // per 1 minute

const requestTimestamps: number[] = [];

const rateLimiter = {
  check: (): boolean => {
    const now = Date.now();
    
    // Remove timestamps older than the interval
    while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_INTERVAL) {
      requestTimestamps.shift();
    }

    if (requestTimestamps.length >= RATE_LIMIT_COUNT) {
      console.warn("Client-side rate limit exceeded.");
      return false; // Limit exceeded
    }

    requestTimestamps.push(now);
    return true; // Request allowed
  },
};
// --- End Rate Limiter ---


const getCourseJsonStructure = () => ({
    title: "string",
    description: "string (detailed, 2-3 paragraphs)",
    learningOutcomes: ["string"],
    keyAssignment: "string (a project or exam description)",
    curriculum: [{
        day: "number",
        title: "string",
        modules: [{
            title: "string",
            lessons: [{
                title: "string",
                description: "string (brief, 1-2 sentences)"
            }]
        }]
    }],
    marketAnalysis: {
        suggestedPricing: "string (e.g., '$1,500 - $2,000 per participant')",
        competitorCourses: [{
            name: "string (course name)",
            provider: "string (company/institution providing the course)",
            url: "string (full URL to the course page)"
        }]
    },
    potentialInstructors: [{
        name: "string",
        title: "string (e.g., 'Senior Cloud Engineer at Google')",
        location: "string (e.g., 'San Francisco Bay Area')",
        linkedin: "string (full URL)",
        relevancyScore: "number (1-100, based on expertise and location)",
        expertiseSummary: "string (1-2 sentences summarizing their specific expertise related to the topic)"
    }],
    potentialLeads: [{
        name: "string (individual or group name)",
        title: "string (e.g., 'Tech Enthusiast', 'Meetup Organizer', 'Software Engineer')",
        location: "string (e.g., 'San Francisco Bay Area')",
        linkedin: "string (full URL to LinkedIn profile or group)",
        relevancyScore: "number (1-100, based on their profile, interests and location)",
        expertiseSummary: "string (1-2 sentences summarizing why they are a good lead, e.g., interests, recent posts, group affiliations)"
    }],
    faq: [{
        question: "string",
        answer: "string"
    }]
});

const parseJsonResponse = (text: string): Course => {
    const match = text.match(/```json\n([\s\S]*?)\n```/);
    if (!match || !match[1]) {
        // Fallback for cases where the model might not return the markdown block
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse JSON, raw response:", text);
            throw new Error("Invalid JSON response from AI model.");
        }
    }
    const jsonString = match[1];
    return JSON.parse(jsonString);
}

export const generateCourseOutline = async (params: CourseGenerationParams, onProgress: (message: string) => void): Promise<Course> => {
  if (!rateLimiter.check()) {
    throw new Error("You're making requests too quickly. Please wait a moment and try again.");
  }
  const model = 'gemini-2.5-pro';
  
  onProgress('Crafting the perfect prompt...');
  await new Promise(res => setTimeout(res, 500));

  const jsonStructure = JSON.stringify(getCourseJsonStructure(), null, 2);
  const { topic, difficulty, summary, country, city, duration, skills, experience, style } = params;


  const prompt = `
    You are an expert curriculum designer and talent scout. Your task is to generate a comprehensive "fact sheet" for a corporate training course based on the following specifications.

    **Course Specifications:**
    - **Topic:** "${topic}"
    - **Difficulty Level:** ${difficulty}
    - **Duration:** ${duration}
    - **Location for Instructors/Leads:** ${city}, ${country}
    ${summary ? `- **Course Summary:** ${summary}` : ''}

    **Instructor Preferences:**
    ${skills ? `- **Required Skills:** ${skills}` : ''}
    ${experience && experience !== 'Any' ? `- **Minimum Experience:** ${experience}` : ''}
    ${style && style !== 'Any' ? `- **Preferred Teaching Style:** ${style}` : ''}

    **Your Task:**
    Use Google Search to find real, relevant information. Your output MUST be a single JSON object enclosed in a markdown code block (\`\`\`json ... \`\`\`).
    The JSON object must strictly adhere to the following structure:
    ${jsonStructure}

    **Content Generation Guidelines:**
    - **title:** Create a compelling and professional course title for the topic "${topic}".
    - **description:** Write a detailed, engaging course description incorporating the provided summary if available.
    - **learningOutcomes:** List at least 5 clear and measurable outcomes, tailored to the ${difficulty} level.
    - **curriculum:** Design a realistic curriculum for a ${duration} course. Each day should have 2-3 modules, and each module should have 2-4 lessons.
    - **marketAnalysis**: Perform a market analysis. Provide a 'suggestedPricing' range for this course, considering topic, duration, and location. Find and list at least 3 'competitorCourses' with their name, provider, and direct URL.
    - **potentialInstructors:** Find AT LEAST 10 real people on LinkedIn who are experts on the topic, based in or near **${city}, ${country}**. They should meet skill/experience requirements. Provide their name, title, location, and LinkedIn URL. For each, provide a 'relevancyScore' (1-100) assessing their alignment with the course, and a concise 'expertiseSummary' (1-2 sentences).
    - **potentialLeads:** Find AT LEAST 10 individuals or small groups on LinkedIn (like meetup groups, influencers, or professionals showing interest in this topic) located in or near **${city}, ${country}**, that would likely be interested in this training. These are not large companies. Focus on individuals, tech community leaders, or organizers. For each, provide their name, title/role, location, and LinkedIn URL. Also provide a 'relevancyScore' (1-100) and an 'expertiseSummary' (1-2 sentences) explaining why they are a good potential lead (e.g., their stated interests, recent activity, role in a relevant community).
    - **faq:** Create 3-5 relevant frequently asked questions with clear answers.
    `;
    
  onProgress('Sending request to Gemini...');
  const response = await ai.models.generateContent({
    model: model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  onProgress('Parsing AI response...');
  await new Promise(res => setTimeout(res, 500));
  
  const courseData = parseJsonResponse(response.text);

  onProgress('Finalizing course structure...');
  await new Promise(res => setTimeout(res, 300));

  return courseData;
};

export const refineText = async (text: string, type: 'concise' | 'professional' | 'simple'): Promise<string> => {
    if (!rateLimiter.check()) {
        throw new Error("You're making requests too quickly. Please wait a moment and try again.");
    }
    const model = 'gemini-2.5-flash';
    let instruction = '';
    switch(type) {
        case 'concise': instruction = 'Make the following text more concise.'; break;
        case 'professional': instruction = 'Rewrite the following text in a more professional tone.'; break;
        case 'simple': instruction = 'Explain the following text in simpler terms.'; break;
    }

    const prompt = `${instruction}\n\nTEXT: "${text}"\n\nREFINED TEXT:`;
    
    const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
    });

    return response.text.trim();
};

export const generateSpeech = async (text: string): Promise<string> => {
    if (!rateLimiter.check()) {
        throw new Error("You're making requests too quickly. Please wait a moment and try again.");
    }
    const model = 'gemini-2.5-flash-preview-tts';
    const response = await ai.models.generateContent({
        model: model,
        contents: [{ parts: [{ text: `Say: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data returned from API.");
    }
    return base64Audio;
};

export const generateLessonContent = async (
    courseTitle: string,
    lessonTitle: string,
    lessonDescription: string,
    contentType: 'lectureNotes' | 'keyTalkingPoints' | 'quizQuestions'
  ): Promise<string> => {
      if (!rateLimiter.check()) {
        throw new Error("You're making requests too quickly. Please wait a moment and try again.");
      }
      const model = 'gemini-2.5-flash';
      let instruction = '';
      let format_instructions = '';
      switch(contentType) {
          case 'lectureNotes': 
              instruction = 'Generate detailed lecture notes based on the following lesson. The notes should be structured, clear, and comprehensive enough for an instructor to teach from.'; 
              format_instructions = 'Use clear headings (e.g., using asterisks like *HEADING*), bullet points (-), and numbered lists for structure. Do not use complex markdown syntax.';
              break;
          case 'keyTalkingPoints': 
              instruction = 'Generate 3-5 key talking points for the following lesson. These should be concise, impactful statements that an instructor can use to highlight the most important concepts.'; 
              format_instructions = 'Format the output as a simple numbered or bulleted list.';
              break;
          case 'quizQuestions': 
              instruction = 'Generate 3 multiple-choice quiz questions with 4 options each for the following lesson. The questions should test the understanding of the key concepts.'; 
              format_instructions = 'Clearly label the question, the options (A, B, C, D), and explicitly state the correct answer (e.g., "Correct Answer: C").';
              break;
      }
  
      const prompt = `
      **Course Context:** "${courseTitle}"
      **Lesson Title:** "${lessonTitle}"
      **Lesson Description:** "${lessonDescription}"
  
      **Task:**
      ${instruction}
  
      **Formatting Guidelines:**
      ${format_instructions}
  
      **Output:**
      `;
      
      const response = await ai.models.generateContent({
          model,
          contents: [{ parts: [{ text: prompt }] }],
      });
  
      return response.text.trim();
  };
  
export const generateOutreachDraft = async (
    courseTitle: string,
    recipient: Person | Company,
    type: 'instructor' | 'lead'
): Promise<string> => {
    if (!rateLimiter.check()) {
        throw new Error("You're making requests too quickly. Please wait a moment and try again.");
    }
    const model = 'gemini-2.5-flash';
    let recipientInfo = '';
    let instruction = '';

    if (type === 'instructor') {
        const person = recipient as Person;
        recipientInfo = `**Instructor Name:** ${person.name}\n**Title:** ${person.title}\n**Expertise:** ${person.expertiseSummary}`;
        instruction = `Your task is to write a professional, personalized, and concise outreach message to a potential instructor. The goal is to gauge their interest in teaching a corporate training course. The tone should be respectful of their expertise and time. Mention the course topic and why their profile seems like a great fit. End with a clear call to action, like scheduling a brief chat.`;
    } else { // type === 'lead'
        if ('expertiseSummary' in recipient) {
            const person = recipient as Person;
            recipientInfo = `**Lead Name:** ${person.name}\n**Title:** ${person.title}\n**Reason for Outreach:** ${person.expertiseSummary}`;
            instruction = `Your task is to write a professional, personalized, and concise outreach message to a potential individual lead. The goal is to introduce a corporate training course that could benefit them. The tone should be friendly yet professional and value-oriented. Briefly introduce the course, connect it to their potential interests (based on the provided "Reason for Outreach"), and suggest a brief call to discuss further.`;
        } else {
            const company = recipient as Company;
            const reason = company.relevancyReason || company.reason;
            recipientInfo = `**Company Name:** ${company.name}\n**Reason for Outreach:** ${reason}`;
            instruction = `Your task is to write a professional, personalized, and concise outreach message to a potential client lead. The goal is to introduce a new corporate training course that could benefit their company. The tone should be professional and value-oriented. Briefly introduce the course, connect it to the company's potential needs (based on the provided "Reason for Outreach"), and suggest a brief call to discuss further.`;
        }
    }

    const prompt = `
    **Context:**
    - **Course Title:** "${courseTitle}"

    **Recipient Information:**
    ${recipientInfo}

    **Task:**
    ${instruction}

    **Output:**
    Generate the outreach message text only. Do not include a subject line.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
    });

    return response.text.trim();
};
