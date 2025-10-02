import { useState, useRef } from "react";

export default function Upload({ onUploadSuccess }) {
  const [files, setFiles] = useState([]);
  const [uploader, setUploader] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadMode, setUploadMode] = useState('files'); // 'files' or 'folder'
  const [showTextModal, setShowTextModal] = useState(false);
  const [textData, setTextData] = useState({ title: '', content: '', author: '' });
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleTextShare = async () => {
    if (!textData.title.trim() || !textData.content.trim()) {
      alert("Please provide both title and content for the text");
      return;
    }

    setUploading(true);
    
    try {
      const response = await fetch("https://kapa-share-backend.onrender.com/api/files/share-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: textData.title.trim(),
          content: textData.content.trim(),
          author: textData.author.trim() || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Text share failed: ${error.error}`);
        setUploading(false);
        return;
      }
      
      alert("Text shared successfully!");
      setTextData({ title: '', content: '', author: '' });
      setShowTextModal(false);
      
      // Refresh the file list immediately
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      alert("Text share failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return alert("Please select at least one file first");

    setUploading(true);
    
    try {
      // Upload files one by one
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        if (uploader.trim()) formData.append("uploader", uploader.trim());

        const response = await fetch("https://kapa-share-backend.onrender.com/api/files/upload", {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          alert(`Upload failed for ${file.name}: ${error.error}`);
          setUploading(false);
          return;
        }
      }
      
      alert(`Successfully uploaded ${files.length} file(s)!`);
      setFiles([]);
      setUploader("");
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
      
      // Refresh the file list immediately
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(droppedFiles)]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8 transition-colors duration-300">
      <div className="flex items-center mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 rounded-lg p-2 mr-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Upload File</h2>
      </div>
      
      {/* Drag and Drop Area */}
      <div 
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          dragOver 
            ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : files.length > 0 
              ? 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          multiple
          onChange={(e) => {
            const selectedFiles = Array.from(e.target.files);
            setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
          }}
          className="hidden"
          accept="*/*"
        />
        
        <input 
          ref={folderInputRef}
          type="file" 
          webkitdirectory="true"
          onChange={(e) => {
            const selectedFiles = Array.from(e.target.files);
            setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
          }}
          className="hidden"
        />
        
        {files.length === 0 ? (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center transition-colors duration-300">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-1 transition-colors duration-300">
                {dragOver ? 'Drop your files here' : `Choose ${uploadMode === 'folder' ? 'a folder' : 'files'} or drag them here`}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                Supports all file types • Max 10MB per file • Multiple files allowed
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-lg transition-colors duration-300 ${
                  uploadMode === 'files' 
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Browse Files
              </button>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-lg transition-colors duration-300 ${
                  uploadMode === 'folder' 
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Browse Folder
              </button>
              <button
                type="button"
                onClick={() => setShowTextModal(true)}
                className="inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-lg transition-colors duration-300 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 bg-white dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Share Text
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center transition-colors duration-300">
              <svg className="w-8 h-8 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                {files.length} file(s) selected
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1 text-sm">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white truncate">{file.name}</p>
                      <p className="text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
                      }}
                      className="ml-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-300"
              >
                Add more files
              </button>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-300"
              >
                Add folder
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFiles([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  if (folderInputRef.current) folderInputRef.current.value = '';
                }}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors duration-300"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Name Input */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
          Your Name <span className="text-gray-400 dark:text-gray-500">(Optional)</span>
        </label>
        <input 
          type="text" 
          value={uploader}
          onChange={(e) => setUploader(e.target.value)}
          placeholder="Enter your name..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700"
        />
      </div>

      {/* Upload Button */}
      <button 
        onClick={handleUpload} 
        disabled={uploading || files.length === 0}
        className={`w-full mt-6 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
          uploading || files.length === 0 
            ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 hover:from-blue-600 hover:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
        }`}
      >
        {uploading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading files...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Files'}
          </div>
        )}
      </button>
      
      {/* Text Share Modal */}
      {showTextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 rounded-lg p-2 mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Share Text</h3>
                </div>
                <button
                  onClick={() => setShowTextModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={textData.title}
                  onChange={(e) => setTextData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter title for your text..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 transition-colors duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700"
                />
              </div>
              
              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={textData.content}
                  onChange={(e) => setTextData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your text content..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 transition-colors duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 resize-vertical"
                />
              </div>
              
              {/* Author Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Author <span className="text-gray-400 dark:text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={textData.author}
                  onChange={(e) => setTextData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Enter author name..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 transition-colors duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowTextModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleTextShare}
                disabled={uploading || !textData.title.trim() || !textData.content.trim()}
                className={`px-6 py-2 rounded-lg font-semibold text-white transition-all duration-200 ${
                  uploading || !textData.title.trim() || !textData.content.trim()
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 hover:from-green-600 hover:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                }`}
              >
                {uploading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sharing...
                  </div>
                ) : (
                  'Share Text'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
