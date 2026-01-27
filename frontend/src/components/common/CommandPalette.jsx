import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import './CommandPalette.css';

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const commands = [
    // Navigation
    { id: 'nav-dashboard', label: 'Go to Dashboard', icon: '', category: 'navigation', action: () => navigate('/admin/dashboard') },
    { id: 'nav-burials', label: 'Go to Burial Records', icon: '', category: 'navigation', action: () => navigate('/burial-records') },
    { id: 'nav-plots', label: 'Go to Plots', icon: '', category: 'navigation', action: () => navigate('/plots') },
    { id: 'nav-map', label: 'Go to Cemetery Map', icon: '', category: 'navigation', action: () => navigate('/map') },
    
    // Actions
    { id: 'action-add-burial', label: 'Add New Burial Record', icon: '', category: 'actions', action: () => { navigate('/burial-records'); /* TODO: open modal */ } },
    { id: 'action-add-plot', label: 'Add New Plot', icon: '', category: 'actions', action: () => { navigate('/plots'); /* TODO: open modal */ } },
    { id: 'action-search', label: 'Search Records', icon: '', category: 'actions', action: () => { /* TODO */ } },
    { id: 'action-export', label: 'Export Data', icon: '', category: 'actions', action: () => { /* TODO */ } },
    
    // Settings
    { id: 'settings-profile', label: 'My Profile', icon: '', category: 'settings', action: () => { /* TODO */ } },
    { id: 'settings-theme', label: 'Toggle Dark Mode', icon: '', category: 'settings', action: () => document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark') },
    { id: 'settings-logout', label: 'Logout', icon: '', category: 'settings', action: () => { /* TODO */ } },
    
    // Help
    { id: 'help-shortcuts', label: 'Keyboard Shortcuts', icon: '', category: 'help', action: () => { /* TODO */ } },
    { id: 'help-docs', label: 'Documentation', icon: '', category: 'help', action: () => { /* TODO */ } },
    { id: 'help-support', label: 'Contact Support', icon: '', category: 'help', action: () => { /* TODO */ } },
  ];

  const categories = [
    { id: 'all', label: 'All', icon: '' },
    { id: 'navigation', label: 'Navigation', icon: '' },
    { id: 'actions', label: 'Actions', icon: '' },
    { id: 'settings', label: 'Settings', icon: '' },
    { id: 'help', label: 'Help', icon: '' },
  ];

  const filteredCommands = commands.filter(cmd => {
    const matchesQuery = cmd.label.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = activeCategory === 'all' || cmd.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  const executeCommand = useCallback((command) => {
    command.action();
    onClose();
  }, [onClose]);

  // Keyboard navigation
  useKeyboardShortcuts({
    'up': () => setSelectedIndex(i => Math.max(0, i - 1)),
    'down': () => setSelectedIndex(i => Math.min(filteredCommands.length - 1, i + 1)),
    'enter': () => {
      if (filteredCommands[selectedIndex]) {
        executeCommand(filteredCommands[selectedIndex]);
      }
    },
    'escape': onClose,
  }, { enabled: isOpen, excludeInputs: false });

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="command-palette-header">
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <kbd className="command-palette-kbd">ESC</kbd>
        </div>

        {/* Categories */}
        <div className="command-palette-categories">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="command-palette-results">
          {filteredCommands.length > 0 ? (
            <ul className="command-list">
              {filteredCommands.map((cmd, index) => (
                <li
                  key={cmd.id}
                  className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span className="command-icon">{cmd.icon}</span>
                  <span className="command-label">{cmd.label}</span>
                  <span className="command-category">{cmd.category}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="command-empty">
              <p>No commands found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="command-palette-footer">
          <div className="shortcut-hint">
            <kbd>↑</kbd><kbd>↓</kbd> to navigate
          </div>
          <div className="shortcut-hint">
            <kbd>Enter</kbd> to select
          </div>
          <div className="shortcut-hint">
            <kbd>Ctrl</kbd>+<kbd>K</kbd> to open
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
