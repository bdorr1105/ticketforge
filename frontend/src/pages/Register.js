import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Grid,
  LinearProgress,
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [redirectTimer, setRedirectTimer] = useState(null);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const { logo, companyName } = useTheme();
  const navigate = useNavigate();

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimer) {
        clearInterval(redirectTimer);
      }
    };
  }, [redirectTimer]);

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const response = await api.get(`/auth/check-username/${encodeURIComponent(username)}`);
        setUsernameAvailable(response.data.available);
      } catch (err) {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate username
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (usernameAvailable === false) {
      setError('Username is already taken. Please choose a different username.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        firstName,
        lastName,
        username,
        email,
      });

      setSuccess(response.data.message);
      setTempPassword(response.data.tempPassword);

      // Start countdown timer
      setCountdown(30);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/login', { state: { message: 'Registration successful! Please log in with your temporary password. After login, you will be asked to change your password.' } });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setRedirectTimer(timer);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRedirect = () => {
    if (redirectTimer) {
      clearInterval(redirectTimer);
    }
    navigate('/login', { state: { message: 'Registration successful! Please log in with your temporary password. After login, you will be asked to change your password.' } });
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
            Register
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
            Create a new account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Registration Successful!
              </Typography>
              {tempPassword && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Your temporary password:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '1.1em', mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                    {tempPassword}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 2, color: 'warning.main', fontWeight: 'bold' }}>
                    ⚠️ Please copy this password now! It will also be sent to your email.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    <strong>Next steps:</strong>
                  </Typography>
                  <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                    1. Click the button below to proceed to the login page
                    <br />
                    2. Log in with your email and temporary password
                    <br />
                    3. You will be required to change your password
                    <br />
                    4. Check your email for a 6-digit verification code
                    <br />
                    5. Verify your email using the code
                  </Typography>

                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(countdown / 30) * 100}
                      sx={{ flexGrow: 1 }}
                    />
                    <Typography variant="body2" sx={{ minWidth: 40 }}>
                      {countdown}s
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleManualRedirect}
                    sx={{ mt: 2 }}
                  >
                    Continue to Login
                  </Button>
                </Box>
              )}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  autoComplete="given-name"
                  autoFocus
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                />
              </Grid>
            </Grid>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              error={usernameAvailable === false}
              helperText={
                checkingUsername
                  ? 'Checking availability...'
                  : usernameAvailable === false
                  ? 'Username is already taken'
                  : usernameAvailable === true
                  ? 'Username is available'
                  : 'Minimum 3 characters'
              }
              color={usernameAvailable === true ? 'success' : undefined}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Typography component="span" variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                    Sign in here
                  </Typography>
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
