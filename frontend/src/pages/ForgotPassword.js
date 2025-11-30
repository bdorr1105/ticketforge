import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

const ForgotPassword = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loginValue, setLoginValue] = useState('');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { logo, companyName } = useTheme();

  const steps = ['Request Reset', 'Enter Code', 'Set New Password'];

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { loginValue });
      setSuccess(response.data.message);
      setEmail(loginValue.includes('@') ? loginValue : '');
      setActiveStep(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        email: email || loginValue,
        resetCode,
        newPassword,
      });
      setSuccess(response.data.message);
      setActiveStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
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
            Reset Password
          </Typography>

          <Stepper activeStep={activeStep} sx={{ my: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}

          {activeStep === 0 && (
            <Box component="form" onSubmit={handleRequestReset} sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter your username or email address to receive a password reset code.
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                id="loginValue"
                label="Username or Email"
                name="loginValue"
                autoComplete="username"
                autoFocus
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </Button>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Remember your password?{' '}
                  <Link to="/login" style={{ textDecoration: 'none' }}>
                    <Typography component="span" variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                      Sign in here
                    </Typography>
                  </Link>
                </Typography>
              </Box>
            </Box>
          )}

          {activeStep === 1 && (
            <Box component="form" onSubmit={handleResetPassword} sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Check your email for the reset code and enter it below along with your new password.
              </Typography>
              {!email && (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={loginValue}
                  onChange={(e) => setLoginValue(e.target.value)}
                  disabled={loading}
                  helperText="Enter the email address associated with your account"
                />
              )}
              <TextField
                margin="normal"
                required
                fullWidth
                id="resetCode"
                label="Reset Code"
                name="resetCode"
                autoComplete="off"
                autoFocus
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                disabled={loading}
                helperText="6-digit code from your email"
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
                helperText="Must be at least 8 characters"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="confirmPassword"
                label="Confirm Password"
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
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setActiveStep(0)}
                  disabled={loading}
                >
                  Back to Request Reset
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 2 && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Your password has been reset successfully!
              </Typography>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="contained" fullWidth>
                  Go to Login
                </Button>
              </Link>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;
