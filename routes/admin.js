const express = require('express');
const router = express.Router();
const tcb = require('@cloudbase/node-sdk');

// 仅在云开发环境下初始化
const app = tcb.init({
  env: tcb.SYMBOL_CURRENT_ENV
});
const db = app.database();

// 1. 健康检查 (放在最前面)
router.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    env: process.env.TCB_ENV || 'unknown'
  });
});

// 2. 统计信息
router.get('/stats', async (req, res) => {
  try {
    const { total } = await db.collection('print_tasks').count();
    const { total: pending } = await db.collection('print_tasks').where({ status: 0 }).count();
    res.json({ total, pending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. 更新任务状态
router.post('/tasks/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.collection('print_tasks').doc(id).update({
      status: parseInt(status)
    });
    res.redirect('/');
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).send('更新失败');
  }
});

// 4. 任务列表 (根路径)
router.get('/', async (req, res) => {
  try {
    const { data: tasks } = await db.collection('print_tasks')
      .orderBy('createTime', 'desc')
      .get();
    
    // 获取关联文件
    for (let task of tasks) {
      const { data: files } = await db.collection('task_files')
        .where({
          printTask: task._id
        }).get();
      task.files = files;
    }

    res.render('admin/tasks', { tasks, title: '快印订单管理中心' });
  } catch (err) {
    console.error('List tasks error:', err);
    // 如果是 SIGN_PARAM_INVALID，尝试打印更多环境信息
    res.status(500).render('error', { 
      message: '数据库连接失败 (可能原因: 环境凭证无效)', 
      error: { status: err.code, stack: err.message } 
    });
  }
});

module.exports = router;
