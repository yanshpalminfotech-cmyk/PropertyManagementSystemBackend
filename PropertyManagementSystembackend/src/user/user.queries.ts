export const USER_INSERT_QUERY = `INSERT INTO users (
          id, user_code, name, email, phone, password_hash, 
          role, failed_login_attempts, is_locked, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

export const USER_FIND_BY_ID_QUERY = `SELECT * FROM users WHERE id = ?`;

export const USER_UNLOCK_QUERY = `UPDATE users SET is_locked = 0, failed_login_attempts = 0 WHERE id = ?`;

export const USER_SOFT_DELETE_QUERY = `UPDATE users SET status = ? WHERE id = ?`;

export const USER_GET_LATEST_CODE_QUERY = `SELECT user_code FROM users WHERE user_code LIKE ? ORDER BY user_code DESC LIMIT 1 FOR UPDATE`;

export const USER_FIND_ALL_ACTIVE_QUERY = `SELECT * FROM users WHERE status = ?`;

export const USER_CHECK_EXISTING_QUERY = `SELECT id FROM users WHERE email = ? OR phone = ?`;