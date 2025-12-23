
import React, { useState } from 'react';
import { Upload, FileText, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { DataRow } from '../types';

interface DataStudioProps {
  data: DataRow[];
  headers: string[];
  onFileUpload: (file: File) => void;
}

export const DataStudio: React.FC<DataStudioProps> = ({ data, headers, onFileUpload }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const filteredData = data.filter(row => 
    headers.some(h => String(row[h]).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  if (data.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-full bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="bg-white dark:bg-gray-800/30 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center max-w-xl w-full hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all group shadow-sm">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Drop your dataset here</h3>
          <p className="text-gray-500 text-sm mb-6">Support for CSV and JSON.</p>
          <label className="inline-flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-md">
            <span>Browse Files</span>
            <input type="file" className="hidden" accept=".csv,.json" onChange={handleFileChange} />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors">
      {/* Toolbar */}
      <div className="h-14 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4">
            <h2 className="text-gray-900 dark:text-white font-medium">Data Preview</h2>
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 font-medium">{filteredData.length} Rows</span>
        </div>
        
        <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-transparent rounded-lg py-1.5 pl-9 pr-4 text-sm focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white w-64 placeholder-gray-400 dark:placeholder-gray-600 outline-none transition-all"
                />
            </div>
            <label className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 transition-colors" title="Upload New">
                <Upload className="w-4 h-4" />
                <input type="file" className="hidden" accept=".csv,.json" onChange={handleFileChange} />
            </label>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm transition-colors">
            <tr>
              {headers.map(h => (
                <th key={h} className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 transition-colors">
            {paginatedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-blue-50/30 dark:hover:bg-gray-800/50 transition-colors">
                {headers.map(h => (
                  <td key={`${idx}-${h}`} className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                    {row[h] !== null && row[h] !== undefined ? String(row[h]) : <span className="text-gray-400 dark:text-gray-600 italic">null</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="h-12 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-6 shrink-0">
        <span className="text-xs text-gray-500 dark:text-gray-500">Page {currentPage} of {totalPages || 1}</span>
        <div className="flex gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(c => c - 1)}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(c => c + 1)}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};