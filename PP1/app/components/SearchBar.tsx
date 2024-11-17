import React, {useState} from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = "Search..." , className}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (searchTerm.trim() && onSearch) {
      onSearch(searchTerm);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div
        className={`
          relative flex items-center rounded-xl
          bg-white shadow-lg transition-all duration-300
          ${isFocused ? 'shadow-blue-950 ring-2' : 'hover:shadow-sm'}
        `}
      >
        <Search
          className={`
            absolute left-4 h-5 w-5 transition-colors duration-200
            focus:text-blue-500 text-gray-400
          `}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="
            w-44 sm:w-full py-3 pl-12 pr-10
            text-md sm:text-md text-gray-700 placeholder-gray-400 truncate
            bg-transparent rounded-xl
            focus:outline-none
            transition-all duration-300
          "
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="
              absolute right-4
              text-gray-400 hover:text-gray-600
              transition-colors duration-200
            "
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Optional search tips */}
      <div className="mt-2 text-xs text-gray-400 px-4">
        Press Enter to search
      </div>
    </form>
  );
};

export default SearchBar;

