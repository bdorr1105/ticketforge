-- Insert default theme settings
INSERT INTO settings (key, value, description)
VALUES
  ('theme_mode', 'light', 'Application theme mode (light or dark)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, description)
VALUES
  ('primary_color', '#1976d2', 'Primary brand color (hex code)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, description)
VALUES
  ('company_name', 'TicketForge', 'Company/Organization name displayed in header')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, description)
VALUES
  ('logo_url', NULL, 'URL path to company logo image')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, description)
VALUES
  ('favicon_url', NULL, 'URL path to favicon image')
ON CONFLICT (key) DO NOTHING;
