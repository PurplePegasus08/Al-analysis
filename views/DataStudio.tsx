
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Upload, Search, ChevronLeft, ChevronRight, Sigma, 
  BarChart3, ArrowUp, ArrowDown, Activity, Filter, X, CheckSquare, Square, ListFilter,
  GripHorizontal,
  ArrowRightLeft,
  AlertCircle,
  Hash,
  Type,
  CheckCircle2
} from 'lucide-react';
import { DataRow } from '../types';

interface DataStudioProps {
  data: DataRow[];
  headers: string[];
  onFileUpload: (file: File) => void;
}

interface ColumnStats {
  header: string;
  type: 'number' | 'string' | 'boolean';
  mean?: number;
  median?: number;
  min?: string | number;
  max?: string | number;
  validCount: number;
  missingCount: number;
  totalRows: number;
}

export const DataStudio: React.FC<DataStudioProps> = ({ data, headers: initialHeaders, onFileUpload }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<any>>>({});
  const [filterSearch, setFilterSearch] = useState('');
  
  const [orderedHeaders, setOrderedHeaders] = useState<string[]>(initialHeaders);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizingCol, setResizingCol] = useState<{ header: string; startX: number; startWidth: number } | null>(null);
  const [draggedHeader, setDraggedHeader] = useState<string | null>(null);
  const [dragOverHeader, setDragOverHeader] = useState<string | null>(null);

  const rowsPerPage = 50;
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrderedHeaders(initialHeaders);
  }, [initialHeaders]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingCol) return;
      const deltaX = e.clientX - resizingCol.startX;
      const newWidth = Math.max(80, resizingCol.startWidth + deltaX);
      setColumnWidths(prev => ({ ...prev, [resizingCol.header]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizingCol(null);
      document.body.style.cursor = 'default';
    };

    if (resizingCol) {
      document.body.style.cursor = 'col-resize';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setActiveFilterCol(null);
        setFilterSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const uniqueColumnValues = useMemo(() => {
    const map: Record<string, any[]> = {};
    orderedHeaders.forEach(h => {
      const values = Array.from(new Set(data.map(r => r[h])));
      map[h] = values.sort((a, b) => String(a).localeCompare(String(b)));
    });
    return map;
  }, [data, orderedHeaders]);

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchesGlobal = orderedHeaders.some(h => 
        String(row[h]).toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!matchesGlobal) return false;

      return Object.entries(columnFilters).every(([col, selectedSet]) => {
        const s = selectedSet as Set<any>;
        if (s.size === 0) return true;
        return s.has(row[col]);
      });
    });
  }, [data, orderedHeaders, searchTerm, columnFilters]);

  const toggleFilterValue = (column: string, value: any) => {
    setColumnFilters(prev => {
      const newSet = new Set(prev[column] || []);
      if (newSet.has(value)) newSet.delete(value);
      else newSet.add(value);
      return { ...prev, [column]: newSet };
    });
    setCurrentPage(1);
  };

  const clearColumnFilter = (column: string) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      delete next[column];
      return next;
    });
  };

  const selectAllColumnValues = (column: string) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      delete next[column];
      return next;
    });
  };

  const onDragStart = (header: string) => {
    setDraggedHeader(header);
  };

  const onDragOver = (e: React.DragEvent, header: string) => {
    e.preventDefault();
    if (header !== draggedHeader) setDragOverHeader(header);
  };

  const onDrop = (targetHeader: string) => {
    if (!draggedHeader || draggedHeader === targetHeader) return;
    setOrderedHeaders(prev => {
      const newHeaders = [...prev];
      const draggedIndex = newHeaders.indexOf(draggedHeader);
      const targetIndex = newHeaders.indexOf(targetHeader);
      newHeaders.splice(draggedIndex, 1);
      newHeaders.splice(targetIndex, 0, draggedHeader);
      return newHeaders;
    });
    setDraggedHeader(null);
    setDragOverHeader(null);
  };

  const onResizeStart = (e: React.MouseEvent, header: string) => {
    e.preventDefault();
    e.stopPropagation();
    const th = (e.target as HTMLElement).closest('th');
    if (th) {
      setResizingCol({
        header,
        startX: e.clientX,
        startWidth: th.offsetWidth
      });
    }
  };

  const columnStats = useMemo(() => {
    if (data.length === 0) return [];
    const stats: ColumnStats[] = [];
    
    orderedHeaders.forEach(header => {
      const allValues = data.map(row => row[header]);
      const validValues = allValues.filter(val => val !== null && val !== undefined && val !== '');
      const missingCount = allValues.length - validValues.length;
      
      const numericValues = validValues.filter(val => typeof val === 'number' && !isNaN(val)) as number[];
      const isNumeric = numericValues.length > 0 && (numericValues.length / validValues.length) > 0.5;
      const isBoolean = validValues.every(val => typeof val === 'boolean' || val === 'true' || val === 'false' || val === 0 || val === 1);
      
      const type = isNumeric ? 'number' : (isBoolean ? 'boolean' : 'string');

      const stat: ColumnStats = {
        header,
        type,
        validCount: validValues.length,
        missingCount,
        totalRows: allValues.length
      };

      if (isNumeric && numericValues.length > 0) {
        const sorted = [...numericValues].sort((a, b) => a - b);
        const sum = numericValues.reduce((acc, curr) => acc + curr, 0);
        const mean = sum / numericValues.length;
        const mid = Math.floor(numericValues.length / 2);
        const median = numericValues.length % 2 === 0 
            ? (sorted[mid - 1] + sorted[mid]) / 2 
            : sorted[mid];

        stat.mean = Number(mean.toFixed(2));
        stat.median = Number(median.toFixed(2));
        stat.min = sorted[0];
        stat.max = sorted[sorted.length - 1];
      } else if (validValues.length > 0) {
        const sorted = [...validValues].map(v => String(v)).sort();
        stat.min = sorted[0];
        stat.max = sorted[sorted.length - 1];
      }

      stats.push(stat);
    });
    return stats;
  }, [data, orderedHeaders]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getHeaderIcon = (type: string) => {
    switch (type) {
      case 'number': return <Hash className="w-3 h-3 text-blue-500" />;
      case 'boolean': return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      default: return <Type className="w-3 h-3 text-amber-500" />;
    }
  };

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
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors overflow-hidden">
      <div className="h-14 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 bg-white dark:bg-gray-900 shrink-0">
        <div className="flex items-center gap-4">
            <h2 className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-blue-500" />
              Data Studio
            </h2>
            <div className="flex gap-2">
                <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full font-bold uppercase tracking-wider">{filteredData.length} Records</span>
                {Object.keys(columnFilters).length > 0 && (
                    <button onClick={() => setColumnFilters({})} className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full font-bold uppercase tracking-wider hover:bg-red-500/20 transition-colors">
                        Clear Filters
                    </button>
                )}
            </div>
        </div>
        
        <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search records..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-transparent rounded-xl py-1.5 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white w-64 placeholder-gray-400 dark:placeholder-gray-600 outline-none transition-all"
                />
            </div>
            <label className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors" title="Upload New Dataset">
                <Upload className="w-4 h-4" />
                <input type="file" className="hidden" accept=".csv,.json" onChange={handleFileChange} />
            </label>
        </div>
      </div>

      {columnStats.length > 0 && (
        <div className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 py-4 px-6 overflow-x-auto custom-scrollbar flex gap-4 shrink-0">
          {columnStats.map((stat) => (
            <div key={stat.header} className="min-w-[300px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                    <Sigma className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate uppercase tracking-wider">{stat.header}</h4>
                </div>
                {getHeaderIcon(stat.type)}
              </div>
              
              <div className="grid grid-cols-3 gap-y-3 gap-x-2">
                <div className="space-y-0.5">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5" /> Mean
                  </p>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{stat.mean ?? 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <BarChart3 className="w-2.5 h-2.5" /> Median
                  </p>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{stat.median ?? 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Valid
                  </p>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{stat.validCount}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <ArrowDown className="w-2.5 h-2.5 text-red-400" /> Min
                  </p>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate max-w-full">{stat.min ?? 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <ArrowUp className="w-2.5 h-2.5 text-green-400" /> Max
                  </p>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate max-w-full">{stat.max ?? 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <AlertCircle className={`w-2.5 h-2.5 ${stat.missingCount > 0 ? 'text-orange-400' : 'text-gray-400'}`} /> Missing
                  </p>
                  <p className={`text-xs font-semibold ${stat.missingCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-200'}`}>
                    {stat.missingCount}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                  <span>Coverage</span>
                  <span>{((stat.validCount / stat.totalRows) * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto relative custom-scrollbar bg-white dark:bg-gray-900">
        <table className="w-full text-left border-collapse table-fixed min-w-full">
          <thead className="bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md sticky top-0 z-20 shadow-sm">
            <tr>
              {orderedHeaders.map((h) => {
                const stat = columnStats.find(s => s.header === h);
                const isFiltered = columnFilters[h] && columnFilters[h].size > 0;
                const width = columnWidths[h] || 180;
                const isDragged = draggedHeader === h;
                const isDragOver = dragOverHeader === h;
                
                return (
                  <th 
                    key={h} 
                    draggable
                    onDragStart={() => onDragStart(h)}
                    onDragOver={(e) => onDragOver(e, h)}
                    onDrop={() => onDrop(h)}
                    className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap group relative transition-all duration-200
                      ${isDragged ? 'opacity-30 bg-gray-100 dark:bg-gray-700' : 'opacity-100'}
                      ${isDragOver ? 'border-r-4 border-r-blue-500' : ''}`}
                    style={{ width: `${width}px`, minWidth: '100px' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <GripHorizontal className="w-3 h-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shrink-0" />
                        <div className="shrink-0">{stat && getHeaderIcon(stat.type)}</div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest truncate transition-colors ${isFiltered ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                          {h}
                        </span>
                      </div>
                      <button 
                        onClick={() => setActiveFilterCol(activeFilterCol === h ? null : h)}
                        className={`p-1 rounded-md transition-all shrink-0 ${activeFilterCol === h || isFiltered ? 'bg-blue-500/10 text-blue-500 opacity-100' : 'opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}
                      >
                        <Filter className="w-3 h-3" />
                      </button>
                    </div>

                    <div onMouseDown={(e) => onResizeStart(e, h)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 transition-colors z-30" />

                    {activeFilterCol === h && (
                      <div ref={filterRef} className="fixed mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 animate-fade-in p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filter {h}</span>
                            <button onClick={() => setActiveFilterCol(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
                        </div>
                        <div className="relative mb-3">
                            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" placeholder="Search values..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg py-1.5 pl-7 pr-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto mb-3 custom-scrollbar flex flex-col gap-1">
                            {uniqueColumnValues[h]
                                .filter(val => String(val).toLowerCase().includes(filterSearch.toLowerCase()))
                                .map(val => {
                                    const isSelected = columnFilters[h]?.has(val);
                                    return (
                                        <button key={String(val)} onClick={() => toggleFilterValue(h, val)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
                                            {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-blue-500" /> : <Square className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />}
                                            <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{val === null || val === '' ? <em className="text-gray-400">null</em> : String(val)}</span>
                                        </button>
                                    );
                                })
                            }
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                             <button onClick={() => selectAllColumnValues(h)} className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">Select All</button>
                             <button onClick={() => clearColumnFilter(h)} className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Clear</button>
                        </div>
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-blue-50/40 dark:hover:bg-gray-800/40 transition-colors group">
                {orderedHeaders.map(h => (
                  <td key={`${idx}-${h}`} className="px-6 py-3 whitespace-nowrap overflow-hidden truncate text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 font-mono text-xs">
                    {row[h] !== null && row[h] !== undefined && row[h] !== '' ? (
                      typeof row[h] === 'number' ? (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">{row[h] as number}</span>
                      ) : String(row[h])
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600 italic">null</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="h-12 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-6 shrink-0 z-10 transition-colors shadow-inner">
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {filteredData.length === 0 ? 'No results found' : `Showing records ${((currentPage - 1) * rowsPerPage) + 1} to ${Math.min(currentPage * rowsPerPage, filteredData.length)} of ${filteredData.length}`}
        </span>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
            <ArrowRightLeft className="w-3 h-3" /> Reorder columns by dragging headers
          </div>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(c => c + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
