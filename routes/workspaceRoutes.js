const express = require('express');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const workspaceController = require('../controllers/workspaceController/workspaceController');

router.get('/my', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Query 1: workspaces with counts
    const [rows] = await db.execute(
      `SELECT
         w.id,
         w.name,
         w.description,
         w.owner_id,
         w.created_at,
         wm.role,
         (SELECT COUNT(*) FROM prj p WHERE p.workspace_id = w.id) AS project_count,
         (SELECT COUNT(*) FROM workspace_members wm2 WHERE wm2.workspace_id = w.id) AS member_count
       FROM workspaces w
       LEFT JOIN workspace_members wm
         ON wm.workspace_id = w.id AND wm.user_id = ?
       WHERE w.owner_id = ?
          OR wm.user_id IS NOT NULL
       ORDER BY w.created_at DESC`,
      [userId, userId]
    );

    if (rows.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Query 2: up to 3 member avatars per workspace
    const wsIds = rows.map(r => r.id);
    const placeholders = wsIds.map(() => '?').join(',');
    const [avatarRows] = await db.execute(
      `SELECT wm.workspace_id, u.username, u.avatar
       FROM workspace_members wm
       JOIN users u ON u.id = wm.user_id
       WHERE wm.workspace_id IN (${placeholders})
       ORDER BY wm.workspace_id, wm.joined_at ASC`,
      wsIds
    );

    // Group avatars by workspace_id (max 3 each)
    const avatarMap = {};
    for (const row of avatarRows) {
      if (!avatarMap[row.workspace_id]) avatarMap[row.workspace_id] = [];
      if (avatarMap[row.workspace_id].length < 3) {
        avatarMap[row.workspace_id].push({ username: row.username, avatar: row.avatar });
      }
    }

    const data = rows.map(row => ({
      ...row,
      member_avatars: avatarMap[row.id] || []
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const workspaceId = req.params.id;
    const userId = req.user.id;

    const [workspaceRows] = await db.execute(
      `SELECT
         w.id,
         w.name,
         w.description,
         w.owner_id,
         w.created_at,
         wm.role
       FROM workspaces w
       LEFT JOIN workspace_members wm
         ON wm.workspace_id = w.id AND wm.user_id = ?
       WHERE w.id = ?
         AND (w.owner_id = ? OR wm.user_id IS NOT NULL)
       LIMIT 1`,
      [userId, workspaceId, userId]
    );

    if (workspaceRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    const [memberRows] = await db.execute(
      `SELECT wm.id, wm.user_id, wm.role, wm.joined_at, u.username, u.email, u.avatar
       FROM workspace_members wm
       JOIN users u ON u.id = wm.user_id
       WHERE wm.workspace_id = ?
       ORDER BY wm.joined_at ASC`,
      [workspaceId]
    );

    const [projectRows] = await db.execute(
      `SELECT id, name, description, owner_id, status, start_date, end_date, created_at
       FROM prj
       WHERE workspace_id = ?
       ORDER BY created_at DESC`,
      [workspaceId]
    );

    res.json({
      success: true,
      data: {
        workspace: workspaceRows[0],
        members: memberRows,
        projects: projectRows
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create workspace
router.post('/', authenticateToken, workspaceController.createWorkspace);

// Manage members
router.post('/:id/members', authenticateToken, workspaceController.addMember);
router.put('/:id/members/:userId/role', authenticateToken, workspaceController.updateMemberRole);

module.exports = router;
