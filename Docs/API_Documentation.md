# Studio Nexus - API Documentation
**Last Updated:** January 15, 2025  
**API Version:** v1  
**Base URL:** `https://api.studionexus.com/v1`

## Overview
Studio Nexus API provides RESTful endpoints for music creation, AI processing, and project management. All endpoints require authentication unless specified otherwise.

## Authentication

### Authentication Methods
- **Bearer Token**: Include JWT token in Authorization header
- **API Key**: For server-to-server communication (Pro+ plans)

```bash
# Bearer Token Authentication
curl -H "Authorization: Bearer <jwt_token>" \
     "https://api.studionexus.com/v1/projects"

# API Key Authentication  
curl -H "X-API-Key: <api_key>" \
     "https://api.studionexus.com/v1/projects"
```

### Authentication Endpoints

#### POST /auth/signup
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "musiccreator",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "musiccreator",
    "created_at": "2025-01-15T10:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "token_type": "bearer",
    "expires_in": 3600
  }
}
```

#### POST /auth/signin
Authenticate existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "musiccreator",
    "subscription_tier": "free"
  },
  "session": {
    "access_token": "jwt_token",
    "token_type": "bearer",
    "expires_in": 3600
  }
}
```

#### POST /auth/refresh
Refresh authentication token.

**Request Body:**
```json
{
  "refresh_token": "refresh_token_here"
}
```

**Response (200):**
```json
{
  "access_token": "new_jwt_token",
  "token_type": "bearer",
  "expires_in": 3600
}
```

## User Management

### User Profile Endpoints

#### GET /users/profile
Get current user's profile information.

**Response (200):**
```json
{
  "id": "uuid",
  "username": "musiccreator",
  "full_name": "John Doe",
  "avatar_url": "https://storage.com/avatar.jpg",
  "bio": "Music enthusiast and creator",
  "subscription_tier": "free",
  "total_projects": 5,
  "total_transformations": 12,
  "storage_used_mb": 45.6,
  "created_at": "2025-01-01T00:00:00Z"
}
```

#### PUT /users/profile
Update user profile.

