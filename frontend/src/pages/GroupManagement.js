import React, { useEffect, useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, People as PeopleIcon } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';

const GroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await api.get('/groups');
      // Load members for each group
      const groupsWithMembers = await Promise.all(
        response.data.map(async (group) => {
          try {
            const detailResponse = await api.get(`/groups/${group.id}`);
            return detailResponse.data;
          } catch (error) {
            return group;
          }
        })
      );
      setGroups(groupsWithMembers);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const handleOpen = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        description: group.description || '',
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        description: '',
      });
    }
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingGroup(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingGroup) {
        await api.put(`/groups/${editingGroup.id}`, formData);
      } else {
        await api.post('/groups', formData);
      }
      loadGroups();
      handleClose();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save group');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this group?')) {
      return;
    }

    try {
      await api.delete(`/groups/${id}`);
      loadGroups();
    } catch (error) {
      console.error('Failed to delete group:', error);
      alert(error.response?.data?.error || 'Failed to delete group');
    }
  };

  return (
    <Layout title="Group Management">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Group Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Group
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Members</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>{group.name}</TableCell>
                <TableCell>{group.description || '-'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon fontSize="small" />
                    {group.members?.length || 0}
                    {group.members && group.members.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {group.members.slice(0, 3).map((member) => (
                          <Chip key={member.id} label={member.username} size="small" />
                        ))}
                        {group.members.length > 3 && (
                          <Chip label={`+${group.members.length - 3}`} size="small" />
                        )}
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{new Date(group.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(group)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(group.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingGroup ? 'Edit Group' : 'Add New Group'}</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Group Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{ mt: 2, mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingGroup ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Layout>
  );
};

export default GroupManagement;
