// Enhanced Gemini integration utilities for educational content generation

export interface EducationalResponse {
  answer: string;
  concept: string;
  slides: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  subject: 'Biology' | 'Physics' | 'Chemistry' | 'Mathematics' | 'Computer Science' | 'General';
  interactiveElements: string[];
  prerequisites?: string[];
  nextTopics?: string[];
  realWorldExamples?: string[];
}

export class GeminiEducationEngine {
  static generatePrompt(question: string, userLevel?: string): string {
    const basePrompt = `You are an expert educational AI tutor specialized in making complex topics accessible and engaging for students.

ROLE: Educational content generator that creates structured, interactive learning experiences.

ANALYSIS STEPS:
1. Identify the main educational concept from the question
2. Determine the appropriate difficulty level (beginner/intermediate/advanced)
3. Classify the subject area
4. Generate clear, engaging explanations with examples
5. Create actionable learning points
6. Suggest interactive elements that would enhance understanding

RESPONSE FORMAT: Return ONLY valid JSON with the following structure:
{
  "answer": "Engaging explanation (150-400 words) with examples and analogies",
  "concept": "Clear, specific topic title (e.g., 'Photosynthesis', 'Quadratic Equations')",
  "slides": ["5-6 key learning points as bullet points"],
  "difficulty": "beginner|intermediate|advanced",
  "subject": "Biology|Physics|Chemistry|Mathematics|Computer Science|General",
  "interactiveElements": ["List of suggested interactive features"],
  "prerequisites": ["Optional: what students should know first"],
  "nextTopics": ["Optional: what to learn next"],
  "realWorldExamples": ["Optional: practical applications"]
}

EXPLANATION GUIDELINES:
- Start with a hook or interesting fact
- Use analogies and real-world connections
- Break down complex concepts into digestible parts
- Include why the topic matters
- Use encouraging, conversational tone
- Make it appropriate for the difficulty level

EXAMPLE FOR "How does photosynthesis work?":
{
  "answer": "Photosynthesis is nature's most incredible solar energy system! Imagine plants as living solar panels that not only generate their own food but also produce the oxygen we breathe. Here's how this amazing process works: Plants capture sunlight using chlorophyll, the green pigment in their leaves that acts like tiny solar collectors. They then combine this light energy with carbon dioxide from the air (which enters through microscopic pores called stomata) and water absorbed by their roots. Through a series of chemical reactions, plants transform these simple ingredients into glucose (their food) and release oxygen as a wonderful bonus. This process is so efficient that it powers nearly all life on Earth - from the smallest bacteria to the largest whales depend on the oxygen and energy that photosynthesis provides!",
  "concept": "Photosynthesis",
  "slides": [
    "Plants capture sunlight using chlorophyll in leaves",
    "Carbon dioxide enters through stomata (leaf pores)",
    "Water travels from roots to leaves through the stem",
    "Light energy converts CO₂ + H₂O into glucose + oxygen",
    "Oxygen is released into the atmosphere as a byproduct",
    "This process powers most life on Earth's food chains"
  ],
  "difficulty": "beginner",
  "subject": "Biology",
  "interactiveElements": ["light-absorption-animation", "molecular-flow-diagram", "stomata-zoom", "before-after-comparison"],
  "prerequisites": ["Basic understanding of plants", "What is energy"],
  "nextTopics": ["Cellular respiration", "Food chains", "Carbon cycle"],
  "realWorldExamples": ["Solar panels inspired by leaves", "Why forests are called 'lungs of Earth'", "How plants help fight climate change"]
}

${userLevel ? `USER LEVEL: Adjust explanation for ${userLevel} level` : ''}

QUESTION: ${question}`;

    return basePrompt;
  }

  static validateResponse(response: any): EducationalResponse {
    // Validate and sanitize the Gemini response
    const answer = (response.answer || 'Let me think about that topic.').slice(0, 2000);
    const concept = (response.concept || 'Learning Topic').slice(0, 80);
    const difficulty = ['beginner', 'intermediate', 'advanced'].includes(response.difficulty) 
      ? response.difficulty 
      : 'beginner';
    
    const subjects = ['Biology', 'Physics', 'Chemistry', 'Mathematics', 'Computer Science', 'General'];
    const subject = subjects.includes(response.subject) ? response.subject : 'General';
    
    const slides = Array.isArray(response.slides) && response.slides.length > 0
      ? response.slides.slice(0, 6)
      : this.generateDefaultSlides(concept);
    
    const interactiveElements = Array.isArray(response.interactiveElements) 
      ? response.interactiveElements.slice(0, 10)
      : [];

    const prerequisites = Array.isArray(response.prerequisites) 
      ? response.prerequisites.slice(0, 5)
      : [];

    const nextTopics = Array.isArray(response.nextTopics) 
      ? response.nextTopics.slice(0, 5)
      : [];

    const realWorldExamples = Array.isArray(response.realWorldExamples) 
      ? response.realWorldExamples.slice(0, 5)
      : [];

    return {
      answer,
      concept,
      slides,
      difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
      subject: subject as any,
      interactiveElements,
      prerequisites,
      nextTopics,
      realWorldExamples
    };
  }

