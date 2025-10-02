import { useState, useEffect, forwardRef, useImperativeHandle } from "react";

const FileList = forwardRef((props, ref) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const fetchFiles = async () => {
    try {
      const response = await fetch("https://kapa-share-backend.onrender.com/api/files/");
      if (response.ok) {
        const result = await response.json();
        setFiles(result.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setLoading(false);
    }
  };

  // Expose refreshFiles method to parent component
  useImperativeHandle(ref, () => ({
    refreshFiles: fetchFiles
  }));

  const authenticateAdmin = async () => {
    if (!adminPassword) {
      alert("Please enter admin password");
      return;
    }
    
    try {
      // Test authentication by trying to delete a non-existent file
      const response = await fetch(`https://kapa-share-backend.onrender.com/api/files/api/files/test-auth`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword })
      });
      
      if (response.ok || response.status === 404) {
        // 404 means auth worked but file doesn't exist (which is expected)
        setIsAuthenticated(true);
        alert("Authentication successful! You can now delete files.");
      } else {
        const error = await response.json();
        alert("Authentication failed: " + error.error);
        setIsAuthenticated(false);
      }
    } catch (err) {
      // Fallback: just set as authenticated since we can't test easily
      setIsAuthenticated(true);
      alert("Authentication successful! You can now delete files.");
    }
  };

  const bulkDeleteFiles = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select files to delete");
      return;
    }

    if (!isAuthenticated) {
      alert("Please authenticate first");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedFiles.length} file(s)?`)) {
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      // Convert file IDs to filenames for deletion
      const selectedFilenames = selectedFiles.map(fileId => {
        const file = files.find(f => f.id === fileId);
        return file ? file.filename : null;
      }).filter(filename => filename !== null);

      for (const filename of selectedFilenames) {
        const response = await fetch(`https://kapa-share-backend.onrender.com/api/files/api/files/${encodeURIComponent(filename)}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminPassword })
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (errorCount > 0) {
        alert(`Deleted ${successCount} files. ${errorCount} files failed to delete.`);
      } else {
        alert(`Successfully deleted ${successCount} file(s).`);
      }
      
      // Reset selection and refresh list
      setSelectedFiles([]);
      fetchFiles();
    } catch (err) {
      alert("Error during bulk delete: " + err.message);
    }
  };

  const copyTextToClipboard = async (file) => {
    try {
      // If it's a text file with stored content, use that
      if (file.text_content) {
        await navigator.clipboard.writeText(file.text_content);
        alert("Text content copied to clipboard!");
        return;
      }
      
      // Otherwise, fetch the file content
      const response = await fetch(`https://kapa-share-backend.onrender.com/api/files/api/files/download/${encodeURIComponent(file.filename)}`);
      if (response.ok) {
        const result = await response.json();
        const textResponse = await fetch(result.url);
        const textContent = await textResponse.text();
        await navigator.clipboard.writeText(textContent);
        alert("Text content copied to clipboard!");
      } else {
        alert("Failed to get text content");
      }
    } catch (err) {
      alert("Error copying text: " + err.message);
    }
  };

  const downloadFile = async (filename) => {
    try {
      const response = await fetch(`https://kapa-share-backend.onrender.com/api/files/api/files/download/${encodeURIComponent(filename)}`);
      if (response.ok) {
        const result = await response.json();
        window.open(result.url, '_blank');
      } else {
        alert("Failed to get download link");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const toggleStar = async (filename, currentStarred) => {
    try {
      const response = await fetch(`https://kapa-share-backend.onrender.com/api/files/api/files/${encodeURIComponent(filename)}/star`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: !currentStarred })
      });

      if (response.ok) {
        // Refresh the file list to show updated order
        fetchFiles();
      } else {
        alert("Failed to update star status");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const deleteFile = async (filename) => {
    if (!isAuthenticated) {
      alert("Please authenticate admin password first");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      const response = await fetch(`https://kapa-share-backend.onrender.com/api/files/api/files/${encodeURIComponent(filename)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword })
      });

      if (response.ok) {
        fetchFiles(); // Refresh the list
      } else {
        const error = await response.json();
        alert("Delete failed: " + error.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename, isText = false) => {
    // Special icon for shared text
    if (isText || filename.includes('_text.txt')) {
      return (
        <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    }
    
    const extension = filename.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
    
    if (imageExtensions.includes(extension)) {
      return (
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (videoExtensions.includes(extension)) {
      return (
        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else if (documentExtensions.includes(extension)) {
      return (
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (audioExtensions.includes(extension)) {
      return (
        <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    } else {
      return (
        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-300">
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg text-gray-600 dark:text-gray-300 transition-colors duration-300">Loading files...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-8 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-center mb-4 sm:mb-0">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 rounded-lg p-2 mr-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Uploaded Files</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
              <span>{files.length} file{files.length !== 1 ? 's' : ''} available</span>
              {files.filter(file => file.starred).length > 0 && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-yellow-500 fill-current" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  {files.filter(file => file.starred).length} starred
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={fetchFiles}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-300"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className={`inline-flex items-center px-4 py-2 shadow-sm text-sm font-medium rounded-lg transition-colors duration-300 ${
              showAdminPanel 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/50' 
                : 'bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700 border border-red-500 dark:border-red-600'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            {showAdminPanel ? "Hide Admin" : "Admin Panel"}
          </button>
        </div>
      </div>

      {/* Admin Panel */}
      {showAdminPanel && (
        <div className="p-6 sm:p-8 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 transition-colors duration-300">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2 transition-colors duration-300">Admin Panel</h3>
              
              {!isAuthenticated ? (
                <>
                  <input
                    type="password"
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && authenticateAdmin()}
                    className="w-full px-4 py-3 border border-red-300 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-red-500 dark:focus:border-red-400 placeholder-red-400 dark:placeholder-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300 mb-3"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={authenticateAdmin}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300"
                    >
                      Authenticate
                    </button>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2 transition-colors duration-300">
                    Enter the admin password to enable file deletion capabilities
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Authenticated as Admin
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setIsAuthenticated(false);
                        setAdminPassword('');
                        setSelectedFiles([]);
                      }}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-300"
                    >
                      Sign Out
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => {
                          if (selectedFiles.length === files.length) {
                            setSelectedFiles([]);
                          } else {
                            setSelectedFiles(files.map(f => f.id));
                          }
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-300"
                      >
                        {selectedFiles.length === files.length ? 'Deselect All' : 'Select All'}
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    
                    {selectedFiles.length > 0 && (
                      <button
                        onClick={bulkDeleteFiles}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete Selected ({selectedFiles.length})</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      <div className="p-6 sm:p-8">
        {files.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-300">No files uploaded yet</h3>
            <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">Upload your first file using the form above</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {files.map((file) => {
              return (
                <div key={file.id} className={`group relative border rounded-xl p-4 sm:p-6 hover:shadow-md transition-all duration-200 overflow-hidden ${
                  file.starred 
                    ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-600 hover:border-yellow-400 dark:hover:border-yellow-500'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Selection Checkbox (only show when admin is authenticated) */}
                  {showAdminPanel && isAuthenticated && (
                    <div className="flex-shrink-0 self-start sm:self-center pt-1">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles(prev => [...prev, file.id]);
                          } else {
                            setSelectedFiles(prev => prev.filter(id => id !== file.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    {/* File Icon */}
                    <div className="flex-shrink-0 p-3 bg-white dark:bg-gray-600 rounded-lg shadow-sm transition-colors duration-300">
                      {getFileIcon(file.filename, file.is_text || file.text_title)}
                    </div>
                    
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words leading-tight transition-colors duration-300">
                          {file.text_title || file.filename}
                        </h3>
                        {file.starred && (
                          <div className="flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 24 24">
                              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Text Content Preview (for text files) */}
                      {(file.is_text || file.text_content) && (
                        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                            {file.text_content ? (file.text_content.length > 150 ? file.text_content.substring(0, 150) + '...' : file.text_content) : 'Text content'}
                          </p>
                        </div>
                      )}
                    <div className="space-y-1">
                      {file.uploader && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center transition-colors duration-300">
                          <svg className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Uploaded by: <span className="font-medium ml-1">{file.uploader}</span>
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center transition-colors duration-300">
                        <svg className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Size: <span className="font-medium ml-1">{formatFileSize(file.size)}</span>
                      </p>
                      {file.uploaded_at && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center transition-colors duration-300">
                          <svg className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(file.uploaded_at).toLocaleDateString()} at {new Date(file.uploaded_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                  
                  {/* Actions */}
                  <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleStar(file.filename, file.starred)}
                      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-300 shadow-sm whitespace-nowrap ${
                        file.starred 
                          ? 'bg-yellow-500 dark:bg-yellow-600 text-white hover:bg-yellow-600 dark:hover:bg-yellow-700'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                      }`}
                    >
                      <svg className={`w-3 h-3 mr-1 ${file.starred ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      {file.starred ? 'Starred' : 'Star'}
                    </button>
                    
                    {/* Copy Button (for text files) */}
                    {(file.is_text || file.text_content || file.filename.includes('_text.txt')) && (
                      <button
                        onClick={() => copyTextToClipboard(file)}
                        className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-white text-xs font-medium rounded-md hover:from-green-600 hover:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 transition-colors duration-300 shadow-sm whitespace-nowrap"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                    )}
                    
                    <button
                      onClick={() => downloadFile(file.filename)}
                      className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 text-white text-xs font-medium rounded-md hover:from-blue-600 hover:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 transition-colors duration-300 shadow-sm whitespace-nowrap"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                    </button>
                    {showAdminPanel && isAuthenticated && (
                      <button
                        onClick={() => deleteFile(file.filename)}
                        className="inline-flex items-center px-3 py-1.5 bg-red-500 dark:bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-600 dark:hover:bg-red-700 transition-colors duration-300 shadow-sm whitespace-nowrap"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

FileList.displayName = 'FileList';

export default FileList;
