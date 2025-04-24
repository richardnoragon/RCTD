import React, { createContext, useContext, useState } from 'react';
import { format } from 'date-fns';

interface CalendarContextType {
  currentView: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' | 'listWeek';
  currentDate: Date;
  setView: (view: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' | 'listWeek') => void;
  setDate: (date: Date) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' | 'listWeek'>('timeGridWeek');
  const [currentDate, setCurrentDate] = useState(new Date());

  const value = {
    currentView,
    currentDate,
    setView: setCurrentView,
    setDate: setCurrentDate,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};
