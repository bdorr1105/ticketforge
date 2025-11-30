import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import Layout from '../components/Layout';
import api from '../services/api';

const CreateTicket = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'low',
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('subject', formData.subject);
      data.append('description', formData.description);
      data.append('priority', formData.priority);

      attachments.forEach((file) => {
        data.append('attachments', file);
      });

      const response = await api.post('/tickets', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate(`/tickets/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create ticket:', error);
      setError(error.response?.data?.error || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Create New Ticket">
      <Box sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={() => navigate('/tickets')}>
          Back to Tickets
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Create New Ticket
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Subject"
            variant="outlined"
            value={formData.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={6}
            label="Description"
            variant="outlined"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              label="Priority"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mb: 2 }}>
            <Button variant="outlined" component="label">
              Attach Files
              <input
                type="file"
                hidden
                multiple
                onChange={(e) => setAttachments(Array.from(e.target.files))}
              />
            </Button>
            {attachments.length > 0 && (
              <Typography variant="caption" sx={{ ml: 2 }}>
                {attachments.length} file(s) selected: {attachments.map(f => f.name).join(', ')}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Creating...' : 'Create Ticket'}
            </Button>
            <Button variant="outlined" onClick={() => navigate('/tickets')}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Layout>
  );
};

export default CreateTicket;
