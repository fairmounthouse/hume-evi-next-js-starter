-- Add sample exhibits for your interview cases
-- First, find your case ID:
-- SELECT id, title FROM interview_cases;

-- Replace 'YOUR_CASE_ID_HERE' with the actual UUID from your interview_cases table
-- You can run this in Supabase SQL Editor

INSERT INTO case_exhibits (
  case_id, 
  exhibit_name, 
  display_name, 
  description, 
  storage_path, 
  file_type,
  display_order,
  is_active
) VALUES 

-- Market Analysis Chart
(
  'YOUR_CASE_ID_HERE', -- Replace with actual case UUID
  'market_analysis_chart',
  'Market Analysis Chart',
  'Comprehensive market analysis showing competitive pricing trends and market positioning across key market segments',
  'exhibits/YOUR_CASE_ID_HERE/market_analysis_chart.png',
  'image/png',
  1,
  true
),

-- Financial Projections
(
  'YOUR_CASE_ID_HERE', -- Replace with actual case UUID
  'financial_projections',
  'Financial Projections',
  'Five-year financial projections with revenue, costs, and profitability scenarios under different market conditions',
  'exhibits/YOUR_CASE_ID_HERE/financial_projections.png',
  'image/png',
  2,
  true
),

-- Competitive Landscape
(
  'YOUR_CASE_ID_HERE', -- Replace with actual case UUID
  'competitive_landscape',
  'Competitive Landscape Map',
  'Visual map of key competitors, their market positions, strategic advantages, and competitive threats',
  'exhibits/YOUR_CASE_ID_HERE/competitive_landscape.png',
  'image/png',
  3,
  true
),

-- Customer Segments
(
  'YOUR_CASE_ID_HERE', -- Replace with actual case UUID
  'customer_segments',
  'Customer Segmentation Analysis',
  'Detailed breakdown of customer segments, their needs, value propositions, and market sizing',
  'exhibits/YOUR_CASE_ID_HERE/customer_segments.png',
  'image/png',
  4,
  true
);

-- Verify the inserts worked:
-- SELECT exhibit_name, display_name FROM case_exhibits WHERE case_id = 'YOUR_CASE_ID_HERE';
