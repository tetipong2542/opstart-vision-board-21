
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContributorStats } from "@/utils/wordModeration";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Smile, Meh, Frown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { analyzeSentimentFromSentence } from "@/utils/sentimentConsistency";

interface Contributor {
  name: string;
  count: number;
}

interface MotivationalSentence {
  word: string;
  sentence: string;
  contributor?: string;
  timestamp?: Date | number | string;
  polarity?: 'positive' | 'neutral' | 'negative';
  score?: number;
  template?: string;
  id?: string;
}

interface LeaderboardProps {
  contributors?: Contributor[];
  refreshTrigger?: number;
  allSentences?: MotivationalSentence[];
}

const fetchContributorStats = async (): Promise<Contributor[]> => {
  const stats = getContributorStats();
  return Object.entries(stats).map(([name, count]) => ({ name, count }));
};

const fetchMotivationalSentences = (): MotivationalSentence[] => {
  const stored = localStorage.getItem('motivation-sentences');
  if (stored) {
    try {
      const sentences = JSON.parse(stored);
      return analyzeSentencesByTemplate(sentences);
    } catch (error) {
      console.error("Error processing sentences:", error);
      return [];
    }
  }
  return [];
};

const removeDuplicateSentences = (sentences: MotivationalSentence[]): MotivationalSentence[] => {
  const uniqueMap = new Map<string, MotivationalSentence>();
  
  sentences.forEach(sentence => {
    const uniqueId = sentence.id || 
                    `${sentence.word}-${sentence.sentence}-${sentence.contributor || 'unknown'}-${
                      new Date(sentence.timestamp || new Date()).getTime()
                    }`;
    
    if (!uniqueMap.has(uniqueId) || 
        new Date(sentence.timestamp || 0).getTime() > 
        new Date(uniqueMap.get(uniqueId)!.timestamp || 0).getTime()) {
      
      const contributor = sentence.contributor ? sentence.contributor : 
                         localStorage.getItem('contributor-name') || 'ไม่ระบุชื่อ';
      
      uniqueMap.set(uniqueId, {
        ...sentence,
        contributor,
        id: uniqueId
      });
    }
  });
  
  return Array.from(uniqueMap.values());
};

const analyzeSentencesByTemplate = (sentences: MotivationalSentence[]): MotivationalSentence[] => {
  return sentences.map(sentence => {
    let polarity: 'positive' | 'neutral' | 'negative';
    let score: number;
    
    if (sentence.template) {
      const analysis = analyzeSentimentFromSentence("", sentence.template);
      polarity = analysis.sentiment;
      
      // กำหนดคะแนนตามเกณฑ์ใหม่
      if (polarity === 'positive') {
        score = 2;
      } else if (polarity === 'neutral') {
        score = 1;
      } else {
        score = -1;
      }
    } 
    else {
      const analysis = analyzeSentimentFromSentence(sentence.sentence);
      polarity = analysis.sentiment;
      
      // กำหนดคะแนนตามเกณฑ์ใหม่
      if (polarity === 'positive') {
        score = 2;
      } else if (polarity === 'neutral') {
        score = 1;
      } else {
        score = -1;
      }
    }
    
    return {
      ...sentence,
      polarity,
      score
    };
  });
};

const cleanText = (text: string): string => {
  return text
    .replace(/\$\{บวก\}/g, '')
    .replace(/\$\{กลาง\}/g, '')
    .replace(/\$\{ลบ\}/g, '');
};

const highlightWord = (sentence: string, word: string): React.ReactNode => {
  if (!sentence || !word) return cleanText(sentence);
  
  const cleanedSentence = cleanText(sentence);
  
  const parts = cleanedSentence.split(new RegExp(`(${word})`, 'gi'));
  
  return parts.map((part, index) => {
    if (part.toLowerCase() === word.toLowerCase()) {
      return (
        <span key={index} className="text-[#F97316] font-semibold">
          {part}
        </span>
      );
    }
    return part;
  });
};

const getSentimentIcon = (item: MotivationalSentence) => {
  const polarity = item.polarity || 'neutral';
  
  if (polarity === 'positive') return <Smile className="h-4 w-4 text-green-500" />;
  if (polarity === 'negative') return <Frown className="h-4 w-4 text-red-500" />;
  return <Meh className="h-4 w-4 text-blue-500" />;
};

