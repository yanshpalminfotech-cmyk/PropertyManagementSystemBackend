export const VISIT_FEEDBACK_FIND_BY_VISIT_ID_QUERY = `
  SELECT id FROM visit_feedback WHERE visit_request_id = ?
`;

export const VISIT_FEEDBACK_INSERT_QUERY = `
  INSERT INTO visit_feedback (id, visit_request_id, interest_level, feedback, created_at)
  VALUES (?, ?, ?, ?, NOW())
`;

export const VISIT_FEEDBACK_FIND_BY_ID_QUERY = `
  SELECT * FROM visit_feedback WHERE id = ?
`;

export const VISIT_REQUEST_MINIMAL_FOR_FEEDBACK_QUERY = `
  SELECT id, customer_id, visit_request_status 
  FROM visit_requests 
  WHERE id = ? AND status = 1
`;

/**
 * Admin: all feedbacks with full context
 */
export const VISIT_FEEDBACK_FIND_ALL_QUERY = `
  SELECT
    vf.id,
    vf.interest_level,
    vf.feedback,
    vf.created_at,
    vr.id          AS visit_request_id,
    vr.visit_code,
    ss.visit_date,
    ss.start_time,
    ss.end_time,
    p.id           AS property_id,
    p.property_code,
    p.property_type,
    p.category,
    p.location,
    cu.id          AS customer_id,
    cu.name        AS customer_name,
    cu.email       AS customer_email
  FROM visit_feedback vf
  JOIN visit_requests vr ON vf.visit_request_id = vr.id
  JOIN site_slots ss     ON vr.slot_id = ss.id
  JOIN properties p      ON vr.property_id = p.id
  JOIN users cu          ON vr.customer_id = cu.id
  WHERE vr.status = 1
  ORDER BY vf.created_at DESC
`;

/**
 * Broker: only feedback on their own properties
 */
export const VISIT_FEEDBACK_FIND_BY_BROKER_QUERY = `
  SELECT
    vf.id,
    vf.interest_level,
    vf.feedback,
    vf.created_at,
    vr.id          AS visit_request_id,
    vr.visit_code,
    ss.visit_date,
    ss.start_time,
    ss.end_time,
    p.id           AS property_id,
    p.property_code,
    p.property_type,
    p.category,
    p.location,
    cu.id          AS customer_id,
    cu.name        AS customer_name,
    cu.email       AS customer_email
  FROM visit_feedback vf
  JOIN visit_requests vr ON vf.visit_request_id = vr.id
  JOIN site_slots ss     ON vr.slot_id = ss.id
  JOIN properties p      ON vr.property_id = p.id
  JOIN users cu          ON vr.customer_id = cu.id
  WHERE vr.status = 1
    AND p.broker_id = ?
  ORDER BY vf.created_at DESC
`;

/**
 * Find all feedback for a specific property
 */
export const VISIT_FEEDBACK_FIND_BY_PROPERTY_QUERY = `
  SELECT
    vf.id,
    vf.interest_level,
    vf.feedback,
    vf.created_at,
    vr.id          AS visit_request_id,
    vr.visit_code,
    ss.visit_date,
    ss.start_time,
    ss.end_time,
    p.id           AS property_id,
    p.property_code,
    p.property_type,
    p.category,
    p.location,
    cu.id          AS customer_id,
    cu.name        AS customer_name,
    cu.email       AS customer_email
  FROM visit_feedback vf
  JOIN visit_requests vr ON vf.visit_request_id = vr.id
  JOIN site_slots ss     ON vr.slot_id = ss.id
  JOIN properties p      ON vr.property_id = p.id
  JOIN users cu          ON vr.customer_id = cu.id
  WHERE vr.status = 1
    AND p.id = ?
    AND (p.broker_id = ? OR 1 = ?) -- broker_id check or skip if admin
  ORDER BY vf.created_at DESC
`;
