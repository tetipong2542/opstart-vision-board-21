
import { useEffect, useState, useCallback } from "react";
import Layout from "@/layouts/Layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Leaderboard from "@/components/Leaderboard";
import StatsDashboard from "@/components/StatsDashboard";
import MoodReport from "@/components/MoodReport";

interface MotivationalSentence {
  word: string;
  sentence: string;
  template?: string;
  contributor?: string;
  timestamp: Date | string | number;
  polarity?: 'positive' | 'neutral' | 'negative';
  score?: number;
  id?: string;
}

const LeaderboardPage = () => {
  const [sentences, setSentences] = useState<MotivationalSentence[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // ปรับปรุงฟังก์ชั่น removeDuplicateSentences ให้มีการจัดการ ID ที่ดีขึ้น
  const removeDuplicateSentences = useCallback((sentences: MotivationalSentence[]): MotivationalSentence[] => {
    const uniqueMap = new Map();
    
    sentences.forEach(sentence => {
      // กำหนด uniqueId ที่เฉพาะเจาะจงมากขึ้น
      const uniqueId = sentence.id || 
                      `${sentence.word}-${sentence.sentence}-${sentence.contributor || 'unknown'}-${
                        new Date(sentence.timestamp).getTime()
                      }`;
      
      // ตรวจสอบว่ามีอยู่แล้วหรือไม่ และมี timestamp ใหม่กว่าหรือไม่
      if (!uniqueMap.has(uniqueId) || 
          new Date(sentence.timestamp).getTime() > new Date(uniqueMap.get(uniqueId).timestamp).getTime()) {
        
        // เพิ่มการตรวจสอบและรับรองค่า contributor
        const safeContributor = sentence.contributor && sentence.contributor.trim() ? 
                              sentence.contributor.trim() : 'ไม่ระบุชื่อ';
        
        uniqueMap.set(uniqueId, {
          ...sentence,
          contributor: safeContributor,
          id: uniqueId
        });
      }
    });
    
    return Array.from(uniqueMap.values());
  }, []);

  // ฟังก์ชั่นดึงข้อมูล polarity และ score จากฐานข้อมูล
  const getWordPolarityFromDatabase = useCallback((word: string): { polarity: 'positive' | 'neutral' | 'negative', score: number } => {
    let database: any[] = [];
    try {
      const storedData = localStorage.getItem("word-polarity-database");
      if (storedData) {
        database = JSON.parse(storedData);
      }
    } catch (e) {
      console.error("Error loading word database:", e);
    }
    
    const foundWord = database.find(w => w.word === word);
    if (foundWord) {
      return {
        polarity: foundWord.polarity,
        score: foundWord.score
      };
    }
    
    // ค่าเริ่มต้นถ้าไม่พบในฐานข้อมูล
    return { polarity: 'neutral', score: 0 };
  }, []);
  
  const normalizeScoreByPolarity = useCallback((sentences: MotivationalSentence[]): MotivationalSentence[] => {
    return sentences.map(sentence => {
      // หาข้อมูลจากฐานข้อมูล
      const wordInfo = getWordPolarityFromDatabase(sentence.word);
      
      // ถ้ามี score อยู่แล้วให้ใช้ค่าที่มี แต่ถ้าไม่มีให้ใช้จากฐานข้อมูล
      const score = sentence.score !== undefined ? sentence.score : wordInfo.score;
      
      // กำหนด polarity ตาม score เพื่อความสอดคล้อง
      let polarity: 'positive' | 'neutral' | 'negative';
      if (score > 0) {
        polarity = 'positive';
      } else if (score < 0) {
        polarity = 'negative';
      } else {
        polarity = 'neutral';
      }
      
      // ตรวจสอบและกำหนดชื่อผู้ร่วมสร้าง
      const contributor = sentence.contributor && sentence.contributor.trim() ? 
                         sentence.contributor.trim() : 'ไม่ระบุชื่อ';
      
      return { 
        ...sentence, 
        polarity: polarity,
        score: score,
        contributor: contributor
      };
    });
  }, [getWordPolarityFromDatabase]);
  
  // สร้างฟังก์ชันแยกสำหรับการดึงข้อมูล
  const fetchSentences = useCallback(() => {
    try {
      const stored = localStorage.getItem('motivation-sentences');
      if (stored) {
        const parsedData = JSON.parse(stored);
        const sentences = Array.isArray(parsedData) ? parsedData : [parsedData];
        
        const uniqueSentences = removeDuplicateSentences(sentences);
        
        const normalizedSentences = normalizeScoreByPolarity(uniqueSentences);
        
        const sortedSentences = normalizedSentences.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeB - timeA;
        });
        
        setSentences(sortedSentences);
      }
    } catch (error) {
      console.error("Error fetching sentences:", error);
    }
  }, [removeDuplicateSentences, normalizeScoreByPolarity]);
  
  useEffect(() => {
    fetchSentences();
    
    const handleUpdate = () => {
      fetchSentences();
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('motivationalSentenceGenerated', handleUpdate);
    window.addEventListener('word-database-updated', handleUpdate);
    window.addEventListener('motivation-billboard-updated', handleUpdate);
    
    // ลดความถี่เป็น 5 วินาที
    const intervalId = setInterval(fetchSentences, 5000);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('motivationalSentenceGenerated', handleUpdate);
      window.removeEventListener('word-database-updated', handleUpdate);
      window.removeEventListener('motivation-billboard-updated', handleUpdate);
    };
  }, [fetchSentences]);

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">อันดับและสถิติ</h1>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
            <TabsTrigger value="stats">รายงานละเอียด</TabsTrigger>
            <TabsTrigger value="moods">บันทึกตามความรู้สึก</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            <Leaderboard 
              refreshTrigger={refreshTrigger} 
              allSentences={sentences}
            />
          </TabsContent>
          
          <TabsContent value="stats" className="space-y-6 animate-fade-in">
            <StatsDashboard sentences={sentences} />
          </TabsContent>
          
          <TabsContent value="moods" className="space-y-6 animate-fade-in">
            <MoodReport sentences={sentences} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default LeaderboardPage;
