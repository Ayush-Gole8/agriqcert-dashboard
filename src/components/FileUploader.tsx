import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, File, Image, FileText, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  url?: string;
}

interface FileUploaderProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onFilesChange: (files: File[]) => void;
  className?: string;
}

export function FileUploader({
  accept = 'image/*,application/pdf',
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
  onFilesChange,
  className,
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    setError(null);

    const fileArray = Array.from(newFiles);
    
    // Validate file count
    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate and process files
    const validFiles: FileWithProgress[] = [];
    for (const file of fileArray) {
      if (file.size > maxSize) {
        setError(`${file.name} exceeds ${maxSize / 1024 / 1024}MB limit`);
        continue;
      }
      validFiles.push({
        file,
        progress: 0,
        status: 'pending',
      });
    }

    // Simulate upload progress
    validFiles.forEach((fileItem, index) => {
      setTimeout(() => {
        const interval = setInterval(() => {
          setFiles(prev => prev.map(f => {
            if (f.file === fileItem.file) {
              const newProgress = Math.min(f.progress + 20, 100);
              return {
                ...f,
                progress: newProgress,
                status: newProgress === 100 ? 'complete' : 'uploading',
              };
            }
            return f;
          }));
        }, 150);

        setTimeout(() => clearInterval(interval), 900);
      }, index * 200);
    });

    setFiles(prev => [...prev, ...validFiles]);
    onFilesChange([...files.map(f => f.file), ...validFiles.map(f => f.file)]);
  }, [files, maxFiles, maxSize, onFilesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = useCallback((fileToRemove: File) => {
    setFiles(prev => prev.filter(f => f.file !== fileToRemove));
    onFilesChange(files.filter(f => f.file !== fileToRemove).map(f => f.file));
  }, [files, onFilesChange]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type === 'application/pdf') return FileText;
    return File;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer",
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload files"
        />
        
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
            isDragOver ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <Upload className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-medium">
            {isDragOver ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            or click to browse • Max {maxSize / 1024 / 1024}MB per file
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2" aria-label="Uploaded files">
          {files.map((fileItem, index) => {
            const FileIcon = getFileIcon(fileItem.file.type);
            
            return (
              <motion.li
                key={`${fileItem.file.name}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${fileItem.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {fileItem.status === 'complete' ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        `${fileItem.progress}%`
                      )}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeFile(fileItem.file)}
                  aria-label={`Remove ${fileItem.file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
