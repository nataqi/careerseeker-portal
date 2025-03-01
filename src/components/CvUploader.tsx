
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface CvUploaderProps {
  onFileUploaded: (file: File) => void;
}

const CvUploader = ({ onFileUploaded }: CvUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      onFileUploaded(selectedFile);
      toast.success('CV uploaded successfully');
    } else {
      toast.error('Please upload a PDF file');
    }
  }, [onFileUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  const removeFile = () => {
    setFile(null);
  };

  return (
    <Card className="p-4 bg-white shadow-sm">
      <div className="text-lg font-semibold mb-3">Upload Your CV</div>
      
      {!file ? (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-accent' : 'border-gray-300 hover:border-primary'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">
            {isDragActive
              ? "Drop your CV here"
              : "Drag & drop your CV (PDF) here, or click to select"}
          </p>
        </div>
      ) : (
        <div className="bg-accent rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-6 w-6 mr-2 text-primary" />
              <div className="text-sm font-medium truncate max-w-[200px]">
                {file.name}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={removeFile}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CvUploader;
