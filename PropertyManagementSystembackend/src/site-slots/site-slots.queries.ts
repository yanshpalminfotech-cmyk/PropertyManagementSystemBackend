export const SITE_SLOT_FIND_BOOKED_QUERY = `
  SELECT start_time
  FROM site_slots 
  WHERE property_id = ? 
    AND visit_date = ? 
    AND status = ?
    AND (
      slot_status = ?
      OR slot_status = ?
      OR (slot_status = ? AND locked_until > NOW())
    )
`;

export const SITE_SLOT_INSERT_QUERY = `
  INSERT INTO site_slots (id, property_id, visit_date, start_time, end_time, slot_status, locked_by, locked_until, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

export const SITE_SLOT_FIND_BY_UNIQUE_QUERY = `
  SELECT * FROM site_slots 
  WHERE property_id = ? AND visit_date = ? AND start_time = ? AND status = ?
`;

export const SITE_SLOT_FIND_BY_ID_QUERY = `
  SELECT * FROM site_slots WHERE id = ?
`;

export const SITE_SLOT_UPDATE_LOCK_QUERY = `
  UPDATE site_slots
  SET slot_status = ?, locked_by = ?, locked_until = ?
  WHERE id = ?
`;

export const SITE_SLOT_UPDATE_STATUS_QUERY = `
  UPDATE site_slots
  SET slot_status = ?, locked_by = NULL, locked_until = NULL
  WHERE id = ?
`;

/**
 * Returns start_times where a specific customer already has a PENDING or CONFIRMED
 * visit on the given date (across ANY property). Used to hide those slots from the
 * customer's available-slots view so they can't accidentally double-book themselves.
 */
export const CUSTOMER_BUSY_SLOTS_QUERY = `
  SELECT ss.start_time
  FROM visit_requests vr
  JOIN site_slots ss ON vr.slot_id = ss.id
  WHERE vr.customer_id = ?
    AND ss.visit_date = ?
    AND vr.status = 1
    AND vr.visit_request_status IN ('PENDING', 'CONFIRMED')
`;

