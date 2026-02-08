import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('');
  const [userGroupIds, setUserGroupIds] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [roleGroupError, setRoleGroupError] = useState('');
  const [roleGroupSuccess, setRoleGroupSuccess] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
      });
      setRole(user.role || '');
      loadUserGroups();
      loadAllGroups();
    }
  }, [user]);

  const loadUserGroups = async () => {
    try {
      const response = await api.get(`/users/${user.id}/groups`);
      setUserGroupIds(response.data.map(g => g.id));
    } catch (err) {
      console.error('Failed to load user groups:', err);
    }
  };

  const loadAllGroups = async () => {
    try {
      const response = await api.get('/groups');
      setAllGroups(response.data);
    } catch (err) {
      console.error('Failed to load groups:', err);
    }
  };

  const handleRoleGroupSave = async () => {
    setLoading(true);
    setRoleGroupError('');
    setRoleGroupSuccess('');

    try {
      // Update role
      await api.put(`/users/${user.id}`, { role });

      // Sync group memberships
      const currentResponse = await api.get(`/users/${user.id}/groups`);
      const currentGroupIds = currentResponse.data.map(g => g.id);

      // Add to new groups
      for (const groupId of userGroupIds) {
        if (!currentGroupIds.includes(groupId)) {
          await api.post(`/groups/${groupId}/members`, { userId: user.id });
        }
      }

      // Remove from old groups
      for (const groupId of currentGroupIds) {
        if (!userGroupIds.includes(groupId)) {
          await api.delete(`/groups/${groupId}/members/${user.id}`);
        }
      }

      setRoleGroupSuccess('Role and groups updated successfully!');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setRoleGroupError(err.response?.data?.error || 'Failed to update role and groups');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.put(`/users/${user.id}`, {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      setSuccess('Profile updated successfully!');
      // Reload the page to update the user context
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await api.put(`/users/${user.id}/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="My Profile">
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            My Profile
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* Profile Information Form */}
          <Typography variant="h6" gutterBottom>
            Profile Information
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleProfileUpdate} sx={{ mb: 4 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={loading}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                Update Profile
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
              >
                Cancel
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Role & Group Section */}
          <Typography variant="h6" gutterBottom>
            Role & Group
          </Typography>

          {roleGroupError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {roleGroupError}
            </Alert>
          )}

          {roleGroupSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {roleGroupSuccess}
            </Alert>
          )}

          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!isAdmin || loading}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    label="Role"
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="agent">Agent</MenuItem>
                    <MenuItem value="customer">Customer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!isAdmin || loading}>
                  <InputLabel>Groups</InputLabel>
                  <Select
                    multiple
                    value={userGroupIds}
                    onChange={(e) => setUserGroupIds(e.target.value)}
                    input={<OutlinedInput label="Groups" />}
                    renderValue={(selected) =>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((id) => {
                          const group = allGroups.find(g => g.id === id);
                          return <Chip key={id} label={group?.name || id} size="small" />;
                        })}
                      </Box>
                    }
                  >
                    {allGroups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {isAdmin && (
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleRoleGroupSave}
                  disabled={loading}
                >
                  Save Role & Groups
                </Button>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Change Password Form */}
          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>

          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}

          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {passwordSuccess}
            </Alert>
          )}

          <Box component="form" onSubmit={handlePasswordChange}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  disabled={loading}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                color="warning"
                disabled={loading}
              >
                Change Password
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Layout>
  );
};

export default Profile;
