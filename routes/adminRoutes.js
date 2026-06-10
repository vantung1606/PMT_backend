const express = require('express');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard/stats', authenticateToken, async (req, res, next) => {
  try {
    const [[userCount]] = await db.execute('SELECT COUNT(*) AS count FROM users');
    const [[workspaceCount]] = await db.execute('SELECT COUNT(*) AS count FROM workspaces');
    const [[projectCount]] = await db.execute('SELECT COUNT(*) AS count FROM prj');
    const [[taskCount]] = await db.execute('SELECT COUNT(*) AS count FROM tasks');

    const [usersByRole] = await db.execute(
      `SELECT role, COUNT(*) AS count
       FROM users
       GROUP BY role
       ORDER BY count DESC`
    );

    const [projectsByStatus] = await db.execute(
      `SELECT status, COUNT(*) AS count
       FROM prj
       GROUP BY status
       ORDER BY count DESC`
    );

    const [userGrowth] = await db.execute(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
       FROM users
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month DESC
       LIMIT 6`
    );

    const [topUsers] = await db.execute(
      `SELECT u.id, u.username, u.email, COUNT(ta.id) AS assigned_tasks
       FROM users u
       LEFT JOIN tsk_asg ta ON ta.user_id = u.id
       GROUP BY u.id, u.username, u.email
       ORDER BY assigned_tasks DESC, u.created_at DESC
       LIMIT 5`
    );

    const [recentActivities] = await db.execute(
      `SELECT l.id, l.action, l.target_table, l.target_id, l.description, l.created_at, u.username
       FROM logs l
       LEFT JOIN users u ON u.id = l.user_id
       ORDER BY l.created_at DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        totals: {
          users: userCount.count,
          workspaces: workspaceCount.count,
          projects: projectCount.count,
          tasks: taskCount.count
        },
        usersByRole,
        projectsByStatus,
        userGrowth: userGrowth.reverse(),
        topUsers,
        recentActivities
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
