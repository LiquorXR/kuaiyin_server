'use client';

import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SystemHealth() {
  const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setStatus('online');
        } else {
          setStatus('offline');
        }
      } catch (error) {
        setStatus('offline');
      }
    };

    checkHealth();
    const timer = setInterval(checkHealth, 30000); // 每30秒检查一次
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 px-4 py-2 w-full rounded-lg bg-slate-50 border border-slate-200">
      <div className={cn(
        "p-1.5 rounded-full",
        status === 'loading' && "bg-slate-200 text-slate-400 animate-pulse",
        status === 'online' && "bg-green-100 text-green-600",
        status === 'offline' && "bg-red-100 text-red-600"
      )}>
        {status === 'online' ? <ShieldCheck size={16} /> : 
         status === 'offline' ? <ShieldAlert size={16} /> : 
         <Activity size={16} />}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">健康状态</span>
        <span className={cn(
          "text-sm font-semibold",
          status === 'loading' && "text-slate-400",
          status === 'online' && "text-green-700",
          status === 'offline' && "text-red-700"
        )}>
          {status === 'loading' ? '正在检查...' : 
           status === 'online' ? '系统在线' : '系统离线'}
        </span>
      </div>
    </div>
  );
}
