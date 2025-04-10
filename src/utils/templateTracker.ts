// ฟังก์ชันตรวจสอบว่า template ได้ถูกใช้ไปแล้วหรือยัง
export const isTemplateUsed = (word: string, template: string): boolean => {
  // ดึงข้อมูลการใช้ template จาก localStorage
  const storedData = localStorage.getItem('used-templates');
  if (!storedData) return false;
  
  try {
    const usedTemplates = JSON.parse(storedData);
    
    // ตรวจสอบว่ามีข้อมูลการใช้ template สำหรับคำนี้หรือไม่
    if (usedTemplates[word]) {
      return usedTemplates[word].includes(template);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking used templates:', error);
    return false;
  }
};

// ฟังก์ชันบันทึกการใช้ template
export const markTemplateAsUsed = (word: string, template: string): void => {
  // ดึงข้อมูลการใช้ template จาก localStorage
  const storedData = localStorage.getItem('used-templates');
  let usedTemplates: Record<string, string[]> = {};
  
  // ถ้ามีข้อมูลเดิม ให้แปลงเป็น object
  if (storedData) {
    try {
      usedTemplates = JSON.parse(storedData);
    } catch (error) {
      console.error('Error parsing used templates:', error);
    }
  }
  
  // ถ้ายังไม่มีข้อมูลการใช้ template สำหรับคำนี้ ให้สร้างใหม่
  if (!usedTemplates[word]) {
    usedTemplates[word] = [];
  }
  
  // เพิ่ม template ที่ใช้แล้วเข้าไปในรายการ
  if (!usedTemplates[word].includes(template)) {
    usedTemplates[word].push(template);
  }
  
  // บันทึกข้อมูลลงใน localStorage
  localStorage.setItem('used-templates', JSON.stringify(usedTemplates));
};

// ฟังก์ชันรีเซ็ตการใช้ template ทั้งหมด
export const resetUsedTemplates = (): void => {
  localStorage.removeItem('used-templates');
};

// ฟังก์ชันรีเซ็ตการใช้ template สำหรับคำที่ระบุ
export const resetUsedTemplatesForWord = (word: string): void => {
  // ดึงข้อมูลการใช้ template จาก localStorage
  const storedData = localStorage.getItem('used-templates');
  if (!storedData) return;
  
  try {
    const usedTemplates = JSON.parse(storedData);
    
    // ลบข้อมูลการใช้ template สำหรับคำที่ระบุ
    delete usedTemplates[word];
    
    // บันทึกข้อมูลลงใน localStorage
    localStorage.setItem('used-templates', JSON.stringify(usedTemplates));
  } catch (error) {
    console.error('Error resetting used templates for word:', error);
  }
};

// ฟังก์ชันดึง template ที่ยังไม่ถูกใช้สำหรับคำที่ระบุ
export const getAvailableTemplatesForWord = (word: string, templates: string[]): string[] => {
  // ดึงข้อมูลจาก word-suggestions แทน
  const storedData = localStorage.getItem('word-suggestions');
  let wordEntries = [];
  
  if (storedData) {
    try {
      wordEntries = JSON.parse(storedData);
      // ค้นหาคำในฐานข้อมูล
      const wordEntry = wordEntries.find((entry: any) => entry.word === word);
      
      if (wordEntry && wordEntry.templates && Array.isArray(wordEntry.templates)) {
        // ใช้ templates จาก word-suggestions
        templates = wordEntry.templates;
      }
    } catch (error) {
      console.error('Error parsing word suggestions:', error);
    }
  }
  
  // กรณีไม่มี templates
  if (!templates || !Array.isArray(templates) || templates.length === 0) {
    return [];
  }
  
  // กรอง template ที่ยังไม่ถูกใช้
  const unusedTemplates = templates.filter(template => !isTemplateUsed(word, template));
  
  // ถ้าทุก template ถูกใช้แล้ว ให้รีเซ็ตและเริ่มใช้ใหม่ทั้งหมด
  if (unusedTemplates.length === 0) {
    resetUsedTemplatesForWord(word);
    return templates; // คืนค่า templates ทั้งหมดหลังจากรีเซ็ต
  }
  
  return unusedTemplates;
};

// ฟังก์ชันดึง template ที่เคยถูกใช้สำหรับคำที่ระบุ
export const getUsedTemplates = (): Record<string, string[]> => {
  const storedData = localStorage.getItem('used-templates');
  
  if (storedData) {
    try {
      return JSON.parse(storedData);
    } catch (error) {
      console.error('Error parsing used templates:', error);
      return {};
    }
  }
  
  return {};
};

// เพิ่มฟังก์ชันดึงข้อมูลคำทั้งหมดพร้อมแม่แบบประโยค
export const getAllWordsWithTemplates = (): { word: string, templates: string[] }[] => {
  // ดึงข้อมูลจาก word-suggestions
  const storedData = localStorage.getItem('word-suggestions');
  
  if (storedData) {
    try {
      return JSON.parse(storedData);
    } catch (error) {
      console.error('Error parsing word suggestions:', error);
      return [];
    }
  }
  
  return [];
};
