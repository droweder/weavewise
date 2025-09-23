import React, { useState, useRef } from 'react';
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react';

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
  success = false,
  label,
  description
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
    // Reset the input value to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
    // Reset the input value to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFiles = (file: File) => {
    // Verificar tipo de arquivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (accept.includes('.xlsx') && !validTypes.includes(file.type)) {
      // Permitir tipos específicos se for Excel
      if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        alert('Por favor, selecione um arquivo Excel válido (.xlsx, .xls) ou CSV (.csv)');
        return;
      }
    }
    
    onFileSelect(file);
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : error 
              ? 'border-red-300 bg-red-50' 
              : success 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-2">
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Processando arquivo...</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center text-green-600">
              <CheckCircle className="h-8 w-8 mx-auto" />
              <p className="text-sm font-medium mt-2">Arquivo carregado com sucesso!</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center text-red-600">
              <AlertCircle className="h-8 w-8 mx-auto" />
              <p className="text-sm font-medium mt-2">Erro no upload</p>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <span className="relative font-medium text-blue-600 hover:text-blue-500">
                  Clique para fazer upload
                </span>
                <span className="pl-1">ou arraste e solte</span>
              </div>
              <p className="text-xs text-gray-500">
                {description}
              </p>
            </>
          )}
        </div>
      </div>
      
    </div>
  );
};
