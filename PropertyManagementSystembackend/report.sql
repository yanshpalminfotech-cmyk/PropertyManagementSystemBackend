
-- QUERY 1

SELECT
  (
    SELECT COUNT(*)
    FROM properties p
    WHERE p.created_at >= '2026-04-10 00:00:00'
      AND p.created_at < '2026-04-11 00:00:00'
      AND p.status = 1
  ) AS total_properties,
  (
    SELECT COUNT(*)
    FROM visit_requests v
    WHERE v.created_at >= '2026-04-10 00:00:00'
      AND v.created_at < '2026-04-11 00:00:00'
      AND v.visit_request_status IN ('PENDING', 'CONFIRMED')
      AND v.status = 1
  ) AS total_visits_scheduled,
  (
    SELECT COUNT(*)
    FROM visit_requests v
    WHERE v.updated_at >= '2026-04-10 00:00:00'
      AND v.updated_at < '2026-04-11 00:00:00'
      AND v.visit_request_status = 'COMPLETED'
      AND v.status = 1
  ) AS total_visits_completed,
  (
    SELECT COUNT(*)
    FROM properties p
    WHERE p.status_change_date >= '2026-04-10 00:00:00'
      AND p.status_change_date < '2026-04-11 00:00:00'
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
      WHERE v.created_at >= '2026-04-10 00:00:00'
        AND v.created_at < '2026-04-11 00:00:00'
      GROUP BY p.id, p.property_code
      ORDER BY inquiry_count DESC
      LIMIT 3
    ) t
  ) AS top_inquired_properties;
  
  
  
-- report 2

select 
	p.id,p.property_type,p.category,p.address as location,p.price,p.carpet_area,u.name,
    DATEDIFF(CURDATE(),p.created_at) as day_count,count(v.id) as total_visit_request_count,
    count(case when v.visit_request_status = 'COMPLETED' then 1 else 0 end) as total_completed_visit_request_count  
from properties p 
inner join users u on p.broker_id = u.id
inner join visit_requests v on v.property_id = p.id and v.visit_request_status != 'CANCELLED' 
group by p.id 
order by total_visit_request_count desc;

-- report 3 

select u.name,
count(DISTINCT p.id) as 'Total Properties',count(DISTINCT case when p.propertiesstatus = 'AVAILABLE' and p.status = 1 then p.id end) as 'Active Property count',
count(DISTINCT case when p.status_change_date is not null and month(p.status_change_date) = month(current_date()) AND YEAR(p.status_change_date) = YEAR(CURRENT_DATE())then p.id end) as 'Properties sold or rented this month' ,
count(DISTINCT v.id) as 'Total visit requests handled',
count(DISTINCT case when v.visit_request_status = 'COMPLETED' then v.id end) as 'Site visits conducted',
COALESCE(round(count(distinct case when p.propertiesstatus in ('SOLD','RENTED') then p.id end)*100 / NULLIF(count(distinct case when v.visit_request_status = 'COMPLETED' then v.id end),0),2),0) as conversion_rate,
count(distinct case when p.propertiesstatus in ('SOLD','RENTED') then p.id end)*100,
NULLIF(count(distinct case when v.visit_request_status = 'COMPLETED' then v.id end),0)
from 
users u 
left join properties p on p.broker_id = u.id and p.status = 1
left join visit_requests v on v.property_id = p.id and v.status = 1
where u.role = 'Broker'
group by u.id,u.name
order by conversion_rate desc;

-- report 4

select 
u.name,u.phone,
count(distinct v.id) AS 'Total visit requests made',
COUNT(distinct case when v.visit_request_status = 'COMPLETED' then v.id end) as 'Total visits completed',
round((COUNT(distinct case when v.visit_request_status = 'COMPLETED' then v.id end)*100/count(distinct v.id)),2) as 'Visit completion rate',
(select vf.interest_level from visit_requests v2 left join visit_feedback vf on v2.id = vf.visit_request_id group by vf.interest_level order by count(v2.id) desc limit 1) AS most_common_interest_level,
MAX(v.created_at) AS last_activity_date
from users u 
left join visit_requests v on v.customer_id = u.id and v.status = 1
where u.role = 'CUSTOMER'
group by u.id,u.name
order by count(distinct v.id) desc; 