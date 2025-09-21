import Upload from './components/Upload';
import FileList from './components/FileList';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

function AppContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-2">
                SecureShare
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
                Fast, secure, and easy file sharing platform. Upload, share, and manage your files with confidence.
              </p>
            </div>
            <div className="ml-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 mb-8 lg:mb-12">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <Upload />
          </div>
          
          {/* How to Use Section */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 h-fit transition-colors duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 rounded-lg p-2 mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">How to Use</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mr-3 mt-0.5 flex-shrink-0 transition-colors duration-300">1</span>
                  <p className="text-gray-700 dark:text-gray-300 text-sm transition-colors duration-300">Select a file from your device</p>
                </div>
                <div className="flex items-start">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mr-3 mt-0.5 flex-shrink-0 transition-colors duration-300">2</span>
                  <p className="text-gray-700 dark:text-gray-300 text-sm transition-colors duration-300">Optionally add your name</p>
                </div>
                <div className="flex items-start">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mr-3 mt-0.5 flex-shrink-0 transition-colors duration-300">3</span>
                  <p className="text-gray-700 dark:text-gray-300 text-sm transition-colors duration-300">Click upload to share instantly</p>
                </div>
                <div className="flex items-start">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mr-3 mt-0.5 flex-shrink-0 transition-colors duration-300">4</span>
                  <p className="text-gray-700 dark:text-gray-300 text-sm transition-colors duration-300">View and download files below</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 transition-colors duration-300">
                <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                  <span className="font-medium">Admin tip:</span> Use the Admin Panel to manage uploaded files
                </p>
              </div>
            </div>
          </div>
        </div>

        <FileList />
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
