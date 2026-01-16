import { NextResponse } from 'next/server';
import { db } from '@/lib/tcb';

export async function GET() {
  let dbStatus = 'error';
  try {
    if (db) {
      // 使用现有的 'orders' 集合进行简单查询以验证数据库连接
      await db.collection('orders').limit(1).get();
      dbStatus = 'ok';
    } else {
      console.error('Health Check: db object is null');
    }
  } catch (error) {
    console.error('Health Check Database Error:', error);
    dbStatus = 'error';
  }

  return NextResponse.json({ 
    status: dbStatus === 'ok' ? 'ok' : 'error',
    database: dbStatus,
    timestamp: new Date().toISOString()
  }, {
    status: dbStatus === 'ok' ? 200 : 500
  });
}
