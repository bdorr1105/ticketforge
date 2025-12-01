import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { PhotoCamera, Image as ImageIcon } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const Settings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [agents, setAgents] = useState([]);
  const { mode, primaryColor, companyName, updatePrimaryColor, updateCompanyName, refreshTheme } = useTheme();

  const [smtpSettings, setSmtpSettings] = useState({
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_password: '',
    smtp_from_email: '',
    smtp_from_name: '',
  });

  const [themeSettings, setThemeSettings] = useState({
    theme_mode: mode,
    primary_color: primaryColor,
    company_name: companyName,
  });

  const [generalSettings, setGeneralSettings] = useState({
    site_name: '',
    tickets_per_page: '',
    max_attachment_size_mb: '',
    auto_assign_agent: '',
  });

  const [registrationSettings, setRegistrationSettings] = useState({
    registration_enabled: 'false',
    allowed_email_domains: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);

  useEffect(() => {
    loadSettings();
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const response = await api.get('/users?role=agent,admin');
      setAgents(response.data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data);

      // Populate general settings - convert bytes to MB for display
      const maxSizeBytes = parseInt(response.data.max_attachment_size?.value || '26214400');
      const maxSizeMB = maxSizeBytes / (1024 * 1024);

      setGeneralSettings({
        site_name: response.data.site_name?.value || '',
        tickets_per_page: response.data.tickets_per_page?.value || '',
        max_attachment_size_mb: maxSizeMB.toString(),
        auto_assign_agent: response.data.auto_assign_agent?.value || '',
      });

      // Populate registration settings
      setRegistrationSettings({
        registration_enabled: response.data.registration_enabled?.value || 'false',
        allowed_email_domains: response.data.allowed_email_domains?.value || '',
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleUpdateSetting = async (key, value) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.put(`/settings/${key}`, { value });
      setSuccess('Setting updated successfully');
      loadSettings();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update setting');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneralSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Save site_name
      if (generalSettings.site_name) {
        await api.put('/settings/site_name', { value: generalSettings.site_name });
      }

      // Save tickets_per_page
      if (generalSettings.tickets_per_page) {
        await api.put('/settings/tickets_per_page', { value: generalSettings.tickets_per_page });
      }

      // Convert MB to bytes and save max_attachment_size
      if (generalSettings.max_attachment_size_mb) {
        const sizeInBytes = Math.round(parseFloat(generalSettings.max_attachment_size_mb) * 1024 * 1024);
        await api.put('/settings/max_attachment_size', { value: sizeInBytes.toString() });
      }

      // Save auto_assign_agent (empty string means unassigned)
      await api.put('/settings/auto_assign_agent', { value: generalSettings.auto_assign_agent });

      setSuccess('General settings updated successfully');
      loadSettings();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update general settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      for (const [key, value] of Object.entries(smtpSettings)) {
        if (value) {
          await api.put(`/settings/${key}`, { value });
        }
      }
      setSuccess('SMTP settings updated successfully');
      loadSettings();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update SMTP settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTheme = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Update theme settings in database
      await api.put('/theme/settings', themeSettings);

      // Update local theme context
      if (themeSettings.primary_color) {
        updatePrimaryColor(themeSettings.primary_color);
      }
      if (themeSettings.company_name) {
        updateCompanyName(themeSettings.company_name);
      }

      setSuccess('Theme settings updated successfully');
      await refreshTheme();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update theme settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'logo') {
      setLogoFile(file);
    } else {
      setFaviconFile(file);
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/theme/upload/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(`${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`);
      await refreshTheme();
    } catch (error) {
      setError(error.response?.data?.error || `Failed to upload ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Update registration enabled setting
      await api.put('/settings/registration_enabled', {
        value: registrationSettings.registration_enabled,
      });

      // Update allowed email domains setting
      await api.put('/settings/allowed_email_domains', {
        value: registrationSettings.allowed_email_domains,
      });

      setSuccess('Registration settings saved successfully');
      loadSettings();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save registration settings');
    } finally {
      setLoading(false);
    }
  };

  const predefinedColors = [
    { name: 'Blue', value: '#1976d2' },
    { name: 'Red', value: '#d32f2f' },
    { name: 'Green', value: '#388e3c' },
    { name: 'Purple', value: '#7b1fa2' },
    { name: 'Orange', value: '#f57c00' },
    { name: 'Teal', value: '#00796b' },
    { name: 'Pink', value: '#c2185b' },
    { name: 'Indigo', value: '#303f9f' },
  ];

  return (
    <Layout title="Settings">
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Theme & Branding
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box component="form" onSubmit={handleSaveTheme}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={themeSettings.company_name}
                onChange={(e) => setThemeSettings({ ...themeSettings, company_name: e.target.value })}
                helperText="Displayed in the header and page title"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Theme Mode</InputLabel>
                <Select
                  value={themeSettings.theme_mode}
                  label="Theme Mode"
                  onChange={(e) => setThemeSettings({ ...themeSettings, theme_mode: e.target.value })}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Primary Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {predefinedColors.map((color) => (
                  <Box
                    key={color.value}
                    onClick={() => setThemeSettings({ ...themeSettings, primary_color: color.value })}
                    sx={{
                      width: 50,
                      height: 50,
                      backgroundColor: color.value,
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: themeSettings.primary_color === color.value ? '3px solid black' : '1px solid #ccc',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      },
                    }}
                    title={color.name}
                  />
                ))}
              </Box>
              <TextField
                label="Custom Color (Hex)"
                value={themeSettings.primary_color}
                onChange={(e) => setThemeSettings({ ...themeSettings, primary_color: e.target.value })}
                placeholder="#1976d2"
                helperText="Enter a custom hex color code"
                sx={{ maxWidth: 300 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Company Logo
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
                fullWidth
              >
                Upload Logo
                <input
                  type="file"
                  hidden
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={(e) => handleLogoUpload(e, 'logo')}
                />
              </Button>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Recommended: PNG or SVG, max 200px height
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Favicon
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<ImageIcon />}
                fullWidth
              >
                Upload Favicon
                <input
                  type="file"
                  hidden
                  accept="image/x-icon,image/png"
                  onChange={(e) => handleLogoUpload(e, 'favicon')}
                />
              </Button>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Recommended: ICO or PNG, 32x32 or 64x64
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save Theme Settings'}
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          General Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box component="form" onSubmit={handleSaveGeneralSettings}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Site Name"
                value={generalSettings.site_name}
                onChange={(e) => setGeneralSettings({ ...generalSettings, site_name: e.target.value })}
                helperText="The name of your help desk system (currently not displayed in UI - reserved for future use)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tickets Per Page"
                type="number"
                value={generalSettings.tickets_per_page}
                onChange={(e) => setGeneralSettings({ ...generalSettings, tickets_per_page: e.target.value })}
                helperText="Number of tickets to display per page"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Attachment Size (MB)"
                type="number"
                inputProps={{ step: "0.1", min: "0" }}
                value={generalSettings.max_attachment_size_mb}
                onChange={(e) => setGeneralSettings({ ...generalSettings, max_attachment_size_mb: e.target.value })}
                helperText="Maximum file upload size in megabytes (default: 25 MB)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Auto-Assign New Tickets To</InputLabel>
                <Select
                  value={generalSettings.auto_assign_agent}
                  label="Auto-Assign New Tickets To"
                  onChange={(e) => setGeneralSettings({ ...generalSettings, auto_assign_agent: e.target.value })}
                >
                  <MenuItem value="">Unassigned (Default)</MenuItem>
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.username} ({agent.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                Automatically assign new tickets to a specific agent (leave as "Unassigned" for manual assignment)
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save General Settings'}
            </Button>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> Site Name is stored but not currently displayed in the UI.
              Company Name (in Theme & Branding section above) is what appears in the header and page title.
            </Typography>
          </Alert>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Registration Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box component="form" onSubmit={handleSaveRegistration}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Enable Registration</InputLabel>
                <Select
                  value={registrationSettings.registration_enabled}
                  label="Enable Registration"
                  onChange={(e) => setRegistrationSettings({ ...registrationSettings, registration_enabled: e.target.value })}
                >
                  <MenuItem value="true">Enabled</MenuItem>
                  <MenuItem value="false">Disabled</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                Allow new users to register for an account
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Allowed Email Domains"
                value={registrationSettings.allowed_email_domains}
                onChange={(e) => setRegistrationSettings({ ...registrationSettings, allowed_email_domains: e.target.value })}
                placeholder="example.com, company.org"
                helperText="Comma-separated list of allowed email domains (leave empty to allow all)"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save Registration Settings'}
            </Button>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              When registration is enabled, users can create new accounts on the login page.
              New users are automatically assigned the "customer" role.
              You can restrict registration to specific email domains for added security.
            </Typography>
          </Alert>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          SMTP Email Configuration
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box component="form" onSubmit={handleSaveSmtp}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SMTP Host"
                value={smtpSettings.smtp_host}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_host: e.target.value })}
                placeholder="smtp.gmail.com"
                helperText="SMTP server hostname"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SMTP Port"
                type="number"
                value={smtpSettings.smtp_port}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_port: e.target.value })}
                placeholder="587"
                helperText="SMTP server port (usually 587 or 465)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SMTP Username"
                value={smtpSettings.smtp_user}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_user: e.target.value })}
                placeholder="your-email@gmail.com"
                helperText="SMTP authentication username"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SMTP Password"
                type="password"
                value={smtpSettings.smtp_password}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_password: e.target.value })}
                placeholder="your-password"
                helperText="SMTP authentication password"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="From Email"
                type="email"
                value={smtpSettings.smtp_from_email}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_from_email: e.target.value })}
                placeholder="support@yourcompany.com"
                helperText="Email address to send from"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="From Name"
                value={smtpSettings.smtp_from_name}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_from_name: e.target.value })}
                placeholder="Support Team"
                helperText="Display name for outgoing emails"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save SMTP Settings'}
            </Button>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Gmail Users:</strong> You need to use an App Password instead of your regular
              password. Generate one in your Google Account settings under Security.
            </Typography>
          </Alert>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom color="error">
          Dangerous Zone
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> These actions cannot be undone. Please be absolutely sure before proceeding.
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Reset Database
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will delete all tickets and reset theme/site settings to defaults.
            <strong> User accounts and passwords will NOT be deleted.</strong>
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={async () => {
              if (window.confirm('Are you sure you want to reset the database? This will delete ALL tickets and reset settings to defaults. User accounts will be preserved.')) {
                if (window.confirm('This is your last chance. Are you ABSOLUTELY sure? All tickets will be permanently deleted!')) {
                  setLoading(true);
                  setError('');
                  setSuccess('');
                  try {
                    await api.post('/settings/reset-database');
                    setSuccess('Database reset successfully. All tickets deleted and settings restored to defaults.');
                    await loadSettings();
                    await refreshTheme();
                  } catch (error) {
                    setError(error.response?.data?.error || 'Failed to reset database');
                  } finally {
                    setLoading(false);
                  }
                }
              }
            }}
            disabled={loading}
          >
            Reset Database
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {Object.entries(settings).map(([key, data]) => (
          <Box key={key} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="primary">
              {key}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {data.description}
            </Typography>
            <Typography variant="body1">{data.value}</Typography>
          </Box>
        ))}
      </Paper>
    </Layout>
  );
};

export default Settings;
