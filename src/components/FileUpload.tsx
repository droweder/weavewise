import React, { useCallback, useState } from 'react';
import { Upload, FileX, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  loading?: boolean;
  error?: string;
  success?: boolean;
  label: string;
  description: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = '.xlsx,.xls',
  loading = false,
  error,
  success,
  label,
  description
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect]);

  const getBorderColor = () => {
    if (error) return 'border-red-300';
    if (success) return 'border-green-300';
    if (dragActive) return 'border-blue-400';
    return 'border-gray-300';
  };

  const getBackgroundColor = () => {
    if (error) return 'bg-red-50';
    if (success) return 'bg-green-50';
    if (dragActive) return 'bg-blue-50';
    return 'bg-gray-50';
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${getBorderColor()} ${getBackgroundColor()} ${
          !loading ? 'hover:bg-gray-100' : ''
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="text-center">
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Processando arquivo...</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <p className="mt-2 text-sm text-green-600">Arquivo carregado com sucesso</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <p className="mt-2 text-sm text-red-600">{error}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium text-blue-600">Clique para selecionar</span> ou arraste o arquivo aqui
              </p>
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};