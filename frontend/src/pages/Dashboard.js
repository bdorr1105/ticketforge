import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import {
  ConfirmationNumber,
  CheckCircle,
  HourglassEmpty,
  Warning,
  Schedule,
  Archive,
} from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    pending: 0,
    resolved: 0,
    closed: 0,
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/tickets');
      const tickets = response.data;

      setStats({
        total: tickets.length,
        open: tickets.filter((t) => t.status === 'open').length,
        inProgress: tickets.filter((t) => t.status === 'in_progress').length,
        pending: tickets.filter((t) => t.status === 'pending').length,
        resolved: tickets.filter((t) => t.status === 'resolved').length,
        closed: tickets.filter((t) => t.status === 'closed').length,
      });

      setRecentTickets(tickets.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
          </Box>
          <Box sx={{ color }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Layout title="Dashboard">
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.firstName || user?.username}!
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Tickets"
            value={stats.total}
            icon={<ConfirmationNumber sx={{ fontSize: 40 }} />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Open"
            value={stats.open}
            icon={<Warning sx={{ fontSize: 40 }} />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={<HourglassEmpty sx={{ fontSize: 40 }} />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<Schedule sx={{ fontSize: 40 }} />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Resolved"
            value={stats.resolved}
            icon={<CheckCircle sx={{ fontSize: 40 }} />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Closed"
            value={stats.closed}
            icon={<Archive sx={{ fontSize: 40 }} />}
            color="text.secondary"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Recent Tickets</Typography>
          <Button variant="outlined" onClick={() => navigate('/tickets')}>
            View All
          </Button>
        </Box>
        {recentTickets.length === 0 ? (
          <Typography color="textSecondary">No tickets found</Typography>
        ) : (
          recentTickets.map((ticket) => (
            <Box
              key={ticket.id}
              sx={{
                p: 2,
                mb: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              onClick={() => navigate(`/tickets/${ticket.id}`)}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">
                  #{ticket.ticket_number} - {ticket.subject}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor:
                      ticket.status === 'open'
                        ? 'error.light'
                        : ticket.status === 'in_progress'
                        ? 'warning.light'
                        : 'success.light',
                  }}
                >
                  {ticket.status.replace('_', ' ').toUpperCase()}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Priority: {ticket.priority} | Created: {new Date(ticket.created_at).toLocaleDateString()}
              </Typography>
            </Box>
          ))
        )}
      </Paper>
    </Layout>
  );
};

export default Dashboard;
