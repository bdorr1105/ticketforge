-- Seed initial data
-- Note: Default admin password is 'admin123' - CHANGE THIS IMMEDIATELY IN PRODUCTION

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('site_name', 'TicketForge', 'Application name'),
('tickets_per_page', '25', 'Number of tickets to display per page'),
('allow_customer_registration', 'false', 'Allow customers to self-register'),
('require_email_verification', 'true', 'Require email verification for new accounts'),
('max_attachment_size', '26214400', 'Maximum file upload size in bytes (25MB)'),
('allowed_attachment_types', 'image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Allowed file MIME types');

-- Note: Default admin user will be created automatically by the backend
-- on first startup using credentials from .env file

-- Insert default help desk group
INSERT INTO groups (name, description)
VALUES ('Technical Support', 'Main technical support team');
