import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { RecurringRule } from '../../services/recurringService';

interface RecurringFormProps {
  initialRule?: RecurringRule;
  onChange: (rule: RecurringRule | undefined) => void;
}

export const RecurringForm = ({
  initialRule,
  onChange,
}: RecurringFormProps): JSX.Element => {
  const [isRecurring, setIsRecurring] = useState(!!initialRule);
  const [rule, setRule] = useState<RecurringRule>(() => ({
    frequency: 'WEEKLY',
    interval: 1,
    ...initialRule,
  }));

  useEffect(() => {
    onChange(isRecurring ? rule : undefined);
  }, [isRecurring, rule, onChange]);

  const handleFrequencyChange = (frequency: RecurringRule['frequency']) => {
    setRule(prev => {
      const newRule = { ...prev, frequency };
      // Reset frequency-specific fields when changing frequency
      if (frequency !== 'WEEKLY') {
        delete newRule.days_of_week;
      }
      if (frequency !== 'MONTHLY') {
        delete newRule.day_of_month;
      }
      if (frequency !== 'ANNUALLY') {
        delete newRule.month_of_year;
      }
      return newRule;
    });
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIsRecurring(e.target.checked);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | undefined = value;

    if (type === 'number') {
      processedValue = parseInt(value, 10) || 0;
    }

    setRule(prev => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleDaysOfWeekChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const day = parseInt(value, 10);
    setRule(prev => {
      const currentDays = prev.days_of_week ? JSON.parse(prev.days_of_week) as number[] : [];
      let newDays;
      if (checked) {
        newDays = [...currentDays, day].sort();
      } else {
        newDays = currentDays.filter(d => d !== day);
      }
      return {
        ...prev,
        days_of_week: JSON.stringify(newDays),
      };
    });
  };

  if (!isRecurring) {
    return (
      <div className="recurring-form">
        <label>
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={handleCheckboxChange}
          />
          Repeat this event
        </label>
      </div>
    );
  }

  return (
    <div className="recurring-form">
      <label>
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={handleCheckboxChange}
        />
        Repeat Event
      </label>

      {isRecurring && (
        <div className="recurring-options">
          <div className="form-group">
            <label htmlFor="frequency">Repeat every</label>
            <div className="frequency-input">
              <input
                type="number"
                min="1"
                value={rule.interval}
                onChange={(e) => setRule({ ...rule, interval: parseInt(e.target.value) || 1 })}
              />
              <select
                name="frequency"
                value={rule.frequency}
                onChange={handleInputChange}
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="ANNUALLY">Annually</option>
              </select>
            </div>
          </div>

          {rule.frequency === 'WEEKLY' && (
            <div className="form-group">
              <label>Repeat on</label>
              <div className="weekday-selector">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <label key={index} className="weekday-label">
                    <input
                      type="checkbox"
                      value={index}
                      checked={rule.days_of_week ? JSON.parse(rule.days_of_week).includes(index) : false}
                      onChange={handleDaysOfWeekChange}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
          )}

          {rule.frequency === 'MONTHLY' && (
            <div className="form-group">
              <label htmlFor="day_of_month">Day of month</label>
              <input
                type="number"
                name="day_of_month"
                value={rule.day_of_month || ''}
                onChange={handleInputChange}
                placeholder="Day of Month (1-31)"
                min="1"
                max="31"
              />
            </div>
          )}

          {rule.frequency === 'ANNUALLY' && (
            <div className="form-group">
              <label htmlFor="month_of_year">Month</label>
              <input
                type="number"
                name="month_of_year"
                value={rule.month_of_year || ''}
                onChange={handleInputChange}
                placeholder="Month of Year (1-12)"
                min="1"
                max="12"
              />
            </div>
          )}

          <div className="form-group">
            <label>Ends</label>
            <div className="end-options">
              <label>
                <input
                  type="radio"
                  name="end-type"
                  checked={!rule.end_date && !rule.end_occurrences}
                  onChange={() => setRule({ ...rule, end_date: undefined, end_occurrences: undefined })}
                />
                Never
              </label>
              <label>
                <input
                  type="radio"
                  name="end-type"
                  checked={!!rule.end_occurrences}
                  onChange={() => setRule({ ...rule, end_occurrences: 10, end_date: undefined })}
                />
                After
                {rule.end_occurrences !== undefined && (
                  <input
                    type="number"
                    min="1"
                    value={rule.end_occurrences}
                    onChange={(e) => setRule({ ...rule, end_occurrences: parseInt(e.target.value) })}
                  />
                )}
                occurrences
              </label>
              <label>
                <input
                  type="radio"
                  name="end-type"
                  checked={!!rule.end_date}
                  onChange={() => {
                    const defaultEndDate = new Date();
                    defaultEndDate.setMonth(defaultEndDate.getMonth() + 3);
                    setRule({
                      ...rule,
                      end_date: defaultEndDate.toISOString().split('T')[0],
                      end_occurrences: undefined
                    });
                  }}
                />
                On date
                {rule.end_date && (
                  <input
                    type="date"
                    name="end_date"
                    value={rule.end_date.split('T')[0]}
                    onChange={handleInputChange}
                  />
                )}
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
