
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileIcon, UploadIcon, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface CvUploaderProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
}

export const CvUploader = ({ onFileSelect, isUploading }: CvUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
      onFileSelect(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive"
        });
        return;
      }
      
      setFile(droppedFile);
      onFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="p-5 h-full">
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold mb-4">Upload your CV</h3>
        
        <div 
          className={`
            flex flex-col items-center justify-center 
            border-2 border-dashed rounded-lg 
            p-8 text-center cursor-pointer
            transition-colors
            ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary hover:bg-secondary/50'}
            flex-grow
          `}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
              <p className="text-sm text-gray-500">Processing your CV...</p>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center">
              <FileIcon className="h-10 w-10 text-green-500 mb-2" />
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                Change file
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadIcon className="h-10 w-10 text-gray-400 mb-2" />
              <p className="font-medium">Drop your CV here</p>
              <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
              <p className="text-xs text-gray-400 mt-4">PDF files only, max 10MB</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
