export const VISIT_REQUEST_INSERT_QUERY = `
  INSERT INTO visit_requests (id, visit_code, property_id, customer_id, slot_id, visit_request_status, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`;

export const VISIT_REQUEST_FIND_BY_ID_QUERY = `
  SELECT * FROM visit_requests WHERE id = ?
`;

export const VISIT_REQUEST_FIND_WITH_BROKER_QUERY = `
  SELECT vr.*, p.broker_id,
         ss.visit_date, ss.start_time, ss.end_time
  FROM visit_requests vr
  JOIN properties p ON vr.property_id = p.id
  JOIN site_slots ss ON vr.slot_id = ss.id
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
  UPDATE site_slots 
  SET slot_status = ?, locked_by = NULL, locked_until = NULL, updated_at = NOW() 
  WHERE id = ?
`;


export const VISIT_REQUEST_FIND_ALL_BASE_QUERY = `
  SELECT 
    vr.*, 
    p.property_code,
    p.category,
    p.property_type,
    ss.visit_date, 
    ss.start_time, 
    ss.end_time,
    u.name as customer_name,
    u.email as customer_email,
    vf.interest_level
  FROM visit_requests vr
  JOIN properties p ON vr.property_id = p.id
  JOIN site_slots ss ON vr.slot_id = ss.id
  JOIN users u ON vr.customer_id = u.id
  LEFT JOIN visit_feedback vf ON vr.id = vf.visit_request_id
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

/**
 * Returns the start_times a customer already has PENDING/CONFIRMED visits for on a given date.
 * Used by getAvailableSlots to hide those time slots from the customer's view.
 */
export const CUSTOMER_BUSY_SLOTS_QUERY = `
  SELECT ss.start_time
  FROM visit_requests vr
  JOIN site_slots ss ON vr.slot_id = ss.id
  WHERE vr.customer_id = ?
    AND ss.visit_date = ?
    AND vr.status = ?
    AND vr.visit_request_status IN (?, ?)
`;

/**
 * Hard guard used in create() to ensure the customer has no active visit
 * at the exact same date + startTime on ANY property.
 */
export const VISIT_REQUEST_CHECK_TIME_CONFLICT_QUERY = `
  SELECT vr.id
  FROM visit_requests vr
  JOIN site_slots ss ON vr.slot_id = ss.id
  WHERE vr.customer_id = ?
    AND ss.visit_date = ?
    AND ss.start_time = ?
    AND vr.status = ?
    AND vr.visit_request_status IN (?, ?)
  LIMIT 1
`;
