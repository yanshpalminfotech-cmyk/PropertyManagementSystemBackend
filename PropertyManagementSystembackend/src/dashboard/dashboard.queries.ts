export const DASHBOARD_STATS_QUERY = `
  SELECT
    (SELECT COUNT(*) FROM properties WHERE status = 1) AS totalProperties,
    (SELECT COUNT(*) FROM users WHERE role = 'BROKER' AND status != 127) AS totalBrokers,
    (SELECT COUNT(*) FROM users WHERE role = 'CUSTOMER' AND status != 127) AS totalCustomers
`;

export const BROKER_STATS_QUERY = `
  SELECT
    (SELECT COUNT(*) FROM properties WHERE broker_id = ? AND status = 1) AS totalMyProperties,
    (SELECT COUNT(*) FROM visit_requests vr JOIN properties p ON vr.property_id = p.id 
     WHERE p.broker_id = ? AND vr.visit_request_status = 'PENDING') AS pendingVisits,
    (SELECT COUNT(*) FROM visit_requests vr JOIN properties p ON vr.property_id = p.id 
     WHERE p.broker_id = ? AND vr.visit_request_status = 'CONFIRMED') AS confirmedVisits
`;

export const CUSTOMER_STATS_QUERY = `
  SELECT
    (SELECT COUNT(*) FROM visit_requests WHERE customer_id = ?) AS totalMyRequests,
    (SELECT COUNT(*) FROM visit_requests WHERE customer_id = ? AND visit_request_status = 'COMPLETED') AS completedVisits
`;
