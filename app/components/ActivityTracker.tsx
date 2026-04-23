'use client';

import { useEffect, useRef } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { studentApi } from '../lib/api';

/**
 * ActivityTracker Component
 * Automatically logs page views and time spent for the current subject
 */
export default function ActivityTracker() {
  const params = useParams();
  const pathname = usePathname();
  const subjectId = params.classId as string;
  const lastLoggedRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!subjectId) return;

    // 1. Log Page View
    studentApi.logActivity('page_view', subjectId, {
      path: pathname,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    });

    // 2. Setup Heartbeat for Time Spent (every 60 seconds)
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((now - lastLoggedRef.current) / 1000);
      
      if (document.visibilityState === 'visible' && diff >= 5) {
        studentApi.logActivity('time_spent', subjectId, {
          duration: diff,
          timestamp: new Date().toISOString()
        });
        lastLoggedRef.current = now;
      }
    }, 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [subjectId, pathname]);

  return null; // Side-effect only component
}