**Request Body:**
```json
{
  "full_name": "John Smith",
  "bio": "Professional music producer",
  "website_url": "https://johnsmith.music"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "username": "musiccreator",
  "full_name": "John Smith",
  "bio": "Professional music producer",
  "website_url": "https://johnsmith.music",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

#### GET /users/{userId}
Get public profile of any user.

**Response (200):**
```json
{
  "id": "uuid",
  "username": "musiccreator",
  "full_name": "John Doe",
  "avatar_url": "https://storage.com/avatar.jpg",
  "bio": "Music enthusiast",
  "public_projects_count": 3,
  "followers_count": 150,
  "following_count": 89,
  "created_at": "2025-01-01T00:00:00Z"
}
```

## Project Management

### Project CRUD Operations

#### GET /projects
List user's projects with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `status` (string): Filter by status ('draft', 'processing', 'completed', 'archived')
- `genre` (string): Filter by genre  
- `search` (string): Search in title and description
- `sort` (string): Sort by ('created_at', 'updated_at', 'title', 'play_count')
- `order` (string): Sort order ('asc', 'desc')

**Response (200):**
```json
{
  "projects": [
    {
      "id": "uuid",
      "title": "My First Song",
      "description": "Experimenting with vocals",
      "genre": "pop",
      "tags": ["vocal", "experimental"],
      "status": "completed",
      "duration_seconds": 180.5,
      "play_count": 45,
      "like_count": 12,
      "is_public": false,
      "created_at": "2025-01-10T14:30:00Z",
      "updated_at": "2025-01-14T09:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1
  }
}
```

#### POST /projects
Create a new project.

**Request Body:**
```json
{
  "title": "New Song Idea",
  "description": "Working on a new track",
  "genre": "electronic",
  "tags": ["synth", "ambient"],
  "metronome_bpm": 128
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "title": "New Song Idea",
  "description": "Working on a new track",
  "genre": "electronic",
  "tags": ["synth", "ambient"],
  "status": "draft",
  "metronome_bpm": 128,
  "effects_settings": {},
  "created_at": "2025-01-15T10:45:00Z"
}
```

#### GET /projects/{projectId}
Get specific project details.

**Response (200):**
```json
{
  "id": "uuid",
  "title": "My First Song",
  "description": "Experimenting with vocals",
  "genre": "pop",
  "tags": ["vocal", "experimental"],
  "status": "completed",
  "original_audio_path": "/audio/user/project/original.wav",
  "processed_audio_path": "/audio/user/project/processed.mp3",
  "waveform_data": {...},
  "duration_seconds": 180.5,
  "sample_rate": 44100,
  "effects_settings": {...},
  "metronome_bpm": 120,
  "play_count": 45,
  "like_count": 12,
  "is_public": false,
  "created_at": "2025-01-10T14:30:00Z",
  "updated_at": "2025-01-14T09:15:00Z"
}
```

#### PUT /projects/{projectId}
Update project details.

**Request Body:**
```json
{
  "title": "Updated Song Title",
  "description": "Refined description",
  "genre": "indie-pop",
  "tags": ["vocal", "indie", "dreamy"],
  "is_public": true
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Updated Song Title",
  "description": "Refined description",
  "genre": "indie-pop",
  "tags": ["vocal", "indie", "dreamy"],
  "is_public": true,
  "updated_at": "2025-01-15T11:00:00Z"
}
```

#### DELETE /projects/{projectId}
Delete a project (soft delete).

**Response (204):** No content

## Audio Processing

### Recording Endpoints

#### POST /projects/{projectId}/audio/upload
Upload audio file to project.

**Request:** Multipart form data
- `audio` (file): Audio file (WAV, MP3, M4A)
- `type` (string): Audio type ('original', 'processed')

**Response (200):**
```json
{
  "audio_path": "/audio/user/project/recording.wav",
  "duration_seconds": 180.5,
  "sample_rate": 44100,
  "file_size_mb": 12.3,
  "waveform_data": {
    "peaks": [0.1, 0.3, 0.8, ...],
    "length": 1000
  }
}
```

#### GET /projects/{projectId}/audio/{type}
Get signed URL for audio playback.

**Path Parameters:**
- `type`: 'original', 'processed', or specific transformation ID

**Response (200):**
```json
{
  "audio_url": "https://storage.com/signed-url",
  "expires_at": "2025-01-15T12:00:00Z",
  "duration_seconds": 180.5
}
```

### Effects Processing

#### POST /projects/{projectId}/effects/apply
Apply real-time effects to audio.

**Request Body:**
```json
{
  "effects_chain": [
    {
      "type": "reverb",
      "parameters": {
        "room_size": 0.5,
        "damping": 0.3,
        "wet_level": 0.4
      }
    },
    {
      "type": "delay",
      "parameters": {
        "delay_time": 0.3,
        "feedback": 0.25,
        "wet_level": 0.3
      }
    }
  ]
}
```

**Response (200):**
```json
{
  "processed_audio_path": "/audio/user/project/with-effects.wav",
  "effects_applied": 2,
  "processing_time_ms": 1200
}
```

#### GET /effects/presets
Get available effects presets.

**Query Parameters:**
- `category` (string): Filter by category ('vocal', 'instrument', 'ambient')
- `user_only` (boolean): Show only user's custom presets

**Response (200):**
```json
{
  "presets": [
    {
      "id": "uuid",
      "name": "Vocal Warmth",
      "description": "Warm, professional vocal sound",
      "category": "vocal",
      "effects_chain": [...],
      "is_system_preset": true,
      "usage_count": 1250,
      "rating_average": 4.6
    }
  ]
}
```

## AI Music Generation

### Transformation Endpoints

#### POST /projects/{projectId}/ai/transform
Request AI music transformation.

**Request Body:**
```json
{
  "transformation_type": "orchestral",
  "parameters": {
    "style": "classical",
    "tempo": "moderate",
    "instruments": ["strings", "brass", "woodwinds"],
    "quality": "high"
  }
}
```

**Response (202):** Accepted
```json
{
  "transformation_id": "uuid",
  "status": "pending",
  "estimated_completion": "2025-01-15T11:15:00Z",
  "queue_position": 3
}
```

#### GET /projects/{projectId}/ai/transformations
List AI transformations for project.

**Response (200):**
```json
{
  "transformations": [
    {
      "id": "uuid",
      "transformation_type": "orchestral",
      "status": "completed",
      "output_audio_path": "/audio/user/project/ai-orchestral.wav",
      "quality_score": 0.85,
      "user_rating": 4,
      "processing_time_seconds": 45,
      "created_at": "2025-01-15T10:30:00Z",
      "completed_at": "2025-01-15T10:31:15Z"
    }
  ]
}
```

#### GET /ai/transformations/{transformationId}
Get specific transformation details and status.

**Response (200):**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "transformation_type": "electronic",
  "status": "processing",
  "progress_percentage": 65,
  "estimated_completion": "2025-01-15T11:02:00Z",
  "parameters": {...},
  "created_at": "2025-01-15T10:30:00Z"
}
```

#### POST /ai/transformations/{transformationId}/rating
Rate transformation result.

**Request Body:**
```json
{
  "rating": 4,
  "feedback": "Great orchestral arrangement, loved the string section!"
}
```

**Response (200):**
```json
{
  "transformation_id": "uuid",
  "user_rating": 4,
  "feedback_recorded": true
}
```

### AI Model Presets

#### GET /ai/presets
Get available AI transformation presets.

**Query Parameters:**
- `type` (string): Filter by transformation type
- `premium_only` (boolean): Show only premium presets

**Response (200):**
```json
{
  "presets": [
    {
      "id": "uuid",
      "name": "Classical Orchestra",
      "description": "Full orchestral arrangement with strings, brass, and woodwinds",
      "transformation_type": "orchestral",
      "parameters": {...},
      "preview_audio_url": "https://storage.com/preview.mp3",
      "is_premium": false,
      "usage_count": 5420
    }
  ]
}
```

## Export System

### Export Endpoints

#### POST /projects/{projectId}/export
Export project audio with specified format and quality.

**Request Body:**
```json
{
  "format": "mp3",
  "quality": "high",
  "audio_source": "processed",
  "include_metadata": true,
  "normalization": true
}
```

**Response (202):** Accepted
```json
{
  "export_id": "uuid",
  "status": "processing",
  "estimated_completion": "2025-01-15T11:05:00Z"
}
```

#### GET /exports/{exportId}
Get export status and download link.

**Response (200):**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "status": "completed",
  "format": "mp3",
  "quality": "high",
  "file_size_mb": 8.7,
  "download_url": "https://storage.com/exports/signed-url",
  "expires_at": "2025-01-16T11:00:00Z",
  "created_at": "2025-01-15T10:45:00Z",
  "completed_at": "2025-01-15T10:46:30Z"
}
```

#### GET /projects/{projectId}/exports
List all exports for a project.

**Response (200):**
```json
{
  "exports": [
    {
      "id": "uuid",
      "format": "mp3",
      "quality": "high",
      "status": "completed",
      "file_size_mb": 8.7,
      "created_at": "2025-01-15T10:45:00Z"
    }
  ]
}
```

## Usage & Subscription Management

### Usage Tracking

#### GET /users/usage
Get current user's resource usage.

**Query Parameters:**
- `period` (string): Time period ('current_month', 'last_month', 'all_time')

**Response (200):**
```json
{
  "subscription_tier": "free",
  "billing_period": "2025-01",
  "usage": {
    "ai_transformations": {
      "used": 3,
      "limit": 5,
      "unit": "count"
    },
    "exports": {
      "used": 7,
      "limit": 10,
      "unit": "count"
    },
    "storage_mb": {
      "used": 45.6,
      "limit": 100,
      "unit": "mb"
    },
    "projects": {
      "used": 2,
      "limit": 3,
      "unit": "count"
    }
  }
}
```

#### GET /subscription/limits
Get subscription tier limits and features.

**Response (200):**
```json
{
  "tiers": {
    "free": {
      "price": 0,
      "limits": {
        "ai_transformations": 5,
        "exports": 10,
        "storage_mb": 100,
        "projects": 3
      },
      "features": [
        "Basic audio recording",
        "Standard effects",
        "AI transformations (5/month)",
        "MP3 export"
      ]
    },
    "pro": {
      "price": 9.99,
      "limits": {
        "ai_transformations": 50,
        "exports": -1,
        "storage_mb": 1000,
        "projects": -1
      },
      "features": [
        "Everything in Free",
        "Premium effects presets",
        "High-quality AI transformations",
        "WAV/FLAC export",
        "Priority processing",
        "No watermarks"
      ]
    }
  }
}
```

## Social Features

### Project Interactions

#### POST /projects/{projectId}/like
Like/unlike a project.

**Request Body:**
```json
{
  "action": "like"
}
```

**Response (200):**
```json
{
  "project_id": "uuid",
  "liked": true,
  "total_likes": 13
}
```

#### GET /projects/public
Browse public projects.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `genre` (string): Filter by genre
- `sort` (string): Sort by ('popular', 'recent', 'trending')

**Response (200):**
```json
{
  "projects": [
    {
      "id": "uuid",
      "title": "Ambient Dreams",
      "description": "Relaxing ambient soundscape",
      "genre": "ambient",
      "user": {
        "username": "musiccreator",
        "avatar_url": "https://storage.com/avatar.jpg"
      },
      "play_count": 245,
      "like_count": 18,
      "created_at": "2025-01-10T14:30:00Z"
    }
  ],
  "pagination": {...}
}
```

## WebSocket API

### Real-time Updates

Connect to WebSocket for real-time updates:
```javascript
const ws = new WebSocket('wss://api.studionexus.com/v1/ws');

