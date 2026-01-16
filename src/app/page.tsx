'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import Layout from '@/components/layout';
import OrderTable from '@/components/order-table';
import { Order } from '@/types';
import { cn } from '@/lib/utils';
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function Dashboard() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/tasks', fetcher);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const orders: Order[] = data?.tasks || [];
  
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === 'all' || o.status === filter;
    const matchesSearch = o.pickupCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    // 延迟一下确保动画可见
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleStatusChange = async (id: string, status: 'pending' | 'completed') => {
    try {
      await axios.post(`/api/admin/tasks/${id}/status`, { status });
      mutate();
    } catch (err) {
      console.error('Update status failed:', err);
      alert('更新状态失败');
    }
  };

  const handleDownloadAll = async (id: string) => {
    try {
      const response = await axios.get(`/api/admin/tasks/${id}/download-all`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // 从 Content-Disposition 获取文件名
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'download.zip';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename=(.+)/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = decodeURIComponent(fileNameMatch[1]);
        }
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('下载失败');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="总订单量" 
            value={stats.total} 
            icon={<ClipboardList className="text-blue-600" />}
            className="bg-blue-50 border-blue-100"
          />
          <StatCard 
            title="待处理" 
            value={stats.pending} 
            icon={<Clock className="text-amber-600" />}
            className="bg-amber-50 border-amber-100"
          />
          <StatCard 
            title="已完成" 
            value={stats.completed} 
            icon={<CheckCircle2 className="text-emerald-600" />}
            className="bg-emerald-50 border-emerald-100"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="搜索取件码..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
              />
            </div>
            <div className="flex bg-white border border-slate-200 rounded-lg p-1">
              <FilterButton 
                active={filter === 'all'} 
                onClick={() => setFilter('all')}
              >
                全部
              </FilterButton>
              <FilterButton 
                active={filter === 'pending'} 
                onClick={() => setFilter('pending')}
              >
                待处理
              </FilterButton>
              <FilterButton 
                active={filter === 'completed'} 
                onClick={() => setFilter('completed')}
              >
                已完成
              </FilterButton>
            </div>
          </div>
          
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={cn(isRefreshing ? "animate-spin" : "")} />
            刷新数据
          </button>
        </div>

        {/* Order Table */}
        <OrderTable 
          orders={filteredOrders} 
          onStatusChange={handleStatusChange}
          onDownloadAll={handleDownloadAll}
        />
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon, className }: { title: string, value: number, icon: React.ReactNode, className?: string }) {
  return (
    <div className={cn("p-6 rounded-2xl border flex items-center justify-between", className)}>
      <div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className="p-3 bg-white rounded-xl shadow-sm">
        {icon}
      </div>
    </div>
  );
}

function FilterButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 text-xs font-medium rounded-md transition-all",
        active ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
      )}
    >
      {children}
    </button>
  );
}
