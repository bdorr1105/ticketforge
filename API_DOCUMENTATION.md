# TicketForge API Documentation

Base URL: `http://localhost:5000/api`

All endpoints (except `/auth/login`) require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Authentication

### POST /auth/login
Login with username or email.

**Request Body:**
```json
{
  "login": "admin",  // username or email
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@ticketforge.local",
    "role": "admin",
    "firstName": "System",
    "lastName": "Administrator"
  }
}
```

### GET /auth/me
Get current user information.

**Response:**
```json
{
  "id": "uuid",
  "username": "admin",
  "email": "admin@ticketforge.local",
  "role": "admin",
  "firstName": "System",
  "lastName": "Administrator"
}
```

### POST /auth/change-password
Change current user's password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

## Users

### GET /users
Get all users (Admin only).

**Response:**
```json
[
  {
    "id": "uuid",
    "username": "admin",
    "email": "admin@ticketforge.local",
    "first_name": "System",
    "last_name": "Administrator",
    "role": "admin",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### GET /users/:id
Get user by ID (Admin or self).

### POST /users
Create new user (Admin only).

**Request Body:**
```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "agent"  // admin, agent, or customer
}
```

### PUT /users/:id
Update user (Admin only).

**Request Body:**
```json
{
  "username": "john",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "agent",
  "isActive": true
}
```

### DELETE /users/:id
Delete user (Admin only).

## Tickets

### GET /tickets
Get all tickets with optional filters.

**Query Parameters:**
- `status` - Filter by status (open, in_progress, pending, resolved, closed)
- `priority` - Filter by priority (low, medium, high, urgent)
- `assignedTo` - Filter by assigned user ID
- `customerId` - Filter by customer ID
- `groupId` - Filter by group ID

**Response:**
```json
[
  {
    "id": "uuid",
    "ticket_number": 1,
    "subject": "Login issue",
    "description": "Cannot log in to the system",
    "status": "open",
    "priority": "high",
    "customer_id": "uuid",
    "customer_username": "john",
    "assigned_to": "uuid",
    "assigned_username": "admin",
    "group_id": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "comment_count": 3
  }
]
```

### GET /tickets/:id
Get ticket by ID with attachments.

### POST /tickets
Create new ticket.

**Request Body (multipart/form-data):**
```
subject: "Login issue"
description: "Cannot log in to the system"
priority: "high"
attachments: [File, File]  // Optional
```

### PUT /tickets/:id
Update ticket.

**Request Body:**
```json
{
  "subject": "Updated subject",
  "description": "Updated description",
  "status": "in_progress",
  "priority": "urgent",
  "assignedTo": "uuid",
  "groupId": "uuid"
}
```

Note: Customers can only update subject and description on their own tickets.

### DELETE /tickets/:id
Delete ticket (Admin only).

## Comments

### GET /comments/ticket/:ticketId
Get all comments for a ticket.

**Response:**
```json
[
  {
    "id": "uuid",
    "ticket_id": "uuid",
    "user_id": "uuid",
    "username": "admin",
    "role": "admin",
    "content": "This is a comment",
    "is_internal": false,
    "created_at": "2024-01-01T00:00:00Z",
    "attachments": [
      {
        "id": "uuid",
        "filename": "screenshot.png",
        "original_filename": "screenshot.png",
        "mime_type": "image/png",
        "file_size": 12345
      }
    ]
  }
]
```

Note: Customers cannot see comments where `is_internal` is true.

### POST /comments
Add comment to ticket.

**Request Body (multipart/form-data):**
```
ticketId: "uuid"
content: "This is my comment"
isInternal: "true"  // Optional, only for agents/admins
attachments: [File, File]  // Optional
```

### PUT /comments/:id
Update comment (Owner or Admin only).

**Request Body:**
```json
{
  "content": "Updated comment text"
}
```

### DELETE /comments/:id
Delete comment (Owner or Admin only).

## Groups

### GET /groups
Get all groups.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Technical Support",
    "description": "Main technical support team",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### GET /groups/:id
Get group by ID with members.

**Response:**
```json
{
  "id": "uuid",
  "name": "Technical Support",
  "description": "Main technical support team",
  "created_at": "2024-01-01T00:00:00Z",
  "members": [
    {
      "id": "uuid",
      "username": "agent1",
      "email": "agent1@example.com",
      "role": "agent"
    }
  ]
}
```

### POST /groups
Create group (Admin only).

**Request Body:**
```json
{
  "name": "Support Team",
  "description": "Customer support team"
}
```

### PUT /groups/:id
Update group (Admin only).

### DELETE /groups/:id
Delete group (Admin only).

### POST /groups/:id/members
Add user to group (Admin only).

**Request Body:**
```json
{
  "userId": "uuid"
}
```

### DELETE /groups/:id/members/:userId
Remove user from group (Admin only).

## Settings

### GET /settings
Get all settings (Admin only).

**Response:**
```json
{
  "site_name": {
    "value": "TicketForge",
    "description": "Application name",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "tickets_per_page": {
    "value": "25",
    "description": "Number of tickets to display per page",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### GET /settings/:key
Get specific setting (Admin only).

### PUT /settings/:key
Update or create setting (Admin only).

**Request Body:**
```json
{
  "value": "50",
  "description": "Updated description"
}
```

### DELETE /settings/:key
Delete setting (Admin only).

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse. If you exceed the rate limit, you'll receive a `429 Too Many Requests` response.

## File Uploads

File uploads use multipart/form-data encoding. Supported file types:
- Images: JPEG, PNG, GIF
- Documents: PDF, DOC, DOCX

Maximum file size: 10MB (configurable via environment variable)

## WebSocket Support

Currently not implemented. Future versions may include WebSocket support for real-time notifications.
