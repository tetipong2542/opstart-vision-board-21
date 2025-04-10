// Type definitions
export interface Template {
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export enum TemplateSentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative'
}

export interface WordEntry {
  word: string;
  templates: string[];
  polarity?: number;
  isCustom?: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
  score?: number;
}

// ฟังก์ชันอัปเดตสถิติการใช้คำของผู้ร่วมสร้าง
export const updateContributorStats = (contributorName: string): void => {
  if (!contributorName) return;
  
  // ดึงข้อมูลสถิติจาก localStorage
  const storedData = localStorage.getItem('contributor-stats');
  let contributorStats: Record<string, number> = {};
  
  // ถ้ามีข้อมูลเดิม ให้แปลงเป็น object
  if (storedData) {
    try {
      contributorStats = JSON.parse(storedData);
    } catch (error) {
      console.error('Error parsing contributor stats:', error);
    }
  }
  
  // เพิ่มจำนวนคำที่ใช้
  contributorStats[contributorName] = (contributorStats[contributorName] || 0) + 1;
  
  // บันทึกข้อมูลลงใน localStorage
  localStorage.setItem('contributor-stats', JSON.stringify(contributorStats));
};

// ฟังก์ชันดึงสถิติการใช้คำของผู้ร่วมสร้างทั้งหมด
export const getContributorStats = (): Record<string, number> => {
  // ดึงข้อมูลสถิติจาก localStorage
  const storedData = localStorage.getItem('contributor-stats');
  
  if (storedData) {
    try {
      return JSON.parse(storedData);
    } catch (error) {
      console.error('Error parsing contributor stats:', error);
    }
  }
  
  return {};
};

// ฟังก์ชันรีเซ็ตสถิติการใช้คำของผู้ร่วมสร้างทั้งหมด
export const resetContributorStats = (): void => {
  localStorage.removeItem('contributor-stats');
};

// Word database management functions
export const getWordDatabase = (): WordEntry[] => {
  const storedData = localStorage.getItem('word-suggestions');
  if (storedData) {
    try {
      return JSON.parse(storedData);
    } catch (error) {
      console.error('Error parsing word database:', error);
      return [];
    }
  }
  return [];
};

export const updateWordDatabase = (wordEntries: WordEntry[]): void => {
  localStorage.setItem('word-suggestions', JSON.stringify(wordEntries));
};

export const addWord = (wordEntry: WordEntry): void => {
  const wordEntries = getWordDatabase();
  wordEntries.push(wordEntry);
  updateWordDatabase(wordEntries);
};

// Updated function to handle string instead of string[]
export const addWordToDatabase = (word: string, templates: string[] | string): void => {
  const wordEntries = getWordDatabase();
  const existingIndex = wordEntries.findIndex(entry => entry.word === word);
  
  // Convert single string to array if needed
  const templatesArray = Array.isArray(templates) ? templates : [templates];
  
  if (existingIndex !== -1) {
    wordEntries[existingIndex].templates = templatesArray;
  } else {
    wordEntries.push({ word, templates: templatesArray });
  }
  
  updateWordDatabase(wordEntries);
};

export const updateWordPolarity = (word: string, polarity: number): void => {
  const wordEntries = getWordDatabase();
  const existingIndex = wordEntries.findIndex(entry => entry.word === word);
  
  if (existingIndex !== -1) {
    wordEntries[existingIndex].polarity = polarity;
    updateWordDatabase(wordEntries);
  }
};

export const deleteWord = (word: string): void => {
  try {
    const wordEntries = getWordDatabase();
    // ลบเฉพาะคำที่ต้องการ ไม่ลบทั้งหมด
    const updatedEntries = wordEntries.filter(entry => entry.word !== word);
    updateWordDatabase(updatedEntries);
    // ส่งเหตุการณ์เพื่อแจ้งการอัพเดต
    window.dispatchEvent(new CustomEvent('word-database-updated'));
  } catch (error) {
    console.error("Error deleting word:", error);
  }
};

// Template utilities
export const templateObjectsToStrings = (templates: Template[]): string[] => {
  return templates.map(template => {
    switch (template.sentiment) {
      case 'positive':
        return `\${บวก}${template.text}`;
      case 'neutral':
        return `\${กลาง}${template.text}`;
      case 'negative':
        return `\${ลบ}${template.text}`;
      default:
        return template.text;
    }
  });
};

export const stringToTemplateObjects = (templates: string[]): Template[] => {
  return templates.map(template => {
    if (template.includes('${บวก}')) {
      return {
        text: template.replace('${บวก}', ''),
        sentiment: 'positive'
      };
    } else if (template.includes('${กลาง}')) {
      return {
        text: template.replace('${กลาง}', ''),
        sentiment: 'neutral'
      };
    } else if (template.includes('${ลบ}')) {
      return {
        text: template.replace('${ลบ}', ''),
        sentiment: 'negative'
      };
    } else {
      return {
        text: template,
        sentiment: 'neutral'
      };
    }
  });
};

// Validation utilities
export const validateWordInput = (word: string, templates: string[]): { valid: boolean; message?: string } => {
  if (!word.trim()) {
    return { valid: false, message: 'คำต้องไม่เป็นค่าว่าง' };
  }
  
  if (templates.length === 0) {
    return { valid: false, message: 'ต้องมีแม่แบบประโยคอย่างน้อย 1 รายการ' };
  }
  
  return { valid: true };
};

export const hasDuplicateTemplates = (templates: string[] | Template[]): boolean => {
  const templatesAsStrings = Array.isArray(templates) && templates.length > 0 && typeof templates[0] === 'object'
    ? (templates as Template[]).map(t => t.text)
    : templates as string[];
  const uniqueTemplates = new Set(templatesAsStrings);
  return uniqueTemplates.size !== templatesAsStrings.length;
};

