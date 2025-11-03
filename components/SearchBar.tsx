/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';

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
      setQuery(''); // Clear the input field after search
    }
  };

  return (
    <div className="search-container">
      <button onClick={onHome} className="home-button" disabled={isLoading}>
        anasayfa
      </button>
      <form onSubmit={handleSubmit} className="search-form" role="search">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="bir kelime ara"
          className="search-input"
          aria-label="bir kelime arayın"
          disabled={isLoading}
        />
      </form>
      <button onClick={onRandom} className="random-button" disabled={isLoading}>
        rastgele
      </button>
    </div>
  );
};

export default SearchBar;