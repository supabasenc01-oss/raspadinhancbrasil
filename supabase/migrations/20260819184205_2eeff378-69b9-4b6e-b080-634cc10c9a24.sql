UPDATE system_settings 
SET value = '"logos/logo.png"'::jsonb 
WHERE key = 'logo_url';

UPDATE system_settings 
SET value = '"logos/favicon.png"'::jsonb 
WHERE key = 'favicon_url';