// Fixed parseTemplates function to correctly handle commas and template markers
export const parseTemplates = (rawTemplates: string): string[] => {
  // Support both comma and newline as separators, but handle template markers correctly
  const templates: string[] = [];
  let currentTemplate = '';
  let insideTemplate = false;
  let insideAnyTemplate = false; // Track if we're inside any template marker
  
  // Process the raw input character by character
  for (let i = 0; i < rawTemplates.length; i++) {
    const char = rawTemplates[i];
    
    // If we see ${, we're starting a template marker
    if (char === '$' && i + 1 < rawTemplates.length && rawTemplates[i+1] === '{') {
      insideTemplate = true;
      insideAnyTemplate = true;
      currentTemplate += char;
    }
    // If we see }, check if we're closing a template marker
    else if (char === '}' && insideTemplate) {
      insideTemplate = false;
      currentTemplate += char;
    }
    // Handle commas - only treat as separators when not inside any template markers
    else if ((char === ',' || char === '\n') && !insideAnyTemplate) {
      // Add the current template if it's not empty
      if (currentTemplate.trim()) {
        templates.push(currentTemplate.trim());
      }
      currentTemplate = '';
    }
    // For all other characters, add them to the current template
    else {
      currentTemplate += char;
      
      // Update insideAnyTemplate status if we're no longer inside any template markers
      if (!insideTemplate && currentTemplate.includes('${') && currentTemplate.includes('}')) {
        const lastOpenBrace = currentTemplate.lastIndexOf('${');
        const lastCloseBrace = currentTemplate.lastIndexOf('}');
        
        if (lastCloseBrace > lastOpenBrace) {
          insideAnyTemplate = false;
        }
      }
    }
  }
  
  // Don't forget to add the last template
  if (currentTemplate.trim()) {
    templates.push(currentTemplate.trim());
  }
  
  return templates.filter(t => t.length > 0);
};

export const getSentimentAnalysis = (templates: string[]): { positive: number; neutral: number; negative: number } => {
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  
  templates.forEach(template => {
    if (template.includes('${บวก}')) {
      positive++;
    } else if (template.includes('${กลาง}')) {
      neutral++;
    } else if (template.includes('${ลบ}')) {
      negative++;
    } else {
      neutral++;
    }
  });
  
  return { positive, neutral, negative };
};

// Add the missing getRandomWord function
export const getRandomWord = (): string => {
  // Predefined list of Thai words for encouragement
  const defaultWords = [
    "กำลังใจ", "ความหวัง", "ความฝัน", "ความสุข", "ความรัก", 
    "พลัง", "ศรัทธา", "ความเชื่อ", "ความเพียร", "ความอดทน",
    "ความสำเร็จ", "ความดี", "ความจริง", "ความกล้า", "มิตรภาพ",
    "ครอบครัว", "ความสามัคคี", "สติปัญญา", "สุขภาพ", "การเรียนรู้",
    "การเติบโต", "ความเข้มแข็ง", "ความมุ่งมั่น", "ความตั้งใจ", "การให้อภัย"
  ];
  
  // Try to get from database first
  const wordEntries = getWordDatabase();
  const allWords = wordEntries.length > 0 
    ? wordEntries.map(entry => entry.word)
    : defaultWords;
  
  // Select a random word
  const randomIndex = Math.floor(Math.random() * allWords.length);
  return allWords[randomIndex];
};

// Add the missing saveWordContribution function
export const saveWordContribution = (word: string, contributor: string): boolean => {
  if (!word.trim()) return false;
  
  try {
    // Get existing words or create an empty array
    const wordEntries = getWordDatabase();
    
    // Check if word already exists
    const existingWordIndex = wordEntries.findIndex(entry => entry.word === word);
    
    if (existingWordIndex === -1) {
      // Add new word with default template
      const newWordEntry: WordEntry = {
        word,
        templates: [`${word} เป็นสิ่งที่สำคัญในชีวิต`],
        isCustom: true,
        sentiment: 'neutral',
        score: 0
      };
      
      addWord(newWordEntry);
    }
    
    // Update contributor stats
    updateContributorStats(contributor);
    
    // Dispatch custom event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('word-database-updated'));
    }
    
    return true;
  } catch (error) {
    console.error("Error saving word contribution:", error);
    return false;
  }
};

// Function to check if all words in the database have been used
export const areAllWordsUsed = (selectedWords: string[]): boolean => {
  const wordEntries = getWordDatabase();
  
  // If database is empty, use default word list
  if (wordEntries.length === 0) {
    const defaultWords = [
      "กำลังใจ", "ความหวัง", "ความฝัน", "ความสุข", "ความรัก", 
      "พลัง", "ศรัทธา", "ความเชื่อ", "ความเพียร", "ความอดทน",
      "ความสำเร็จ", "ความดี", "ความจริง", "ความกล้า", "มิตรภาพ",
      "ครอบครัว", "ความสามัคคี", "สติปัญญา", "สุขภาพ", "การเรียนรู้",
      "การเติบโต", "ความเข้มแข็ง", "ความมุ่งมั่น", "ความตั้งใจ", "การให้อภัย"
    ];
    return selectedWords.length >= defaultWords.length;
  }
  
  // Check if all words from the database have been used
  const availableWords = wordEntries.map(entry => entry.word);
  const unusedWords = availableWords.filter(word => !selectedWords.includes(word));
  
  return unusedWords.length === 0;
};