  static generateDefaultSlides(concept: string): string[] {
    return [
      `Introduction to ${concept}`,
      'Key components and principles',
      'How it works step by step',
      'Real-world applications',
      'Common examples in daily life',
      'Why it matters for understanding the world'
    ];
  }

  static extractConceptFromQuestion(question: string): string {
    const lowerQ = question.toLowerCase();
    
    // Educational concept keywords mapped to proper names
    const conceptMap: Record<string, string> = {
      // Biology
      'photosynthesis': 'Photosynthesis',
      'cellular respiration': 'Cellular Respiration',
      'respiration': 'Respiration',
      'dna': 'DNA Structure',
      'genetics': 'Genetics',
      'evolution': 'Evolution',
      'mitosis': 'Cell Division (Mitosis)',
      'meiosis': 'Cell Division (Meiosis)',
      'ecology': 'Ecology',
      'cells': 'Cell Biology',
      
      // Physics
      'gravity': 'Gravity and Forces',
      'magnetism': 'Magnetism',
      'electricity': 'Electricity',
      'current': 'Electric Current',
      'waves': 'Wave Motion',
      'sound': 'Sound Waves',
      'light': 'Light and Optics',
      'optics': 'Optics',
      'thermodynamics': 'Thermodynamics',
      'energy': 'Energy and Work',
      'motion': 'Motion and Forces',
      
      // Chemistry
      'atoms': 'Atomic Structure',
      'molecules': 'Molecular Structure',
      'bonding': 'Chemical Bonding',
      'reactions': 'Chemical Reactions',
      'acids': 'Acids and Bases',
      'bases': 'Acids and Bases',
      'periodic': 'Periodic Table',
      'elements': 'Chemical Elements',
      
      // Mathematics
      'algebra': 'Algebra',
      'geometry': 'Geometry',
      'coordinate': 'Coordinate Geometry',
      'calculus': 'Calculus',
      'trigonometry': 'Trigonometry',
      'statistics': 'Statistics',
      'probability': 'Probability',
      'functions': 'Mathematical Functions',
      'equations': 'Solving Equations',
      
      // Computer Science
      'algorithms': 'Algorithms',
      'data structures': 'Data Structures',
      'programming': 'Programming Concepts',
      'binary': 'Binary Systems',
      'search': 'Search Algorithms',
      'sorting': 'Sorting Algorithms',
      'recursion': 'Recursion',
      'loops': 'Programming Loops'
    };

    // Find matching concepts
    for (const [keyword, concept] of Object.entries(conceptMap)) {
      if (lowerQ.includes(keyword)) {
        return concept;
      }
    }

    // Extract first meaningful word as fallback
    const words = question.split(' ').filter(w => w.length > 3);
    const firstWord = words[0];
    return firstWord ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1) : 'Learning Topic';
  }

  static getDifficultyFromQuestion(question: string): 'beginner' | 'intermediate' | 'advanced' {
    const lowerQ = question.toLowerCase();
    
    if (lowerQ.includes('basic') || lowerQ.includes('simple') || lowerQ.includes('explain') || lowerQ.includes('what is')) {
      return 'beginner';
    }
    
    if (lowerQ.includes('advanced') || lowerQ.includes('complex') || lowerQ.includes('derive') || lowerQ.includes('prove')) {
      return 'advanced';
    }
    
    if (lowerQ.includes('how does') || lowerQ.includes('analyze') || lowerQ.includes('compare')) {
      return 'intermediate';
    }
    
    return 'beginner'; // Default to beginner for accessibility
  }

  static getSubjectFromConcept(concept: string): string {
    const subjectKeywords = {
      'Biology': ['photosynthesis', 'dna', 'cell', 'evolution', 'genetics', 'respiration', 'ecology'],
      'Physics': ['gravity', 'force', 'energy', 'wave', 'light', 'electricity', 'magnetism', 'motion'],
      'Chemistry': ['atom', 'molecule', 'reaction', 'acid', 'base', 'element', 'bond', 'periodic'],
      'Mathematics': ['algebra', 'geometry', 'calculus', 'trigonometry', 'equation', 'function', 'coordinate'],
      'Computer Science': ['algorithm', 'programming', 'data', 'binary', 'search', 'sort', 'recursion', 'loop']
    };

    const lowerConcept = concept.toLowerCase();
    
    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      if (keywords.some(keyword => lowerConcept.includes(keyword))) {
        return subject;
      }
    }
    
    return 'General';
  }
}

export default GeminiEducationEngine;