// Authentication
ws.send(JSON.stringify({
  type: 'auth',
  token: 'jwt_token'
}));

// Subscribe to project updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'project:uuid'
}));
```

### WebSocket Events

**AI Processing Updates:**
```json
{
  "type": "ai_transformation_update",
  "transformation_id": "uuid",
  "status": "processing",
  "progress_percentage": 75
}
```

**Export Status Updates:**
```json
{
  "type": "export_update",
  "export_id": "uuid",
  "status": "completed",
  "download_url": "https://storage.com/signed-url"
}
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "issue": "Email format is invalid"
    },
    "request_id": "req_123456789"
  }
}
```

### Error Codes
- `400` - Bad Request
  - `VALIDATION_ERROR` - Invalid input parameters
  - `MISSING_REQUIRED_FIELD` - Required field not provided
- `401` - Unauthorized
  - `INVALID_TOKEN` - JWT token invalid or expired
  - `MISSING_AUTHENTICATION` - No authentication provided
- `403` - Forbidden
  - `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
  - `SUBSCRIPTION_REQUIRED` - Feature requires subscription upgrade
  - `USAGE_LIMIT_EXCEEDED` - Monthly usage limit reached
- `404` - Not Found
  - `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `429` - Too Many Requests
  - `RATE_LIMIT_EXCEEDED` - API rate limit exceeded
- `500` - Internal Server Error
  - `PROCESSING_ERROR` - Audio/AI processing failed
  - `EXTERNAL_SERVICE_ERROR` - Third-party service unavailable

## Rate Limits

### Standard Rate Limits
- **Free Tier**: 100 requests/hour
- **Pro Tier**: 1000 requests/hour
- **Enterprise**: Custom limits

### Special Endpoints
- **AI Transformations**: 5 requests/hour (Free), 50 requests/hour (Pro)
- **File Uploads**: 20 requests/hour (Free), 100 requests/hour (Pro)
- **Exports**: 10 requests/hour (Free), Unlimited (Pro)

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

## SDKs and Integration

### JavaScript SDK Example
```javascript
import StudioNexus from '@studionexus/sdk';

const client = new StudioNexus({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.studionexus.com/v1'
});

// Create project
const project = await client.projects.create({
  title: 'My New Song',
  genre: 'electronic'
});

// Transform with AI
const transformation = await client.ai.transform(project.id, {
  type: 'orchestral',
  style: 'classical'
});
```

This API documentation provides comprehensive coverage of all Studio Nexus endpoints, enabling developers to integrate with the platform effectively.