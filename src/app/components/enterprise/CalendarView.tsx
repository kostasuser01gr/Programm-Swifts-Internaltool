import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Field, Record as TableRecord } from '../../types';

interface CalendarViewProps {
  fields: Field[];
  records: TableRecord[];
  dateFieldId: string;
  onRecordClick: (record: TableRecord) => void;
  members: { id: string; name: string; email: string }[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({ fields, records, dateFieldId, onRecordClick }: CalendarViewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const primaryField = fields.find((f) => f.isPrimary);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const getRecordsForDate = (date: number) => {
    const target = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return records.filter((record) => {
      const recordDate = record.fields[dateFieldId];
      if (!recordDate) return false;
      return String(recordDate).split('T')[0] === target;
    });
  };

  const isToday = (date: number) =>
    date === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  return (
    <div className="flex-1 flex flex-col bg-white p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAY_NAMES.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr h-[calc(100%-40px)]">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="border-r border-b border-gray-200 bg-gray-50"
            />
          ))}

          {/* Calendar days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const date = idx + 1;
            const dayRecords = getRecordsForDate(date);

            return (
              <div
                key={date}
                className="border-r border-b border-gray-200 p-2 overflow-hidden hover:bg-blue-50 transition-colors last:border-r-0"
              >
                <div
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm mb-1 ${
                    isToday(date)
                      ? 'bg-blue-500 text-white font-semibold'
                      : 'text-gray-700'
                  }`}
                >
                  {date}
                </div>

                <div className="space-y-1">
                  {dayRecords.slice(0, 3).map((record) => (
                    <div
                      key={record.id}
                      className="text-xs p-1 bg-blue-100 border-l-2 border-blue-500 rounded cursor-pointer hover:bg-blue-200 truncate"
                      onClick={() => onRecordClick(record)}
                    >
                      {primaryField ? record.fields[primaryField.id] : 'Untitled'}
                    </div>
                  ))}
                  {dayRecords.length > 3 && (
                    <div className="text-xs text-gray-500 pl-1">
                      +{dayRecords.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
