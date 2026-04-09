export const VISIT_FEEDBACK_FIND_BY_VISIT_ID_QUERY = `
  SELECT id FROM visit_feedback WHERE visit_request_id = ?
`;

export const VISIT_FEEDBACK_INSERT_QUERY = `
  INSERT INTO visit_feedback (id, visit_request_id, interest_level, feedback, created_at)
  VALUES (?, ?, ?, ?, NOW())
`;

export const VISIT_FEEDBACK_UPDATE_QUERY = `
  UPDATE visit_feedback 
  SET interest_level = ?, feedback = ?, created_at = NOW()
  WHERE visit_request_id = ?
`;

export const VISIT_FEEDBACK_FIND_BY_ID_QUERY = `
  SELECT * FROM visit_feedback WHERE id = ?
`;

export const VISIT_REQUEST_MINIMAL_FOR_FEEDBACK_QUERY = `
  SELECT id, customer_id, visit_request_status 
  FROM visit_requests 
  WHERE id = ? AND status = 1
`;
