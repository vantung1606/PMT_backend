const db = require('./config/db');
(async () => {
    try {
        const [rows] = await db.execute(`
            SELECT w.*, wm.role AS member_role
            FROM workspaces w
            INNER JOIN workspace_members wm ON wm.workspace_id = w.id
            WHERE wm.user_id = ?
            AND (LOWER(w.name) LIKE ? OR LOWER(w.description) LIKE ?)
        `, [6, '%bán%', '%bán%']);
        console.log("ID 6 workspaces:", rows);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
