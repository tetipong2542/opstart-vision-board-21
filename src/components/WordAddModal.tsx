
import { useState, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { WordEntry, parseTemplates } from "@/utils/wordModeration";

interface WordAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newWord: WordEntry) => void;
}

const WordAddModal = ({ isOpen, onClose, onSave }: WordAddModalProps) => {
  const [wordText, setWordText] = useState("");
  const [templateInput, setTemplateInput] = useState("");
  const [templates, setTemplates] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleAddTemplate = () => {
    if (!templateInput.trim()) {
      toast({
        title: "ข้อความว่างเปล่า",
        description: "กรุณาใส่แม่แบบประโยค",
        variant: "destructive"
      });
      return;
    }
    
    // Parse the template to ensure correct formatting
    const parsedTemplates = parseTemplates(templateInput);
    
    if (parsedTemplates.length === 0) {
      toast({
        title: "รูปแบบไม่ถูกต้อง",
        description: "แม่แบบประโยคไม่ถูกต้อง กรุณาตรวจสอบ",
        variant: "destructive"
      });
      return;
    }
    
    // Use the first parsed template
    const newTemplate = parsedTemplates[0];
    
    // Check if template already exists
    if (templates.includes(newTemplate)) {
      toast({
        title: "แม่แบบซ้ำ",
        description: "แม่แบบนี้มีอยู่แล้ว",
        variant: "destructive"
      });
      return;
    }
    
    // Add new template
    setTemplates([...templates, newTemplate]);
    setTemplateInput(""); // Clear input field
  };

  const handleDeleteTemplate = (index: number) => {
    const newTemplates = [...templates];
    newTemplates.splice(index, 1);
    setTemplates(newTemplates);
  };

  const handleSave = () => {
    // Validate fields
    if (!wordText.trim()) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาใส่คำ",
        variant: "destructive"
      });
      return;
    }
    
    // Prepare new word data
    const newWord: WordEntry = {
      word: wordText.trim(),
      templates: templates.length > 0 ? templates : [`\${บวก}\${${wordText.trim()}} คือสิ่งสำคัญในชีวิต`],
      isCustom: true
    };
    
    // Save changes
    onSave(newWord);
    
    // Clear form
    setWordText("");
    setTemplates([]);
    setTemplateInput("");
  };

  const insertSpecialTag = (tag: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const startPos = textarea.selectionStart || 0;
    const endPos = textarea.selectionEnd || 0;
    
    const newText = 
      templateInput.substring(0, startPos) + 
      tag + 
      templateInput.substring(endPos);
    
    setTemplateInput(newText);
    
    // Focus back to the textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = startPos + tag.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>เพิ่มคำใหม่</DialogTitle>
          <DialogDescription>
            เพิ่มคำและแม่แบบประโยคที่ใช้กับคำนี้
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="word">คำ</Label>
            <Input 
              id="word" 
              value={wordText} 
              onChange={(e) => setWordText(e.target.value)}
              placeholder="พิมพ์คำที่ต้องการ"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">แม่แบบประโยค</Label>
            <div className="flex gap-2 mb-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => insertSpecialTag("${คำ}")}
              >
                เพิ่ม $&#123;คำ&#125;
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => insertSpecialTag("${บวก}")}
              >
                เพิ่ม $&#123;บวก&#125;
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => insertSpecialTag("${กลาง}")}
              >
                เพิ่ม $&#123;กลาง&#125;
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => insertSpecialTag("${ลบ}")}
              >
                เพิ่ม $&#123;ลบ&#125;
              </Button>
            </div>
            <div className="flex gap-2">
              <Textarea 
                id="add-template-input"
                ref={textareaRef}
                value={templateInput} 
                onChange={(e) => setTemplateInput(e.target.value)}
                placeholder="พิมพ์แม่แบบประโยค เช่น '${บวก}การมี${คำ}ในชีวิตทำให้เรารู้สึกดีขึ้น'"
                rows={3}
              />
              <Button 
                type="button" 
                className="mt-auto" 
                onClick={handleAddTemplate}
              >
                เพิ่ม
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>แม่แบบที่บันทึกไว้</Label>
            {templates.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
                {templates.map((template, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                    <p className="text-sm break-words flex-1">{template}</p>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTemplate(index)}
                    >
                      ลบ
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">ยังไม่มีแม่แบบประโยค</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={handleSave}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WordAddModal;
