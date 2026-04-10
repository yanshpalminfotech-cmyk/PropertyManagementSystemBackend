export const VISIT_REQUEST_INSERT_QUERY = `
  INSERT INTO visit_requests (id, visit_code, property_id, customer_id, slot_id, visit_request_status, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`;

export const VISIT_REQUEST_FIND_BY_ID_QUERY = `
  SELECT * FROM visit_requests WHERE id = ?
`;

export const VISIT_REQUEST_FIND_WITH_BROKER_QUERY = `
  SELECT vr.*, p.broker_id 
  FROM visit_requests vr
  JOIN properties p ON vr.property_id = p.id
  WHERE vr.id = ? AND vr.status = ?
`;

export const VISIT_REQUEST_UPDATE_STATUS_QUERY = `
  UPDATE visit_requests SET visit_request_status = ?, updated_at = NOW() WHERE id = ?
`;

export const VISIT_REQUEST_GET_LATEST_CODE_QUERY = `
  SELECT visit_code FROM visit_requests 
  WHERE visit_code LIKE ? 
  ORDER BY visit_code DESC 
  LIMIT 1 FOR UPDATE
`;

export const PROPERTY_CHECK_ACTIVE_QUERY = `
  SELECT id FROM properties 
  WHERE id = ? AND status = ? AND propertiesstatus = ? AND available_for_visit = 1
`;

export const SITE_SLOT_SYNC_STATUS_QUERY = `
  UPDATE site_slots SET slot_status = ?, updated_at = NOW() WHERE id = ?
`;

export const VISIT_REQUEST_FIND_ALL_BASE_QUERY = `
  SELECT 
    vr.*, 
    p.property_code,
    p.category,
    p.property_type,
    ss.visit_date, 
    ss.start_time, 
    ss.end_time
  FROM visit_requests vr
  JOIN properties p ON vr.property_id = p.id
  JOIN site_slots ss ON vr.slot_id = ss.id
  WHERE vr.status = ?
`;

export const VISIT_REQUEST_CHECK_EXISTING_ACTIVE_QUERY = `
  SELECT vr.id, vr.visit_code, vr.visit_request_status 
  FROM visit_requests vr
  JOIN site_slots ss ON vr.slot_id = ss.id
  WHERE vr.customer_id = ? 
    AND vr.property_id = ?
    AND vr.status = ? 
    AND vr.visit_request_status IN (?, ?)
    AND (ss.visit_date > CURRENT_DATE OR (ss.visit_date = CURRENT_DATE AND ss.start_time > CURRENT_TIME))
  LIMIT 1
`;
