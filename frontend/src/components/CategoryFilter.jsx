import React from 'react';
import { Filter } from 'lucide-react';

function CategoryFilter({ categories, selectedCategory, onSelectCategory }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="font-extrabold text-gray-900 mb-6 text-xl flex items-center gap-3">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
            <Filter className="text-white" size={24} />
          </div>
          تصفية حسب الفئة
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-md'
            }`}
          >
            📦 الكل
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-md'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CategoryFilter;
