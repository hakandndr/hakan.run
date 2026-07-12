-- Update portfolio section in site_content
-- Run in: Supabase Dashboard → SQL Editor → New query → Run

INSERT INTO site_content (section, data)
VALUES (
  'portfolio',
  '{
    "badge": "Selected Works",
    "heading": "Explore my latest",
    "headingAccent": "technical builds",
    "subtitle": "A curated selection of my recent software development projects, automation frameworks, and technical implementations.",
    "cards": [
      {
        "id": 1,
        "slug": "full-stack-development",
        "title": "Full Stack Development",
        "description": "Building scalable web applications with clean architecture, responsive design, and real-world product functionality.",
        "imgSrc": "/portfolio/full-stack-saas-card.svg",
        "externalUrl": ""
      },
      {
        "id": 2,
        "slug": "ai-and-automation",
        "title": "AI & Automation",
        "description": "Designing automation workflows and Playwright-based testing solutions to improve quality, speed, and reliability.",
        "imgSrc": "/portfolio/qa-automation-card.svg",
        "externalUrl": ""
      },
      {
        "id": 3,
        "slug": "it-infrastructure",
        "title": "IT Infrastructure",
        "description": "Hands-on experience in systems support, endpoint deployment, network organization, and IT operations.",
        "imgSrc": "/portfolio/it-infrastructure-card.svg",
        "externalUrl": ""
      }
    ]
  }'::jsonb
)
ON CONFLICT (section)
DO UPDATE SET
  data       = EXCLUDED.data,
  updated_at = now();
