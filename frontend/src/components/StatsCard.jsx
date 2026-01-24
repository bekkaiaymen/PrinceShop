import React from 'react';

function StatsCard({ icon, title, value, bg }) {
  return (
    <div className={`${bg} rounded-xl shadow-xl p-7 fade-in transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-white/50`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 font-bold mb-2 text-sm uppercase tracking-wide">{title}</p>
          <p className="text-4xl font-extrabold text-gray-900">{value}</p>
        </div>
        <div className="bg-white/70 p-3 rounded-full shadow-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default StatsCard;
