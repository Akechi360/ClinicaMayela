import React from 'react';

export const PageLoadSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Cabecera simulada */}
      <div className="glass-panel rounded-2xl p-6 flex justify-between items-center h-24">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-light/20 rounded-md"></div>
          <div className="h-4 w-32 bg-slate-light/10 rounded-md"></div>
        </div>
        <div className="h-10 w-28 bg-satin-copper/20 rounded-lg"></div>
      </div>

      {/* Grid de contenido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarjeta grande / principal */}
        <div className="glass-panel rounded-2xl p-6 md:col-span-2 h-96 space-y-4">
          <div className="h-5 w-1/4 bg-slate-light/20 rounded-md"></div>
          <div className="h-3 w-1/2 bg-slate-light/10 rounded-md"></div>
          <div className="w-full h-64 bg-slate-light/5 rounded-xl"></div>
        </div>

        {/* Tarjeta lateral */}
        <div className="glass-panel rounded-2xl p-6 h-96 space-y-6">
          <div className="h-5 w-1/3 bg-slate-light/20 rounded-md"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-slate-light/10 rounded-full shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 bg-slate-light/15 rounded-md"></div>
                  <div className="h-2 w-1/2 bg-slate-light/10 rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
