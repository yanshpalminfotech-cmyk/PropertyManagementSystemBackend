export const AUTH_GET_ADMIN_COUNT_QUERY = `
  SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1
`;

export const AUTH_FIND_USER_BY_EMAIL_QUERY = `
  SELECT id, name, email, role, password_hash, is_locked, failed_login_attempts, status 
  FROM users WHERE email = ?
`;

export const AUTH_UPDATE_FAILED_ATTEMPTS_QUERY = `
  UPDATE users SET failed_login_attempts = ?, is_locked = ? WHERE id = ?
`;

export const AUTH_RESET_FAILED_ATTEMPTS_QUERY = `
  UPDATE users SET failed_login_attempts = 0 WHERE id = ?
`;

export const AUTH_REVOKE_USER_TOKENS_QUERY = `
  UPDATE tokens SET is_revoked = 1 WHERE user_id = ? AND is_revoked = 0
`;

export const AUTH_INSERT_TOKEN_QUERY = `
  INSERT INTO tokens (
    id, hashed_token, expires_at, token_type, is_revoked, user_id
  ) VALUES (?, ?, ?, ?, ?, ?)
`;

export const AUTH_REVOKE_SPECIFIC_TOKEN_QUERY = `
  UPDATE tokens SET is_revoked = 1 WHERE hashed_token = ? AND user_id = ?
`;

export const AUTH_REVOKE_REFRESH_TOKENS_QUERY = `
  UPDATE tokens SET is_revoked = 1 WHERE user_id = ? AND token_type = ? AND is_revoked = 0
`;

export const AUTH_FIND_VALID_REFRESH_TOKEN_QUERY = `
  SELECT t.id as t_id, u.*
  FROM tokens t
  JOIN users u ON t.user_id = u.id
  WHERE t.hashed_token = ?
    AND t.is_revoked = 0
    AND t.token_type = ?
    AND t.expires_at > NOW()
`;

export const AUTH_VALIDATE_TOKEN_QUERY = `
  SELECT id FROM tokens WHERE hashed_token = ? AND is_revoked = 0 AND expires_at > ?
`;

export const AUTH_REVOKE_TOKEN_BY_ID_QUERY = `UPDATE tokens SET is_revoked = 1 WHERE id = ?`;

export const AUTH_FIND_USER_BY_ID_QUERY = `
  SELECT id, name, email, role, password_hash, is_locked, failed_login_attempts, status 
  FROM users WHERE id = ?
`;
