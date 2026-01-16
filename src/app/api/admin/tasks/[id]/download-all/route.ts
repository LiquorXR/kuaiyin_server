import { NextResponse } from 'next/server';
import { db, tcbApp } from '@/lib/tcb';
import JSZip from 'jszip';
import axios from 'axios';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!db) {
    return new Response('Database not initialized', { status: 500 });
  }

  try {
    const { id } = await params;
    const { data: [task] } = await db.collection('orders').doc(id).get();
    
    if (!task || !task.files || task.files.length === 0) {
      return new Response('订单不存在或没有文件', { status: 404 });
    }

    const fileList = task.files.map((f: any) => ({
      fileID: f.fileID,
      maxAge: 3600
    }));
    const { fileList: urls } = await tcbApp.getTempFileURL({ fileList });

    const zip = new JSZip();
    const downloadPromises = urls.map(async (fileInfo: any, index: number) => {
      const response = await axios.get(fileInfo.tempFileURL, { responseType: 'arraybuffer' });
      const fileName = task.files[index].name;
      zip.file(fileName, response.data);
    });

    await Promise.all(downloadPromises);
    const content = await zip.generateAsync({ type: 'blob' });

    const now = new Date();
    const timeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const zipName = `${task.pickupCode}_${timeStr}.zip`;

    return new Response(content, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename=${encodeURIComponent(zipName)}`,
      },
    });
  } catch (err: any) {
    console.error('Download all failed:', err);
    return new Response('打包下载失败: ' + err.message, { status: 500 });
  }
}
