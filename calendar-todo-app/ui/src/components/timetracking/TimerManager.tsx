import React, { useState, useEffect, useCallback } from 'react';
import { TimeEntry, timeTrackingService } from '../../services/timeTrackingService';
import './TimeTracking.css';

interface TimerManagerProps {
  itemType?: 'EVENT' | 'TASK' | 'CATEGORY' | 'MANUAL';
  itemId?: number;
  onTimerUpdate?: () => void;
}

export const TimerManager: React.FC<TimerManagerProps> = ({
  itemType = 'MANUAL',
  itemId,
  onTimerUpdate
}) => {
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [timerType, setTimerType] = useState<'MANUAL' | 'POMODORO' | 'COUNTDOWN'>('MANUAL');
  const [pomodoroState, setPomodoroState] = useState<'WORK' | 'BREAK' | 'LONG_BREAK'>('WORK');
  const [pomodoroCount, setPomodoroCount] = useState(0);

  // Load pomodoro settings
  const pomodoroSettings = {
    workMinutes: 25,
    breakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4
  };

  const loadActiveTimer = useCallback(async () => {
    try {
      const timer = await timeTrackingService.getActiveTimer();
      setActiveTimer(timer);
      if (timer) {
        const startTime = new Date(timer.start_time).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
      }
    } catch (error) {
      console.error('Failed to load active timer:', error);
    }
  }, []);

  useEffect(() => {
    loadActiveTimer();
  }, [loadActiveTimer]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);

        // Handle Pomodoro timer state changes
        if (timerType === 'POMODORO') {
          const totalSeconds = pomodoroState === 'WORK' 
            ? pomodoroSettings.workMinutes * 60
            : (pomodoroState === 'BREAK' ? pomodoroSettings.breakMinutes : pomodoroSettings.longBreakMinutes) * 60;

          if (elapsedTime >= totalSeconds) {
            handlePomodoroStateChange();
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer, elapsedTime, timerType, pomodoroState, pomodoroSettings, pomodoroCount]);

  const handlePomodoroStateChange = async () => {
    if (activeTimer) {
      await stopTimer();
    }

    if (pomodoroState === 'WORK') {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      setPomodoroState(newCount % pomodoroSettings.longBreakInterval === 0 ? 'LONG_BREAK' : 'BREAK');
    } else {
      setPomodoroState('WORK');
    }

    startTimer();
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startTimer = async () => {
    try {
      const entry: TimeEntry = {
        item_type: itemType,
        item_id: itemId,
        start_time: new Date().toISOString(),
        timer_type: timerType
      };
      const timerId = await timeTrackingService.startTimer(entry);
      setActiveTimer({ ...entry, id: timerId });
      setElapsedTime(0);
      if (onTimerUpdate) onTimerUpdate();
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const stopTimer = async () => {
    if (!activeTimer?.id) return;

    try {
      await timeTrackingService.stopTimer(activeTimer.id, new Date().toISOString());
      setActiveTimer(null);
      setElapsedTime(0);
      if (onTimerUpdate) onTimerUpdate();
    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  };

  return (
    <div className="timer-manager">
      <div className="timer-controls">
        <select 
          value={timerType}
          onChange={(e) => setTimerType(e.target.value as TimeEntry['timer_type'])}
          disabled={!!activeTimer}
        >
          <option value="MANUAL">Manual Timer</option>
          <option value="POMODORO">Pomodoro Timer</option>
          <option value="COUNTDOWN">Countdown Timer</option>
        </select>

        {timerType === 'POMODORO' && (
          <div className="pomodoro-info">
            <span>{pomodoroState === 'WORK' ? 'Work Time' : pomodoroState === 'BREAK' ? 'Break Time' : 'Long Break'}</span>
            <span>Pomodoro #{Math.floor(pomodoroCount / pomodoroSettings.longBreakInterval) + 1}</span>
          </div>
        )}

        <div className="timer-display">
          {formatTime(elapsedTime)}
        </div>

        <div className="timer-buttons">
          {!activeTimer ? (
            <button onClick={startTimer}>Start</button>
          ) : (
            <button onClick={stopTimer}>Stop</button>
          )}
        </div>
      </div>
    </div>
  );
};
