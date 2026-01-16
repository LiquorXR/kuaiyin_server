import React from 'react';
import { LayoutDashboard, ClipboardList, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SystemHealth } from './system-health';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1 rounded">快</span>
            快印管理后台
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <a href="#" className="flex items-center gap-3 px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <LayoutDashboard size={20} />
            <span>仪表盘</span>
          </a>
          <a href="#" className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
            "bg-blue-50 text-blue-700 font-medium"
          )}>
            <ClipboardList size={20} />
            <span>订单管理</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <Settings size={20} />
            <span>系统设置</span>
          </a>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <SystemHealth />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-800">订单管理</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500 text-right">
              <p className="font-medium text-slate-900">管理员</p>
              <p>最后登录: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200" />
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
