const express = require('express');
const router = express.Router();
const tcb = require('@cloudbase/node-sdk');

// 尝试更鲁棒的初始化方式
let app;
try {
  // 在微信云托管中，优先尝试无参数初始化，依赖环境变量自动注入
  // 如果报错 missing secretId，说明环境变量未正确注入或环境特殊
  app = tcb.init();
} catch (e) {
  console.error('Initial tcb.init() failed, falling back...');
  app = tcb.init({
    env: tcb.SYMBOL_CURRENT_ENV
  });
}

const db = app.database();

// 1. 健康检查
router.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    env: process.env.TCB_ENV || 'unknown',
    service: process.env.TCB_SERVICE || 'unknown',
    // 探测环境变量是否存在 (不打印具体值以保安全)
    hasSecretId: !!process.env.TENCENTCLOUD_SECRETID,
    hasSecretKey: !!process.env.TENCENTCLOUD_SECRETKEY,
    hasToken: !!process.env.TENCENTCLOUD_SESSIONTOKEN
  });
});

// 2. 统计信息
router.get('/stats', async (req, res) => {
  try {
    const { total } = await db.collection('print_tasks').count();
    const { total: pending } = await db.collection('print_tasks').where({ status: 0 }).count();
    res.json({ total, pending });
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
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
    res.status(500).send('更新失败: ' + err.message);
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
    // 渲染错误页面，引导用户检查权限
    res.status(500).render('error', { 
      message: '数据库访问失败', 
      error: { 
        status: err.code || '500', 
        stack: `错误码: ${err.code}\n错误信息: ${err.message}\n\n排查建议：\n1. 请检查“微信云托管控制台 -> 环境设置 -> 资源复用”，确保已开启对当前环境数据库的访问权限。\n2. 确认服务是否正确关联了环境凭证。`
      } 
    });
  }
});

module.exports = router;
