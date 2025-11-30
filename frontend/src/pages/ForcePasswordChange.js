import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

const ForcePasswordChange = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { logo, companyName } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      // Password changed successfully, redirect to verify email if not verified, otherwise to dashboard
      const userResponse = await api.get('/auth/me');
      const userData = userResponse.data;

      // Built-in admin account (admin@ticketforge.local) should skip email verification
      const isBuiltInAdmin = userData.email === 'admin@ticketforge.local' && userData.role === 'admin';

      if (!userData.emailVerified && !isBuiltInAdmin) {
        navigate('/verify-email', {
          state: {
            message: 'Password changed successfully! Please verify your email to continue.',
            email: userData.email
          }
        });
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          {logo && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Box
                component="img"
                src={logo}
                alt="Logo"
                sx={{ maxHeight: 80, maxWidth: '100%' }}
              />
            </Box>
          )}
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            {companyName}
          </Typography>
          <Typography variant="h5" align="center" gutterBottom>
            Password Change Required
          </Typography>

          <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              You must change your password before continuing. This is required for temporary passwords and first-time logins.
            </Typography>
          </Alert>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Password Requirements:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 30 }}>
                <CheckCircle fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText primary="At least 8 characters long" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 30 }}>
                <CheckCircle fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText primary="At least 1 uppercase letter" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 30 }}>
                <CheckCircle fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText primary="At least 1 lowercase letter" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 30 }}>
                <CheckCircle fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText primary="At least 1 number" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 30 }}>
                <CheckCircle fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText primary="At least 1 symbol (!@#$%^&*()_+-=[]{}...)" />
            </ListItem>
          </List>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="currentPassword"
              label="Current Password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="newPassword"
              label="New Password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="confirmPassword"
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForcePasswordChange;