const getBadgeVariant = (item: MotivationalSentence) => {
  const polarity = item.polarity || 'neutral';
  
  if (polarity === 'positive') return 'success';
  if (polarity === 'negative') return 'destructive';
  return 'secondary';
};

const Leaderboard = ({ contributors: propContributors, refreshTrigger, allSentences: propSentences }: LeaderboardProps) => {
  const { data: fetchedContributors = [], isLoading, refetch } = useQuery({
    queryKey: ['contributor-stats'],
    queryFn: fetchContributorStats,
    enabled: !propContributors,
    staleTime: 5000,
    gcTime: 10000,
  });

  const [motivationalSentences, setMotivationalSentences] = useState<MotivationalSentence[]>([]);
  const [statistics, setStatistics] = useState({
    totalSentences: 0,
    uniqueUsers: 0,
    positiveSentences: 0,
    neutralSentences: 0,
    negativeSentences: 0,
    longestSentence: { text: '', length: 0, contributor: '' }
  });

  const calculateStatistics = useCallback((sentences: MotivationalSentence[]) => {
    const uniqueUsers = new Set(sentences.map(s => s.contributor || 'Anonymous')).size;
    
    let positiveSentences = 0;
    let neutralSentences = 0;
    let negativeSentences = 0;
    let longestSentence = { text: '', length: 0, contributor: '' };
    
    sentences.forEach(sentence => {
      const polarity = sentence.polarity || 'neutral';
      
      if (polarity === 'positive') positiveSentences++;
      else if (polarity === 'negative') negativeSentences++;
      else neutralSentences++;
      
      const cleanedSentence = cleanText(sentence.sentence);
      
      if (cleanedSentence && cleanedSentence.length > longestSentence.length) {
        longestSentence = {
          text: cleanedSentence,
          length: cleanedSentence.length,
          contributor: sentence.contributor || 'Anonymous'
        };
      }
    });
    
    setStatistics({
      totalSentences: sentences.length,
      uniqueUsers,
      positiveSentences,
      neutralSentences,
      negativeSentences,
      longestSentence
    });
  }, []);

  const fetchAndUpdateSentences = useCallback(() => {
    if (!propSentences) {
      const sentences = fetchMotivationalSentences();
      const uniqueSentences = removeDuplicateSentences(sentences);
      setMotivationalSentences(uniqueSentences);
      calculateStatistics(uniqueSentences);
    }
  }, [propSentences, calculateStatistics]);

  useEffect(() => {
    if (refreshTrigger && !propContributors) {
      const debounceRefetch = setTimeout(() => {
        refetch();
        
        const sentences = propSentences ? analyzeSentencesByTemplate(propSentences) : fetchMotivationalSentences();
        const uniqueSentences = removeDuplicateSentences(sentences);
        setMotivationalSentences(uniqueSentences);
        calculateStatistics(uniqueSentences);
      }, 300);
      
      return () => clearTimeout(debounceRefetch);
    }
  }, [refreshTrigger, refetch, propContributors, propSentences, calculateStatistics]);

  useEffect(() => {
    if (propSentences) {
      const analyzedSentences = analyzeSentencesByTemplate(propSentences);
      const uniqueSentences = removeDuplicateSentences(analyzedSentences);
      setMotivationalSentences(uniqueSentences);
      calculateStatistics(uniqueSentences);
    }
  }, [propSentences, calculateStatistics]);

  useEffect(() => {
    fetchAndUpdateSentences();
    
    let debounceTimer: NodeJS.Timeout | null = null;
    
    const handleSentenceUpdate = () => {
      if (!propSentences) {
        if (debounceTimer) clearTimeout(debounceTimer);
        
        debounceTimer = setTimeout(() => {
          fetchAndUpdateSentences();
        }, 500);
      }
    };
    
    window.addEventListener('motivationalSentenceGenerated', handleSentenceUpdate);
    window.addEventListener('motivation-billboard-updated', handleSentenceUpdate);
    window.addEventListener('word-database-updated', handleSentenceUpdate);
    
    const intervalId = setInterval(fetchAndUpdateSentences, 5000);
    
    return () => {
      clearInterval(intervalId);
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('motivationalSentenceGenerated', handleSentenceUpdate);
      window.removeEventListener('motivation-billboard-updated', handleSentenceUpdate);
      window.removeEventListener('word-database-updated', handleSentenceUpdate);
    };
  }, [propSentences, fetchAndUpdateSentences]);

  const contributors = propContributors || fetchedContributors;
  const sortedContributors = [...contributors].sort((a, b) => b.count - a.count);
  const topContributors = sortedContributors.slice(0, 10);

  const uniqueLatestSentences = motivationalSentences.length > 0 ? 
    removeDuplicateSentences(motivationalSentences).slice(-5).reverse() : [];

  const getPolarityText = (item: MotivationalSentence): string => {
    const polarity = item.polarity || 'neutral';
    
    if (polarity === 'positive') return 'เชิงบวก';
    if (polarity === 'negative') return 'เชิงลบ';
    return 'กลาง';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">อันดับผู้ร่วมสร้างกำลังใจ</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-md bg-secondary/50 animate-pulse h-12"
                />
              ))}
            </div>
          ) : topContributors.length > 0 ? (
            <div className="space-y-2">
              {topContributors.map((contributor, index) => (
                <div
                  key={contributor.name}
                  className="flex items-center justify-between p-3 rounded-md bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold w-6 h-6 flex items-center justify-center bg-primary text-primary-foreground rounded-full">
                      {index + 1}
                    </span>
                    <span className="font-medium">{contributor.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {contributor.count} คำ
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">ยังไม่มีข้อมูล</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">สถิติทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-secondary rounded-md p-3 text-center">
              <p className="text-xl font-bold">{statistics.totalSentences}</p>
              <p className="text-sm text-muted-foreground">ประโยคทั้งหมด</p>
            </div>
            <div className="bg-secondary rounded-md p-3 text-center">
              <p className="text-xl font-bold">{statistics.uniqueUsers}</p>
              <p className="text-sm text-muted-foreground">ผู้ใช้ทั้งหมด</p>
            </div>
            <div className="bg-secondary rounded-md p-3 text-center">
              <div className="flex justify-center items-center gap-1">
                <Smile className="h-5 w-5 text-green-500" />
                <p className="text-xl font-bold">{statistics.positiveSentences}</p>
              </div>
              <p className="text-sm text-muted-foreground">เชิงบวก</p>
            </div>
            <div className="bg-secondary rounded-md p-3 text-center">
              <div className="flex justify-center items-center gap-1">
                <Meh className="h-5 w-5 text-blue-500" />
                <p className="text-xl font-bold">{statistics.neutralSentences}</p>
              </div>
              <p className="text-sm text-muted-foreground">กลาง</p>
            </div>
            <div className="bg-secondary rounded-md p-3 text-center">
              <div className="flex justify-center items-center gap-1">
                <Frown className="h-5 w-5 text-red-500" />
                <p className="text-xl font-bold">{statistics.negativeSentences}</p>
              </div>
              <p className="text-sm text-muted-foreground">เชิงลบ</p>
            </div>
          </div>
          
          {statistics.longestSentence.text && (
            <div className="mt-4 p-3 bg-secondary rounded-md">
              <p className="text-sm font-medium text-muted-foreground mb-1">ประโยคที่ยาวที่สุด:</p>
              <p className="font-medium">{statistics.longestSentence.text}</p>
              <p className="text-xs text-muted-foreground mt-1">โดย: {statistics.longestSentence.contributor}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {uniqueLatestSentences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">ประโยคกำลังใจล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ความรู้สึก</TableHead>
                  <TableHead>คะแนน</TableHead>
                  <TableHead>ผู้ให้กำลังใจ</TableHead>
                  <TableHead>คำ</TableHead>
                  <TableHead>ประโยคกำลังใจ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uniqueLatestSentences.map((item, index) => (
                  <TableRow key={`latest-${index}-${item.id || item.word}-${item.timestamp}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(item)}
                        <Badge variant={getBadgeVariant(item)}>
                          {getPolarityText(item)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.score !== undefined ? item.score : 
                       item.polarity === 'positive' ? 2 : 
                       item.polarity === 'neutral' ? 1 : -1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.contributor || 'ไม่ระบุชื่อ'}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {item.word}
                    </TableCell>
                    <TableCell>
                      {highlightWord(item.sentence, item.word)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Leaderboard;
