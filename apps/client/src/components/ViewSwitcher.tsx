'use client';

interface ViewSwitcherProps {
  currentView: 'master' | 'topic';
  onViewChange: (view: 'master' | 'topic') => void;
  eventCount: number;
  topicCount?: number;
}

export function ViewSwitcher({ 
  currentView, 
  onViewChange, 
  eventCount, 
  topicCount = 0 
}: ViewSwitcherProps) {
  return (
    <div className="flex items-center space-x-4 mb-6">
      {/* View Toggle Buttons */}
      <div className="flex bg-theme-bg-tertiary rounded-lg p-1 shadow-card">
        <button
          onClick={() => onViewChange('master')}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 font-medium
            ${currentView === 'master'
              ? 'bg-white text-theme-text-primary shadow-sm'
              : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-secondary'
            }
          `}
        >
          <span className="text-lg">📋</span>
          <span>Master View</span>
          <span className="bg-theme-primary/10 text-theme-primary text-xs px-2 py-1 rounded-full font-semibold">
            {eventCount}
          </span>
        </button>
        
        <button
          onClick={() => onViewChange('topic')}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 font-medium
            ${currentView === 'topic'
              ? 'bg-white text-theme-text-primary shadow-sm'
              : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-secondary'
            }
          `}
        >
          <span className="text-lg">🏷️</span>
          <span>Topic View</span>
          <span className="bg-theme-accent-success/10 text-theme-accent-success text-xs px-2 py-1 rounded-full font-semibold">
            {topicCount}
          </span>
        </button>
      </div>

      {/* View Description */}
      <div className="hidden md:block">
        <p className="text-sm text-theme-text-tertiary">
          {currentView === 'master' 
            ? 'Detailed event timeline with advanced filtering'
            : 'Windows 8-style topic tiles with project filtering'
          }
        </p>
      </div>
    </div>
  );
}