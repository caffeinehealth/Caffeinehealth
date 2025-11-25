import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Calendar, TrendingDown, TrendingUp, Activity, Settings, Download, Trash2, Plus, BarChart3, Coffee } from 'lucide-react';

// Provide a simple fallback for `window.storage` using localStorage for local dev
const storage = (typeof window !== 'undefined' && window.storage && window.storage.get && window.storage.set && window.storage.delete)
  ? window.storage
  : {
      get: async (key) => ({ value: localStorage.getItem(key) }),
      set: (key, value) => localStorage.setItem(key, value),
      delete: (key) => localStorage.removeItem(key)
    };

const CaffeineHealthApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [weightEntries, setWeightEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightInput, setWeightInput] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);
  const [notification, setNotification] = useState('');

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await storage.get('weight-entries');
        if (result && result.value) {
          setWeightEntries(JSON.parse(result.value));
        }
      } catch (error) {
        /* no existing data */
      }
    };
    loadData();
  }, []);

  // Save data whenever entries change
  useEffect(() => {
    try {
      if (weightEntries.length > 0) {
        storage.set('weight-entries', JSON.stringify(weightEntries));
      }
    } catch (e) {}
  }, [weightEntries]);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const addWeightEntry = () => {
    if (!weightInput || !selectedDate) {
      showNotification('Please enter weight and select date');
      return;
    }

    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      showNotification('Please enter a valid weight');
      return;
    }

    const existingIndex = weightEntries.findIndex(e => e.date === selectedDate);
    let newEntries;

    if (existingIndex >= 0) {
      newEntries = [...weightEntries];
      newEntries[existingIndex] = { date: selectedDate, weight };
      showNotification('Weight updated successfully!');
    } else {
      newEntries = [...weightEntries, { date: selectedDate, weight }];
      showNotification('Weight added successfully!');
    }

    newEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
    setWeightEntries(newEntries);
    setWeightInput('');
  };

  const deleteEntry = (date) => {
    setWeightEntries(weightEntries.filter(e => e.date !== date));
    showNotification('Entry deleted');
  };

  const getFilteredData = () => {
    if (!customStartDate || !customEndDate) return weightEntries;
    return weightEntries.filter(e => e.date >= customStartDate && e.date <= customEndDate);
  };

  const calculateStats = (data) => {
    if (data.length === 0) return { min: 0, max: 0, avg: 0, trend: 0, change: 0 };
    
    const weights = data.map(e => e.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
    
    const firstWeight = data[0].weight;
    const lastWeight = data[data.length - 1].weight;
    const change = lastWeight - firstWeight;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    
    return { min, max, avg, trend, change };
  };

  const exportToPDF = () => {
    const data = getFilteredData();
    if (data.length === 0) {
      showNotification('No data to export');
      return;
    }

    const stats = calculateStats(data);
    const dateRange = customStartDate && customEndDate 
      ? `${customStartDate} to ${customEndDate}` 
      : 'All Time';

    const content = `CAFFEINE HEALTH - WEIGHT TRACKING REPORT
by aditya

Report Period: ${dateRange}
Generated: ${new Date().toLocaleDateString()}

═══════════════════════════════════════════════════════════

STATISTICS SUMMARY:
═══════════════════════════════════════════════════════════

Total Entries: ${data.length}
Average Weight: ${stats.avg.toFixed(2)} kg
Minimum Weight: ${stats.min.toFixed(2)} kg
Maximum Weight: ${stats.max.toFixed(2)} kg
Weight Change: ${stats.change >= 0 ? '+' : ''}${stats.change.toFixed(2)} kg
Trend: ${stats.trend.toUpperCase()}

═══════════════════════════════════════════════════════════

DETAILED ENTRIES:
═══════════════════════════════════════════════════════════

${data.map(e => `${e.date}: ${e.weight} kg`).join('\n')}

═══════════════════════════════════════════════════════════

Powered by Caffeine Health by aditya
© ${new Date().getFullYear()} All Rights Reserved
`;

    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `caffeine-health-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('Report exported successfully! ✓');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Export failed. Please try again.');
    }
  };

  // Import logic: read a .txt or .json file and parse entries into the app
  const fileInputRef = useRef(null);

  const parseImportedContent = (content) => {
    // Try JSON first
    try {
      const json = JSON.parse(content);
      if (Array.isArray(json)) {
        // Expect array of { date, weight }
        return json
          .filter(it => it && it.date && (typeof it.weight === 'number' || !isNaN(Number(it.weight))))
          .map(it => ({ date: it.date, weight: Number(it.weight) }));
      }
      // Maybe object with entries
      if (json && json.entries && Array.isArray(json.entries)) {
        return json.entries
          .filter(it => it && it.date && (typeof it.weight === 'number' || !isNaN(Number(it.weight))))
          .map(it => ({ date: it.date, weight: Number(it.weight) }));
      }
    } catch (e) {
      // not JSON, continue to plain text parsing
    }

    // Parse exported text pattern: "YYYY-MM-DD: XX kg"
    const parsed = [];
    const regex = /^\s*(\d{4}-\d{2}-\d{2}):\s*([+-]?\d+(?:\.\d+)?)\s*kg\s*$/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
      parsed.push({ date: match[1], weight: Number(match[2]) });
    }

    return parsed;
  };

  const handleFileImport = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const entries = parseImportedContent(text);
      if (!entries || entries.length === 0) {
        showNotification('No valid entries found in the imported file');
        return;
      }

      let added = 0;
      let updated = 0;
      const newEntries = [...weightEntries];
      entries.forEach(entry => {
        if (!entry.date || typeof entry.weight !== 'number' || isNaN(entry.weight)) return;
        const idx = newEntries.findIndex(e => e.date === entry.date);
        if (idx >= 0) {
          newEntries[idx] = { date: entry.date, weight: entry.weight };
          updated += 1;
        } else {
          newEntries.push({ date: entry.date, weight: entry.weight });
          added += 1;
        }
      });

      newEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
      setWeightEntries(newEntries);
      try { storage.set('weight-entries', JSON.stringify(newEntries)); } catch (e) {}
      showNotification(`Imported ${entries.length} entries (${added} added, ${updated} updated)`);
      // reset the input so same file can be imported again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      showNotification('Failed to read file');
    };
    reader.readAsText(file);
  };

  const onFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleFileImport(file);
  };

  const handleDeleteAll = () => {
    if (deleteStep === 0) {
      setShowDeleteConfirm(true);
      setDeleteStep(1);
    } else if (deleteStep === 1) {
      setWeightEntries([]);
      storage.delete('weight-entries');
      setShowDeleteConfirm(false);
      setDeleteStep(0);
      showNotification('All data erased successfully');
    }
  };

  const stats = calculateStats(getFilteredData());

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-2 sm:p-4 md:p-6 lg:p-8">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-amber-900 text-amber-50 px-4 sm:px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse text-sm sm:text-base">
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-amber-900 via-orange-900 to-amber-800 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8 border-4 border-amber-700">
          <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 mb-2">
            <Coffee className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-amber-200" />
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-amber-50 tracking-tight">
                Caffeine Health
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-amber-200 font-medium mt-1">by aditya</p>
            </div>
            <Coffee className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-amber-200" />
          </div>
          <p className="text-center text-amber-100 text-xs sm:text-sm md:text-base mt-2 sm:mt-3">
            Your Premium Weight Tracking Companion
          </p>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-4 sm:mb-6 p-2 border-2 border-amber-200">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'analysis', label: 'Analysis', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold transition-all text-xs sm:text-sm md:text-base ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg transform scale-105'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Current', value: weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : 0, unit: 'kg', icon: Activity, color: 'blue' },
                { label: 'Average', value: stats.avg, unit: 'kg', icon: BarChart3, color: 'green' },
                { label: 'Minimum', value: stats.min, unit: 'kg', icon: TrendingDown, color: 'purple' },
                { label: 'Maximum', value: stats.max, unit: 'kg', icon: TrendingUp, color: 'red' }
              ].map((stat, i) => (
                <div key={i} className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 rounded-xl p-3 sm:p-4 md:p-6 shadow-lg border-2 border-${stat.color}-200`}>
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-${stat.color}-600`} />
                  </div>
                  <p className={`text-xl sm:text-2xl md:text-3xl font-bold text-${stat.color}-900`}>
                    {stat.value.toFixed(1)}
                  </p>
                  <p className={`text-xs sm:text-sm text-${stat.color}-600 font-medium`}>{stat.label} {stat.unit}</p>
                </div>
              ))}
            </div>

            {/* Add Weight Entry */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border-2 border-amber-200">
              <h2 className="text-xl sm:text-2xl font-bold text-amber-900 mb-4 sm:mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                Add Weight Entry
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-amber-800 mb-2">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-amber-800 mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    placeholder="Enter weight"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm sm:text-base"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={addWeightEntry}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg text-sm sm:text-base"
                  >
                    Add Entry
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Entries */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border-2 border-amber-200">
              <h2 className="text-xl sm:text-2xl font-bold text-amber-900 mb-4 sm:mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                Recent Entries
              </h2>
              <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
                {weightEntries.slice(-10).reverse().map((entry, i) => (
                  <div key={i} className="flex items-center justify-between bg-amber-50 p-3 sm:p-4 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors">
                    <div>
                      <p className="font-semibold text-amber-900 text-sm sm:text-base">{entry.date}</p>
                      <p className="text-xl sm:text-2xl font-bold text-orange-600">{entry.weight} kg</p>
                    </div>
                    <button
                      onClick={() => deleteEntry(entry.date)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                ))}
                {weightEntries.length === 0 && (
                  <p className="text-center text-amber-600 py-8 text-sm sm:text-base">No entries yet. Add your first weight entry above!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Date Range Filter */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border-2 border-amber-200">
              <h2 className="text-xl sm:text-2xl font-bold text-amber-900 mb-4 sm:mb-6">Custom Date Range</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-amber-800 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-amber-800 mb-2">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm sm:text-base"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => {
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="flex-1 bg-amber-100 text-amber-900 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold hover:bg-amber-200 transition-all text-sm sm:text-base"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 sm:p-6 shadow-lg border-2 border-green-200">
                <h3 className="text-base sm:text-lg font-bold text-green-900 mb-2">Weight Change</h3>
                <p className={`text-2xl sm:text-3xl md:text-4xl font-bold ${stats.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)} kg
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {stats.trend === 'up' ? <TrendingUp className="text-red-600 w-5 h-5 sm:w-6 sm:h-6" /> : 
                   stats.trend === 'down' ? <TrendingDown className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" /> : 
                   <Activity className="text-gray-600 w-5 h-5 sm:w-6 sm:h-6" />}
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">
                    {stats.trend === 'up' ? 'Increasing' : stats.trend === 'down' ? 'Decreasing' : 'Stable'}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 sm:p-6 shadow-lg border-2 border-blue-200">
                <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-2">Total Entries</h3>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600">{getFilteredData().length}</p>
                <p className="text-xs sm:text-sm text-blue-700 mt-2">Tracking sessions recorded</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-4 sm:p-6 shadow-lg border-2 border-purple-200">
                <h3 className="text-base sm:text-lg font-bold text-purple-900 mb-2">Range</h3>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-600">
                  {(stats.max - stats.min).toFixed(2)} kg
                </p>
                <p className="text-xs sm:text-sm text-purple-700 mt-2">Weight fluctuation range</p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border-2 border-amber-200">
              <h2 className="text-xl sm:text-2xl font-bold text-amber-900 mb-4 sm:mb-6">Weight Trend Chart</h2>
              {getFilteredData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={getFilteredData()}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fbbf24" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                      angle={window.innerWidth < 640 ? -45 : 0}
                      textAnchor={window.innerWidth < 640 ? "end" : "middle"}
                      height={window.innerWidth < 640 ? 60 : 30}
                    />
                    <YAxis 
                      tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#fffbeb', 
                        border: '2px solid #d97706',
                        borderRadius: '8px',
                        fontSize: window.innerWidth < 640 ? '12px' : '14px'
                      }} 
                    />
                    <Area type="monotone" dataKey="weight" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-amber-600 py-12 text-sm sm:text-base">No data available for the selected range</p>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border-2 border-amber-200">
              <h2 className="text-xl sm:text-2xl font-bold text-amber-900 mb-4 sm:mb-6 flex items-center gap-2">
                <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                Export Data
              </h2>
              <p className="text-amber-700 mb-4 text-sm sm:text-base">
                Export your weight tracking data as a detailed report. Use the custom date range in the Analysis tab to export specific periods.
              </p>
              <button
                onClick={exportToPDF}
                className="w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg text-sm sm:text-base"
              >
                Export Report
              </button>
              {/* Import Data - keeps UI consistent; input is hidden and triggered by button */}
              <p className="text-amber-700 mt-3 mb-2 text-sm sm:text-base">Or import a previously exported report (.txt or .json)</p>
              <input ref={fileInputRef} type="file" accept=".txt,.json" onChange={onFileChange} className="hidden" />
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg text-sm sm:text-base mt-2"
              >
                Import Report
              </button>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border-2 border-red-300">
              <h2 className="text-xl sm:text-2xl font-bold text-red-900 mb-4 sm:mb-6 flex items-center gap-2">
                <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                Danger Zone
              </h2>
              <p className="text-red-700 mb-4 text-sm sm:text-base">
                Permanently delete all your weight tracking data. This action cannot be undone.
              </p>
              {!showDeleteConfirm ? (
                <button
                  onClick={handleDeleteAll}
                  className="w-full md:w-auto bg-red-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-red-700 transition-all shadow-lg text-sm sm:text-base"
                >
                  Erase All Data
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-red-900 font-bold text-sm sm:text-base">
                    {deleteStep === 1 ? '⚠️ Are you absolutely sure? Click again to confirm permanent deletion.' : ''}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleDeleteAll}
                      className="flex-1 bg-red-700 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold hover:bg-red-800 transition-all text-sm sm:text-base"
                    >
                      Yes, Delete Everything
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteStep(0);
                      }}
                      className="flex-1 bg-gray-200 text-gray-800 px-4 sm:px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border-2 border-amber-200">
              <h2 className="text-xl sm:text-2xl font-bold text-amber-900 mb-4">About</h2>
              <div className="space-y-3 text-amber-800 text-sm sm:text-base">
                <p><strong>App Name:</strong> Caffeine Health</p>
                <p><strong>Created by:</strong> Aditya</p>
                <p><strong>Version:</strong> 1.0.0</p>
                <p><strong>Features:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-xs sm:text-sm">
                  <li>Advanced weight tracking with date selection</li>
                  <li>Comprehensive statistical analysis</li>
                  <li>Custom date range filtering</li>
                  <li>Beautiful interactive charts</li>
                  <li>Data export functionality</li>
                  <li>Secure data storage with confirmation before deletion</li>
                  <li>Fully responsive design for all devices</li>
                  <li>Coffee-themed aesthetic</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 sm:mt-8 bg-gradient-to-r from-amber-900 via-orange-900 to-amber-800 rounded-xl shadow-lg p-4 sm:p-6 border-2 border-amber-700">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
            <p className="text-amber-50 font-bold text-sm sm:text-base md:text-lg">Caffeine Health</p>
          </div>
          <p className="text-center text-amber-200 text-xs sm:text-sm">by aditya</p>
          <p className="text-center text-amber-300 text-xs mt-2">
            © {new Date().getFullYear()} All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default CaffeineHealthApp;
