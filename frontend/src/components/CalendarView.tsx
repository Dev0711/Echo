'use client';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseServerDate } from '@/lib/dates';
import type { Post } from '@/types';

interface Props { posts: Post[]; onOpen: (post: Post) => void }

interface Event { post: Post; date: Date; kind: 'scheduled' | 'published' }

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function CalendarView({ posts, onOpen }: Props) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  const events = useMemo<Event[]>(() => posts.flatMap((post): Event[] => {
    if (post.status === 'SCHEDULED') {
      const d = parseServerDate(post.scheduledAt);
      return d ? [{ post, date: d, kind: 'scheduled' }] : [];
    }
    if (post.status === 'PUBLISHED') {
      const times = Object.values(post.platforms || {}).map(s => parseServerDate(s?.publishedAt)).filter((d): d is Date => !!d);
      const d = times.length ? new Date(Math.max(...times.map(t => t.getTime()))) : parseServerDate(post.updatedAt);
      return d ? [{ post, date: d, kind: 'published' }] : [];
    }
    return [];
  }), [posts]);

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first); start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [cursor]);

  const today = new Date();
  const unscheduled = posts.filter(p => p.status === 'DRAFT' || p.status === 'READY').length;
  const monthName = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const shift = (n: number) => setCursor(c => new Date(c.getFullYear(), c.getMonth() + n, 1));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-8 py-7">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[18px] font-semibold text-[#f2f2f2]">{monthName}</h1>
            <p className="text-[12px] text-[#71717a] mt-0.5">
              {events.filter(e => e.kind === 'scheduled').length} scheduled · {unscheduled} draft{unscheduled === 1 ? '' : 's'} not scheduled yet
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft size={15} /></Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</Button>
            <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => shift(1)}><ChevronRight size={15} /></Button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-[11px] text-[#52525b] mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="px-2 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 border-l border-t border-[#1f1f1f] rounded-lg overflow-hidden">
          {days.map(day => {
            const inMonth = day.getMonth() === cursor.getMonth();
            const dayEvents = events.filter(e => sameDay(e.date, day)).sort((a, b) => a.date.getTime() - b.date.getTime());
            const isToday = sameDay(day, today);
            return (
              <div key={day.toISOString()} className={`min-h-[104px] border-r border-b border-[#1f1f1f] p-1.5 ${inMonth ? 'bg-[#101010]' : 'bg-[#0c0c0c]'}`}>
                <div className={`text-[11px] mb-1 w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-500 text-white font-semibold' : inMonth ? 'text-[#a1a1aa]' : 'text-[#3a3a3a]'}`}>{day.getDate()}</div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(e => (
                    <button key={e.post.id} onClick={() => onOpen(e.post)}
                      title={`${e.post.title || 'Untitled'} — ${e.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                      className={`w-full text-left truncate text-[11px] px-1.5 py-0.5 rounded border ${e.kind === 'scheduled' ? 'bg-violet-500/10 border-violet-500/25 text-violet-200 hover:bg-violet-500/20' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20'}`}>
                      <span className="opacity-70">{e.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span> {e.post.title || 'Untitled'}
                    </button>
                  ))}
                  {dayEvents.length > 3 && <p className="text-[10px] text-[#71717a] px-1">+{dayEvents.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-[11px] text-[#71717a]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-violet-500/40" /> Scheduled</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40" /> Published</span>
          <span className="ml-auto">To schedule a post, open it and choose Publish → Schedule for later.</span>
        </div>
      </div>
    </div>
  );
}
