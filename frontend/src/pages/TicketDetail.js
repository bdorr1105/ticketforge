import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  Chip,
  TextField,
  Button,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { AttachFile, Lock, Download, Visibility, Close, Reply, NoteAdd, Edit, Delete as DeleteIcon } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const TicketDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agents, setAgents] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [showInternalNoteForm, setShowInternalNoteForm] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isAgent = user?.role === 'admin' || user?.role === 'agent';

  const handlePreviewAttachment = (attachment) => {
    setPreviewAttachment(attachment);
    setPreviewOpen(true);
  };

  const handleDownloadAttachment = (attachment) => {
    const link = document.createElement('a');
    link.href = `/uploads/tickets/${attachment.filename}`;
    link.download = attachment.original_filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImageFile = (filename) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  useEffect(() => {
    loadTicket();
    loadComments();
    if (isAgent) {
      loadAgents();
    }
  }, [id]);

  const loadTicket = async () => {
    try {
      const response = await api.get(`/tickets/${id}`);
      setTicket(response.data);
    } catch (error) {
      console.error('Failed to load ticket:', error);
      setError('Failed to load ticket');
    }
  };

  const loadComments = async () => {
    try {
      const response = await api.get(`/comments/ticket/${id}`);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await api.get('/users?role=agent,admin');
      setAgents(response.data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const handleUpdateTicket = async (field, value) => {
    try {
      await api.put(`/tickets/${id}`, { [field]: value });
      loadTicket();
    } catch (error) {
      console.error('Failed to update ticket:', error);
      setError('Failed to update ticket');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('ticketId', id);
      formData.append('content', newComment);
      formData.append('isInternal', isInternal);

      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      await api.post('/comments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setNewComment('');
      setIsInternal(false);
      setAttachments([]);
      setReplyingToCommentId(null);
      setShowInternalNoteForm(false);
      loadComments();
      loadTicket();
    } catch (error) {
      console.error('Failed to add comment:', error);
      setError('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyClick = (commentId, isInternalComment = false) => {
    setReplyingToCommentId(commentId);
    setShowInternalNoteForm(false);
    setIsInternal(isInternalComment); // If replying to internal comment, make reply internal too
    setNewComment('');
    setAttachments([]);
  };

  const handleInternalNoteClick = () => {
    setShowInternalNoteForm(true);
    setReplyingToCommentId(null);
    setIsInternal(true);
    setNewComment('');
    setAttachments([]);
  };

  const handleCancelReply = () => {
    setReplyingToCommentId(null);
    setShowInternalNoteForm(false);
    setNewComment('');
    setAttachments([]);
    setIsInternal(false);
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
  };

  const handleSaveEditComment = async (commentId) => {
    try {
      await api.put(`/comments/${commentId}`, { content: editCommentContent });
      setEditingCommentId(null);
      setEditCommentContent('');
      loadComments();
    } catch (error) {
      console.error('Failed to update comment:', error);
      setError(error.response?.data?.error || 'Failed to update comment');
    }
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentContent('');
  };

  const handleDeleteTicket = async () => {
    try {
      await api.delete(`/tickets/${id}`);
      setDeleteDialogOpen(false);
      navigate('/tickets');
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      setError(error.response?.data?.error || 'Failed to delete ticket');
      setDeleteDialogOpen(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'error',
      in_progress: 'warning',
      pending: 'info',
      resolved: 'success',
      closed: 'default',
    };
    return colors[status] || 'default';
  };

  if (!ticket) {
    return (
      <Layout title="Loading...">
        <Typography>Loading ticket...</Typography>
      </Layout>
    );
  }

  return (
    <Layout title={`Ticket #${ticket.ticket_number}`}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="outlined" onClick={() => navigate('/tickets')}>
          Back to Tickets
        </Button>
        {user?.role === 'admin' && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Ticket
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            #{ticket.ticket_number} - {ticket.subject}
          </Typography>
          <Chip label={ticket.status.replace('_', ' ')} color={getStatusColor(ticket.status)} />
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="textSecondary">
              Customer: {ticket.customer_username || 'N/A'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Created: {new Date(ticket.created_at).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="textSecondary">
              Priority: {ticket.priority}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Updated: {new Date(ticket.updated_at).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>

        {isAgent && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={ticket.status}
                  onChange={(e) => handleUpdateTicket('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={ticket.priority}
                  onChange={(e) => handleUpdateTicket('priority', e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Assigned To</InputLabel>
                <Select
                  value={ticket.assigned_to || ''}
                  onChange={(e) => handleUpdateTicket('assignedTo', e.target.value || null)}
                  label="Assigned To"
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.username} ({agent.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Description
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
          {ticket.description}
        </Typography>

        {ticket.attachments && ticket.attachments.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>
              Attachments
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {ticket.attachments.map((att) => (
                <Box key={att.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={<AttachFile />}
                    label={att.original_filename}
                    variant="outlined"
                    sx={{ minWidth: 200 }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => handleDownloadAttachment(att)}
                  >
                    Download
                  </Button>
                  {isImageFile(att.original_filename) && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handlePreviewAttachment(att)}
                    >
                      Preview
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
          </>
        )}
      </Paper>

      <Typography variant="h5" gutterBottom>
        Comments ({comments.length})
      </Typography>

      {comments.map((comment) => (
        <Card
          key={comment.id}
          sx={{
            mb: 2,
            bgcolor: comment.is_internal ? 'warning.lighter' : 'background.paper',
            border: comment.is_internal ? '2px solid' : 'none',
            borderColor: comment.is_internal ? 'warning.main' : 'transparent',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2">{comment.username}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {new Date(comment.created_at).toLocaleString()}
                </Typography>
                {comment.is_internal && (
                  <Chip icon={<Lock />} label="Internal" size="small" color="warning" />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={comment.role} size="small" variant="outlined" />
                {comment.user_id === user?.id && (
                  <IconButton
                    size="small"
                    onClick={() => handleEditComment(comment)}
                    disabled={editingCommentId === comment.id}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
            {editingCommentId === comment.id ? (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  value={editCommentContent}
                  onChange={(e) => setEditCommentContent(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleSaveEditComment(comment.id)}
                    disabled={!editCommentContent.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleCancelEditComment}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {comment.content}
              </Typography>
            )}
            {comment.attachments && comment.attachments.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                {comment.attachments.map((att) => (
                  <Box key={att.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      icon={<AttachFile />}
                      label={att.original_filename}
                      size="small"
                      variant="outlined"
                      sx={{ minWidth: 180 }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => handleDownloadAttachment(att)}
                    >
                      Download
                    </Button>
                    {isImageFile(att.original_filename) && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => handlePreviewAttachment(att)}
                      >
                        Preview
                      </Button>
                    )}
                  </Box>
                ))}
              </Box>
            )}

            {/* Reply button - show on all comments (agents can reply to internal comments) */}
            {(!comment.is_internal || isAgent) && (
              <Box sx={{ mt: 2 }}>
                <Button
                  size="small"
                  startIcon={<Reply />}
                  onClick={() => handleReplyClick(comment.id, comment.is_internal)}
                  variant={replyingToCommentId === comment.id ? 'contained' : 'outlined'}
                  color={comment.is_internal ? 'warning' : 'primary'}
                >
                  {replyingToCommentId === comment.id ? 'Replying...' : 'Reply'}
                </Button>
              </Box>
            )}
          </CardContent>

          {/* Reply form - show below this comment if replying to it */}
          {replyingToCommentId === comment.id && (
            <Box sx={{
              p: 3,
              bgcolor: comment.is_internal ? 'warning.lighter' : 'action.hover',
              border: comment.is_internal ? '2px solid' : '1px solid',
              borderColor: comment.is_internal ? 'warning.main' : 'divider'
            }}>
              <Typography variant="subtitle2" gutterBottom>
                Reply to {comment.username} {comment.is_internal && '(Internal)'}
              </Typography>
              {comment.is_internal && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This reply will be internal and only visible to agents and admins.
                </Alert>
              )}
              <Box component="form" onSubmit={handleAddComment}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  placeholder={comment.is_internal ? "Enter your internal reply..." : "Enter your reply..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />

                <Box sx={{ mb: 2 }}>
                  <Button variant="outlined" component="label" size="small">
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
                      {attachments.length} file(s) selected
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="small"
                    disabled={loading || !newComment.trim()}
                    color={comment.is_internal ? 'warning' : 'primary'}
                  >
                    {loading ? 'Sending...' : comment.is_internal ? 'Send Internal Reply' : 'Send Reply'}
                  </Button>
                  <Button variant="outlined" size="small" onClick={handleCancelReply}>
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </Card>
      ))}


      {/* Internal Note form - only for agents */}
      {showInternalNoteForm && (
        <Paper sx={{ p: 3, mt: 3, border: '2px solid', borderColor: 'warning.main' }}>
          <Typography variant="h6" gutterBottom color="warning.main">
            Add Internal Note
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This note will only be visible to agents and admins. Customers will not see it.
          </Alert>
          <Box component="form" onSubmit={handleAddComment}>
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="Enter internal note..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Button variant="outlined" component="label" size="small">
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
                  {attachments.length} file(s) selected
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button type="submit" variant="contained" color="warning" disabled={loading || !newComment.trim()}>
                {loading ? 'Adding...' : 'Add Internal Note'}
              </Button>
              <Button variant="outlined" onClick={handleCancelReply}>
                Cancel
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* General Add Comment form - show if not replying and not showing internal note form */}
      {!replyingToCommentId && !showInternalNoteForm && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Add Comment
            </Typography>
            {isAgent && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<NoteAdd />}
                onClick={handleInternalNoteClick}
                color="warning"
              >
                Add Internal Note Instead
              </Button>
            )}
          </Box>
          <Box component="form" onSubmit={handleAddComment}>
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="Enter your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Button variant="outlined" component="label" size="small">
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
                  {attachments.length} file(s) selected
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button type="submit" variant="contained" disabled={loading || !newComment.trim()}>
                {loading ? 'Adding...' : 'Add Comment'}
              </Button>
              {attachments.length > 0 && (
                <Button variant="outlined" onClick={() => setAttachments([])}>
                  Clear Files
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {previewAttachment?.original_filename}
            </Typography>
            <IconButton onClick={() => setPreviewOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {previewAttachment && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
              <img
                src={`/uploads/tickets/${previewAttachment.filename}`}
                alt={previewAttachment.original_filename}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<Download />}
            onClick={() => handleDownloadAttachment(previewAttachment)}
          >
            Download
          </Button>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Ticket Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Ticket</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete ticket #{ticket.ticket_number}? This action cannot be undone.
            All comments and attachments associated with this ticket will also be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteTicket} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default TicketDetail;
