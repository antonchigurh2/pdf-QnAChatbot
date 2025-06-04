'use client';
import * as React from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';

interface UploadedFile {
  name: string;
  size: number;
  uploadedAt: Date;
}

const FileUploadComponent: React.FC = () => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = React.useState('');
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setUploadStatus('error');
      setUploadMessage('Please select a PDF file only.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setUploadStatus('error');
      setUploadMessage('File size must be less than 10MB.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setUploadMessage('');

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('http://localhost:8000/upload/pdf', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('success');
        setUploadMessage(`"${file.name}" uploaded successfully!`);
        
        // Add to uploaded files list
        const newFile: UploadedFile = {
          name: file.name,
          size: file.size,
          uploadedAt: new Date()
        };
        setUploadedFiles(prev => [newFile, ...prev]);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setUploadStatus('idle');
          setUploadMessage('');
        }, 3000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage('Failed to upload file. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input value to allow same file upload
    event.target.value = '';
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      handleFileUpload(pdfFile);
    } else {
      setUploadStatus('error');
      setUploadMessage('Please drop a PDF file only.');
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearStatus = () => {
    setUploadStatus('idle');
    setUploadMessage('');
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          Document Upload
        </h2>
        <p className="text-slate-400">Upload PDF documents to chat with them</p>
      </div>

      {/* Upload Area */}
      <div className="mb-6">
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
            ${isDragOver 
              ? 'border-blue-400 bg-blue-900/20 scale-105' 
              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'
            }
            ${isUploading ? 'pointer-events-none opacity-75' : ''}
          `}
          onClick={handleButtonClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading}
          />
          
          <div className="flex flex-col items-center gap-4">
            {isUploading ? (
              <div className="p-4 bg-blue-600/20 rounded-full">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
            ) : (
              <div className="p-4 bg-slate-700 rounded-full group-hover:bg-slate-600 transition-colors">
                <Upload className="w-8 h-8 text-slate-300" />
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {isUploading ? 'Uploading...' : isDragOver ? 'Drop PDF here' : 'Upload PDF File'}
              </h3>
              <p className="text-slate-400 text-sm">
                {isUploading 
                  ? 'Please wait while we process your document' 
                  : 'Drag and drop or click to select • Max 10MB'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {uploadStatus !== 'idle' && (
          <div className={`
            mt-4 p-4 rounded-lg border flex items-start gap-3
            ${uploadStatus === 'success' 
              ? 'bg-green-900/20 border-green-700 text-green-300' 
              : 'bg-red-900/20 border-red-700 text-red-300'
            }
          `}>
            {uploadStatus === 'success' ? (
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium">{uploadMessage}</p>
            </div>
            <button
              onClick={clearStatus}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="flex-1 overflow-hidden">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Uploaded Documents ({uploadedFiles.length})
          </h3>
          
          <div className="space-y-3 overflow-y-auto max-h-96">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 bg-red-600/20 rounded-lg flex-shrink-0">
                      <FileText className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-white truncate">{file.name}</h4>
                      <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{file.uploadedAt.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-slate-400 hover:text-red-400 transition-colors p-1"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {uploadedFiles.length === 0 && uploadStatus === 'idle' && !isUploading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No documents uploaded yet</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;