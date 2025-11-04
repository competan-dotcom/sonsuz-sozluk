/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

interface SearchBarProps {
  onSearch: (query: string) => void;
  onRandom: () => void;
  onHome: () => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onRandom, onHome, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
      setQuery('');
    }
  };
  
  return (
    <div className="search-container">
      <button onClick={onHome} className="home-button" disabled={isLoading}>
        anasayfa
      </button>
      
      <form onSubmit={handleSubmit} className="search-form" role="search">
        <span className="search-icon" aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder=""
          className="search-input"
          aria-label="bir kelime arayın"
          disabled={isLoading}
        />
        <button type="submit" className="search-submit-button" disabled={isLoading || !query.trim()}>
          ara
        </button>
      </form>

      <button onClick={onRandom} className="random-button" disabled={isLoading}>
        rastgele
      </button>
    </div>
  );
};

export default SearchBar;
