export const PROPERTY_INSERT_QUERY = `
  INSERT INTO properties (
    id, property_code, broker_id, property_type, category,
    transaction_type, location, address, owner_name,
    owner_mobile_number, carpet_area, built_up_area, price,
    maintenance_cost, furnishing, parking, floor_number,
    total_floors, property_age, facing, description, amenities,
    available_for_visit, propertiesstatus, broker_commission, status, status_change_date
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
`;

export const PROPERTY_FIND_BY_ID_QUERY = `
  SELECT p.*, 
         u.id as b_id, u.name as b_name, u.email as b_email, u.phone as b_phone
  FROM properties p
  LEFT JOIN users u ON p.broker_id = u.id
  WHERE (p.id = ? OR p.property_code = ?) AND p.status = ?
`;

export const PROPERTY_FIND_MINIMAL_QUERY = `
  SELECT id, broker_id, status, carpet_area, built_up_area, floor_number, total_floors FROM properties WHERE (id = ? OR property_code = ?)
`;

export const PROPERTY_SOFT_DELETE_QUERY = `
  UPDATE properties SET status = ? WHERE id = ?
`;

export const PROPERTY_UPDATE_AVAILABILITY_QUERY = `
  UPDATE properties SET propertiesstatus = ?, status_change_date = ?, updated_at = NOW() WHERE id = ?
`;

export const PROPERTY_FIND_ALL_BASE_QUERY = `
  SELECT p.*, 
          u.id as b_id, u.name as b_name, u.email as b_email, u.phone as b_phone
  FROM properties p
  LEFT JOIN users u ON p.broker_id = u.id
  WHERE 1=1
`;

export const PROPERTY_GET_LATEST_CODE_QUERY = `
  SELECT property_code FROM properties 
  WHERE property_code LIKE ? 
  ORDER BY property_code DESC 
  LIMIT 1 FOR UPDATE
`;
