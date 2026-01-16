'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  MoreHorizontal, 
  Printer, 
  Archive,
  Check,
  X,
  RotateCcw,
  ArrowUp,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Order } from '@/types';

interface OrderTableProps {
  orders: Order[];
  onStatusChange: (id: string, status: 'pending' | 'completed') => void;
  onDownloadAll: (id: string) => void;
}

export default function OrderTable({ orders, onStatusChange, onDownloadAll }: OrderTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 当订单状态改变且与目标状态一致时，清除处理状态
  useEffect(() => {
    if (processingId) {
      const order = orders.find(o => o._id === processingId);
      if (order && order.status === targetStatus) {
        setProcessingId(null);
        setTargetStatus(null);
      }
    }
  }, [orders, processingId, targetStatus]);

  const handleStatusChange = async (id: string, status: 'pending' | 'completed') => {
    setProcessingId(id);
    setTargetStatus(status);
    try {
      await onStatusChange(id, status);
    } catch (error) {
      setProcessingId(null);
      setTargetStatus(null);
    }
  };

  const handleDownloadAll = async (id: string) => {
    setDownloadingId(id);
    try {
      await onDownloadAll(id);
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 50);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-320px)] relative">
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-auto flex-grow scroll-smooth"
      >
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-sm">
              <th className="px-6 py-4 w-[120px]">取件码</th>
              <th className="px-6 py-4 w-[120px]">规格参数</th>
              <th className="px-6 py-4 w-[180px]">文件列表</th>
              <th className="px-6 py-4 w-[220px]">备注</th>
              <th className="px-6 py-4 w-[90px]">状态</th>
              <th className="px-6 py-4 text-right w-[120px]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                  {/* 订单信息 */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-xl font-bold tracking-tight",
                        order.status === 'pending' ? "text-slate-900" : "text-slate-400"
                      )}>
                        {order.pickupCode}
                      </span>
                      <div className="flex flex-col mt-0.5">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={12} />
                          {format(new Date(order.createTime), 'yyyy-MM-dd HH:mm')}
                        </span>
                        <span className="text-xs text-slate-400">
                          UID: {order.userUid || '匿名'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 规格参数 */}
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap gap-1">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[11px] font-bold uppercase",
                          order.color === '彩色' ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-700"
                        )}>
                          {order.color}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[11px] font-bold uppercase">
                          {order.sides}
                        </span>
                        {order.needsBinding && (
                          <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 text-[11px] font-bold uppercase">
                            装订
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Printer size={15} className="text-slate-400" />
                        <span className="font-bold text-slate-700">{order.copies} 份</span>
                      </div>
                    </div>
                  </td>

                  {/* 文件列表 */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2 w-full">
                      {order.files.map((file, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (order.status === 'completed') return;
                            if (!file.downloadURL) return;
                            const link = document.createElement('a');
                            link.href = file.downloadURL;
                            link.setAttribute('download', file.name || 'download');
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          disabled={order.status === 'completed'}
                          className={cn(
                            "flex items-center gap-2 text-xs transition-colors group text-left",
                            order.status === 'completed' 
                              ? "text-slate-400 cursor-not-allowed opacity-60" 
                              : "text-blue-600 hover:text-blue-800"
                          )}
                        >
                          <FileText size={14} className={cn(
                            "flex-shrink-0",
                            order.status === 'completed' ? "text-slate-300" : "text-slate-400 group-hover:text-blue-600"
                          )} />
                          <span className="truncate" title={file.name}>{file.name}</span>
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* 备注 */}
                  <td className="px-6 py-4">
                    {order.remark ? (
                      <div 
                        className="cursor-pointer group"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <p className="text-sm font-medium text-slate-900 w-full line-clamp-2 group-hover:text-blue-600 transition-colors" title="点击查看完整备注">
                          {order.remark}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  {/* 状态 */}
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                      order.status === 'pending' 
                        ? "bg-amber-100 text-amber-700" 
                        : "bg-emerald-100 text-emerald-700"
                    )}>
                      {order.status === 'pending' ? (
                        <><Clock size={12} /> 待处理</>
                      ) : (
                        <><CheckCircle2 size={12} /> 已完成</>
                      )}
                    </span>
                  </td>

                  {/* 操作 */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {order.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleDownloadAll(order._id)}
                            disabled={downloadingId === order._id}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50 border border-blue-100"
                            title="打包下载"
                          >
                            {downloadingId === order._id ? <Loader2 size={18} className="animate-spin" /> : <Archive size={18} />}
                          </button>
                          <button
                            onClick={() => handleStatusChange(order._id, 'completed')}
                            disabled={processingId === order._id}
                            className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50 border border-emerald-100"
                            title="完成订单"
                          >
                            {processingId === order._id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(order._id, 'pending')}
                          disabled={processingId === order._id}
                          className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all disabled:opacity-50 border border-amber-100"
                          title="设为待处理"
                        >
                          {processingId === order._id ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
                        </button>
                      )}
                      <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all border border-slate-100">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <ClipboardList className="w-12 h-12 opacity-20" />
                    <p className="text-sm font-medium">暂无订单数据</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 回到顶部按钮 */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="absolute bottom-6 right-6 p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-lg rounded-full transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 z-20 group"
          title="回到顶部"
        >
          <ArrowUp size={20} className="group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* 备注弹窗 */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                订单备注
              </h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
                <span className="text-sm font-medium text-blue-600">取件码</span>
                <span className="text-xl font-black text-blue-700 tracking-wider">
                  {selectedOrder.pickupCode}
                </span>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                  {selectedOrder.remark}
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all text-sm"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClipboardList({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
    </svg>
  );
}
