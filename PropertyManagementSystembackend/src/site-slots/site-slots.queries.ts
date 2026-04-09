export const SITE_SLOT_FIND_BOOKED_QUERY = `
  SELECT start_time as startTime 
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
