import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './AdvancedSearch.css';

const AdvancedSearch = ({
  data = [],
  searchFields = ['name'],
  filters = [],
  onSearch,
  onResultSelect,
  placeholder = 'Search...',
  showFilters = true,
  showRecentSearches = true,
  maxRecentSearches = 5,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('himlayan_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchQuery) => {
    if (!searchQuery.trim()) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== searchQuery);
      const updated = [searchQuery, ...filtered].slice(0, maxRecentSearches);
      localStorage.setItem('himlayan_recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, [maxRecentSearches]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (onSearch) {
        onSearch(query, activeFilters);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, activeFilters, onSearch]);

  // Filtered results
  const results = useMemo(() => {
    if (!query.trim() && Object.keys(activeFilters).length === 0) {
      return [];
    }

    return data.filter(item => {
      // Check search query
      const matchesQuery = !query.trim() || searchFields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return String(value || '').toLowerCase().includes(query.toLowerCase());
      });

      // Check active filters
      const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
        if (!value || value === 'all') return true;
        const itemValue = key.split('.').reduce((obj, k) => obj?.[k], item);
        return String(itemValue).toLowerCase() === String(value).toLowerCase();
      });

      return matchesQuery && matchesFilters;
    });
  }, [data, query, activeFilters, searchFields]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultSelect(results[selectedIndex]);
        } else {
          saveRecentSearch(query);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleResultSelect = (result) => {
    saveRecentSearch(query);
    setIsOpen(false);
    if (onResultSelect) {
      onResultSelect(result);
    }
  };

  const handleFilterChange = (filterId, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterId]: value,
    }));
  };

  const clearFilters = () => {
    setActiveFilters({});
  };

  const clearRecentSearch = (search, e) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== search);
      localStorage.setItem('himlayan_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const hasActiveFilters = Object.values(activeFilters).some(v => v && v !== 'all');

  return (
    <div className="advanced-search" ref={dropdownRef}>
      {/* Search Input */}
      <div className="search-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button className="search-clear" onClick={() => setQuery('')}>
            Clear
          </button>
        )}
        <kbd className="search-kbd">⌘K</kbd>
      </div>

      {/* Filter Chips */}
      {showFilters && filters.length > 0 && (
        <div className="search-filters">
          {filters.map(filter => (
            <div key={filter.id} className="filter-group">
              <select
                className={`filter-select ${activeFilters[filter.id] && activeFilters[filter.id] !== 'all' ? 'active' : ''}`}
                value={activeFilters[filter.id] || 'all'}
                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
              >
                <option value="all">{filter.label}: All</option>
                {filter.options.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {hasActiveFilters && (
            <button className="filter-clear" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="active-filters">
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value || value === 'all') return null;
            const filter = filters.find(f => f.id === key);
            const option = filter?.options.find(o => o.value === value);
            return (
              <span key={key} className="filter-tag">
                {filter?.label}: {option?.label || value}
                <button onClick={() => handleFilterChange(key, 'all')}>x</button>
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="search-dropdown">
          {/* Recent Searches */}
          {showRecentSearches && recentSearches.length > 0 && !query && (
            <div className="search-section">
              <div className="section-header">
                <span>Recent Searches</span>
              </div>
              <ul className="search-list">
                {recentSearches.map((search, index) => (
                  <li
                    key={index}
                    className="search-item recent"
                    onClick={() => setQuery(search)}
                  >
                    <span className="item-text">{search}</span>
                    <button
                      className="item-remove"
                      onClick={(e) => clearRecentSearch(search, e)}
                    >
                      x
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Results */}
          {query && (
            <div className="search-section">
              <div className="section-header">
                <span>Results ({results.length})</span>
              </div>
              {results.length > 0 ? (
                <ul className="search-list">
                  {results.slice(0, 10).map((result, index) => (
                    <li
                      key={result.id || index}
                      className={`search-item ${index === selectedIndex ? 'selected' : ''}`}
                      onClick={() => handleResultSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="item-content">
                        <span className="item-text">
                          {searchFields[0].split('.').reduce((obj, key) => obj?.[key], result)}
                        </span>
                        {result.subtitle && (
                          <span className="item-subtitle">{result.subtitle}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="search-empty">
                  <span>No results found for "{query}"</span>
                </div>
              )}
            </div>
          )}

          {/* Empty state when opened without query */}
          {!query && recentSearches.length === 0 && (
            <div className="search-empty">
              <span>Start typing to search...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Pre-configured search for burial records
export const BurialRecordSearch = ({ data, onSelect }) => (
  <AdvancedSearch
    data={data}
    searchFields={['deceased_name', 'plot.section', 'plot.block', 'plot.lot']}
    placeholder="Search burial records..."
    filters={[
      {
        id: 'status',
        label: 'Status',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'transferred', label: 'Transferred' },
          { value: 'exhumed', label: 'Exhumed' },
        ],
      },
      {
        id: 'burial_type',
        label: 'Type',
        options: [
          { value: 'casket', label: 'Casket' },
          { value: 'cremation', label: 'Cremation' },
          { value: 'vault', label: 'Vault' },
        ],
      },
    ]}
    onResultSelect={onSelect}
  />
);

// Pre-configured search for plots
export const PlotSearch = ({ data, onSelect }) => (
  <AdvancedSearch
    data={data}
    searchFields={['section', 'block', 'lot', 'owner_name']}
    placeholder="Search plots..."
    filters={[
      {
        id: 'status',
        label: 'Status',
        options: [
          { value: 'available', label: 'Available' },
          { value: 'reserved', label: 'Reserved' },
          { value: 'occupied', label: 'Occupied' },
          { value: 'maintenance', label: 'Under Maintenance' },
        ],
      },
      {
        id: 'type',
        label: 'Type',
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'premium', label: 'Premium' },
          { value: 'family', label: 'Family' },
          { value: 'mausoleum', label: 'Mausoleum' },
        ],
      },
    ]}
    onResultSelect={onSelect}
  />
);

export default AdvancedSearch;
