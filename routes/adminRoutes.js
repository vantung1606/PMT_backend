const express = require('express');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const adminController = require('../controllers/adminController/adminController');

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

// Workspace management
router.get('/workspaces', authenticateToken, adminController.getAllWorkspaces);
router.get('/workspaces/:id', authenticateToken, adminController.getWorkspaceDetail);
router.delete('/workspaces/:id', authenticateToken, adminController.deleteWorkspace);

// User management
router.get('/users', authenticateToken, adminController.getAllUsers);
router.get('/users/:id', authenticateToken, adminController.getUserDetail);
router.put('/users/:id/role', authenticateToken, adminController.updateUserRole);
router.put('/users/:id/status', authenticateToken, adminController.toggleUserStatus);
router.delete('/users/:id', authenticateToken, adminController.deleteUser);

// Activity logs
router.get('/logs', authenticateToken, adminController.getActivityLogs);
router.get('/logs/stats', authenticateToken, adminController.getActivityStats);

// System Settings / Info
router.get('/system/info', authenticateToken, adminController.getSystemInfo);

// Website settings (Public GET, authenticated PUT for admin only)
router.get('/website/settings', adminController.getWebsiteSettings);
router.put('/website/settings', authenticateToken, adminController.updateWebsiteSettings);

module.exports = router;
