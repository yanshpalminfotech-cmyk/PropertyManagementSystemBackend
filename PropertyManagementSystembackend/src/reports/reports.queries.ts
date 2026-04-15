
/**
 * Report 1: Daily System Summary
 * Tracks properties, visits, and closed deals relative to CURDATE()
 */
export const DAILY_SUMMARY_QUERY = `
SELECT
  (
    SELECT COUNT(*)
    FROM properties p
    WHERE p.created_at >= CURDATE()
      AND p.created_at < CURDATE() + INTERVAL 1 DAY
      AND p.status = 1
  ) AS total_properties,
  (
    SELECT COUNT(*)
    FROM visit_requests v
    WHERE v.created_at >= CURDATE()
      AND v.created_at < CURDATE() + INTERVAL 1 DAY
      AND v.visit_request_status IN ('PENDING', 'CONFIRMED')
      AND v.status = 1
  ) AS total_visits_scheduled,
  (
    SELECT COUNT(*)
    FROM visit_requests v
    WHERE v.updated_at >= CURDATE()
      AND v.updated_at < CURDATE() + INTERVAL 1 DAY
      AND v.visit_request_status = 'COMPLETED'
      AND v.status = 1
  ) AS total_visits_completed,
  (
    SELECT COUNT(*)
    FROM properties p
    WHERE p.status_change_date >= CURDATE()
      AND p.status_change_date < CURDATE() + INTERVAL 1 DAY
      AND p.propertiesstatus IN ('SOLD', 'RENTED')
  ) AS total_closed_properties,
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'propertyId', t.property_id,
        'propertyCode', t.property_code,
        'inquiryCount', t.inquiry_count
      )
    )
    FROM (
      SELECT 
        p.id AS property_id,
        p.property_code,
        COUNT(v.id) AS inquiry_count
      FROM visit_requests v
      JOIN properties p ON v.property_id = p.id
      WHERE v.created_at >= CURDATE()
        AND v.created_at < CURDATE() + INTERVAL 1 DAY
      GROUP BY p.id, p.property_code
      ORDER BY inquiry_count DESC
      LIMIT 3
    ) t
  ) AS top_inquired_properties;
`;

/**
 * Report 2: Property Performance
 */
export const PROPERTY_PERFORMANCE_QUERY = `
SELECT 
  p.id,
  p.property_code as propertyCode,
  p.property_type as type,
  p.category,
  p.address as location,
  p.price,
  p.carpet_area as carpetArea,
  u.name as brokerName,
  DATEDIFF(CURDATE(), p.created_at) as dayCount,
  COUNT(v.id) as totalVisitRequests,
  COUNT(CASE WHEN v.visit_request_status = 'COMPLETED' THEN 1 END) as completedVisits  
FROM properties p 
INNER JOIN users u ON p.broker_id = u.id
LEFT JOIN visit_requests v ON v.property_id = p.id AND v.status = 1 AND v.visit_request_status != 'CANCELLED' 
GROUP BY p.id 
ORDER BY totalVisitRequests DESC;
`;

/**
 * Report 3: Broker Performance
 */
export const BROKER_PERFORMANCE_QUERY = `
SELECT 
  u.name as brokerName,
  COUNT(DISTINCT p.id) as totalProperties,
  COUNT(DISTINCT CASE WHEN p.propertiesstatus = 'AVAILABLE' AND p.status = 1 THEN p.id END) as activeProperties,
  COUNT(DISTINCT CASE WHEN p.status_change_date IS NOT NULL AND MONTH(p.status_change_date) = MONTH(CURRENT_DATE()) AND YEAR(p.status_change_date) = YEAR(CURRENT_DATE()) THEN p.id END) as closedThisMonth,
  COUNT(DISTINCT v.id) as totalVisitRequests,
  COUNT(DISTINCT CASE WHEN v.visit_request_status = 'COMPLETED' THEN v.id END) as siteVisitsConducted,
  COALESCE(ROUND(COUNT(DISTINCT CASE WHEN p.propertiesstatus IN ('SOLD','RENTED') THEN p.id END)*100 / NULLIF(COUNT(DISTINCT CASE WHEN v.visit_request_status = 'COMPLETED' THEN v.id END), 0), 2), 0) as conversionRate
FROM users u 
LEFT JOIN properties p ON p.broker_id = u.id AND p.status = 1
LEFT JOIN visit_requests v ON v.property_id = p.id AND v.status = 1
WHERE u.role = 'BROKER'
GROUP BY u.id, u.name
ORDER BY conversionRate DESC;
`;

/**
 * Report 4: Customer Engagement
 */
export const CUSTOMER_ENGAGEMENT_QUERY = `
SELECT 
  u.name as customerName,
  u.phone,
  COUNT(DISTINCT v.id) AS totalVisitsRequested,
  COUNT(DISTINCT CASE WHEN v.visit_request_status = 'COMPLETED' THEN v.id END) as visitsCompleted,
  ROUND((COUNT(DISTINCT CASE WHEN v.visit_request_status = 'COMPLETED' THEN v.id END)*100 / NULLIF(COUNT(DISTINCT v.id), 0)), 2) as completionRate,
  (SELECT vf.interest_level FROM visit_requests v2 LEFT JOIN visit_feedback vf ON v2.id = vf.visit_request_id WHERE v2.customer_id = u.id GROUP BY vf.interest_level ORDER BY COUNT(v2.id) DESC LIMIT 1) AS mostCommonInterest,
  MAX(v.created_at) AS lastActivityDate
FROM users u 
LEFT JOIN visit_requests v ON v.customer_id = u.id AND v.status = 1
WHERE u.role = 'CUSTOMER'
GROUP BY u.id, u.name
ORDER BY totalVisitsRequested DESC;
`;
