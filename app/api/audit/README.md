# Audit API Endpoints

This directory contains the API endpoints for the AI Capabilities Audit and Enhancement system.

## Endpoints

### POST /api/audit/execute
Triggers a new audit execution with configurable options.

**Request Body:**
```json
{
  "options": {
    "categories": ["vision", "audio", "behavioral", "system"],
    "includePerformance": true,
    "includeFalsePositiveAnalysis": true,
    "includeEnhancementRecommendations": true,
    "concurrency": 4
  }
}
```

**Response (201):**
```json
{
  "executionId": "audit-1710123456789-abc123def",
  "status": "started",
  "estimatedDuration": 120,
  "message": "Audit execution started successfully"
}
```

**Validation:**
- `categories`: Must be valid AI categories (vision, audio, behavioral, system)
- `concurrency`: Must be between 1 and 10
- All options are optional with sensible defaults

### GET /api/audit/status/:executionId
Returns the current status and progress of an audit execution.

**Response (200):**
```json
{
  "executionId": "audit-1710123456789-abc123def",
  "status": {
    "isRunning": true,
    "currentPhase": "executing",
    "progress": 45,
    "startTime": "2024-03-14T10:30:00.000Z",
    "estimatedCompletion": "2024-03-14T10:32:00.000Z"
  },
  "auditOptions": {
    "categories": ["vision", "audio"],
    "includePerformance": true
  },
  "triggeredBy": "api",
  "partialResults": { /* partial results if available */ }
}
```

**Error Responses:**
- `400`: Missing execution ID
- `404`: Audit execution not found

### GET /api/audit/results/:executionId
Returns complete audit results for a finished execution.

**Query Parameters:**
- `format`: `json` (default) or `summary`
- `includeDetails`: `true` (default) or `false`
- `category`: Filter results by specific category

**Response (200):**
```json
{
  "executionId": "audit-1710123456789-abc123def",
  "results": {
    "executionId": "audit-1710123456789-abc123def",
    "timestamp": "2024-03-14T10:32:00.000Z",
    "duration": 120,
    "overallStatus": "pass",
    "categoryResults": [
      {
        "category": "vision",
        "status": "pass",
        "totalSystems": 11,
        "systemsPassed": 10,
        "systemsFailed": 1,
        "systemsWarning": 0,
        "systemResults": [/* detailed system results */]
      }
    ],
    "summary": {
      "totalSystems": 29,
      "systemsPassed": 25,
      "systemsFailed": 2,
      "systemsWarning": 2,
      "passRate": 86.2,
      "criticalIssues": ["Face detection system failed validation"],
      "recommendations": ["Update MediaPipe version"]
    }
  },
  "metadata": {
    "retrievedAt": "2024-03-14T10:35:00.000Z",
    "auditOptions": { /* original audit options */ },
    "triggeredBy": "api",
    "environment": { /* environment info */ }
  }
}
```

**Error Responses:**
- `202`: Audit still running (use status endpoint)
- `400`: Invalid parameters
- `404`: Audit execution not found
- `500`: Audit execution failed

### GET /api/audit/history
Returns paginated list of past audit executions with optional filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 10, max: 50)
- `status`: Filter by status (`running`, `completed`, `failed`)
- `triggeredBy`: Filter by trigger source
- `startDate`: Filter by start date (ISO 8601)
- `endDate`: Filter by end date (ISO 8601)
- `includeStats`: Include system statistics (`true`/`false`)

**Response (200):**
```json
{
  "executions": [
    {
      "executionId": "audit-1710123456789-abc123def",
      "startTime": "2024-03-14T10:30:00.000Z",
      "endTime": "2024-03-14T10:32:00.000Z",
      "status": "completed",
      "duration": 120,
      "triggeredBy": "api",
      "auditOptions": { /* audit configuration */ },
      "summary": {
        "totalSystems": 29,
        "systemsPassed": 25,
        "systemsFailed": 2,
        "systemsWarning": 2,
        "passRate": 86.2,
        "overallStatus": "pass"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrevious": false
  },
  "filters": {
    "status": "completed",
    "triggeredBy": null,
    "startDate": null,
    "endDate": null
  },
  "statistics": {
    "totalExecutions": 25,
    "completedExecutions": 20,
    "failedExecutions": 3,
    "runningExecutions": 2,
    "totalSystems": 29,
    "systemsByCategory": {
      "vision": 11,
      "audio": 4,
      "behavioral": 4,
      "system": 10
    },
    "averagePassRate": 85.5
  }
}
```

**Error Responses:**
- `400`: Invalid query parameters

### GET /api/audit/enhancements
Returns prioritized enhancement recommendations and roadmap.

**Query Parameters:**
- `category`: Filter by AI category (`vision`, `audio`, `behavioral`, `system`)
- `status`: Filter by enhancement status (`proposed`, `approved`, `in_progress`, `completed`, `rejected`)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "enhancements": [
      {
        "id": "emotion-detection",
        "name": "Emotion Detection",
        "category": "vision",
        "description": "Add real-time emotion detection using facial expressions",
        "implementationEffort": "medium",
        "demonstrationValue": "high",
        "requiredLibraries": ["face-api.js", "@tensorflow/tfjs"],
        "estimatedHours": 24,
        "prerequisites": ["MediaPipe FaceMesh integration"],
        "priority": 8,
        "priorityRationale": "High demonstration value with moderate effort"
      }
    ],
    "roadmap": {
      "phases": [
        {
          "phaseName": "Phase 1: Core Enhancements",
          "enhancements": [/* prioritized enhancements */],
          "estimatedDuration": "2-3 weeks",
          "dependencies": []
        }
      ],
      "totalEstimatedHours": 120,
      "recommendedSequence": ["emotion-detection", "pose-estimation"]
    },
    "metadata": {
      "totalEnhancements": 8,
      "categories": ["vision", "audio", "behavioral"],
      "totalEstimatedHours": 120,
      "generatedAt": "2024-03-14T10:35:00.000Z"
    }
  }
}
```

**Requirements:** 6.7, 13.8

### GET /api/audit/enhancements/:enhancementId/guide
Returns detailed implementation guide for a specific enhancement.

**Path Parameters:**
- `enhancementId`: ID of the enhancement

**Response (200):**
```json
{
  "success": true,
  "data": {
    "guide": {
      "enhancementId": "emotion-detection",
      "enhancementName": "Emotion Detection",
      "overview": "Implement real-time emotion detection using facial expressions...",
      "technicalApproach": "Use face-api.js with pre-trained emotion models...",
      "requiredDependencies": [
        {
          "name": "face-api.js",
          "version": "^0.22.2",
          "purpose": "Facial emotion recognition",
          "installCommand": "npm install face-api.js"
        }
      ],
      "codeExamples": [
        {
          "title": "Initialize Emotion Detection",
          "description": "Set up face-api.js for emotion detection",
          "language": "typescript",
          "code": "import * as faceapi from 'face-api.js';\n\n// Load models\nawait faceapi.nets.tinyFaceDetector.loadFromUri('/models');"
        }
      ],
      "integrationPoints": [
        {
          "component": "CameraFeed",
          "modificationType": "modify_existing",
          "description": "Add emotion detection to existing camera feed component"
        }
      ],
      "testingStrategy": "Unit tests for emotion detection accuracy, integration tests with camera feed",
      "estimatedTimeline": "1-2 weeks"
    },
    "metadata": {
      "enhancementId": "emotion-detection",
      "generatedAt": "2024-03-14T10:35:00.000Z",
      "totalDependencies": 2,
      "totalCodeExamples": 3,
      "totalIntegrationPoints": 2
    }
  }
}
```

**Error Responses:**
- `400`: Missing enhancement ID
- `404`: Enhancement not found

**Requirements:** 6.8, 20.7, 20.8, 20.9

### POST /api/audit/enhancements/:enhancementId/status
Updates the status of a specific enhancement recommendation.

**Path Parameters:**
- `enhancementId`: ID of the enhancement

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Approved for Phase 1 implementation"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "enhancementId": "emotion-detection",
    "previousStatus": "proposed",
    "newStatus": "approved",
    "updatedAt": "2024-03-14T10:35:00.000Z",
    "notes": "Approved for Phase 1 implementation"
  },
  "message": "Enhancement status updated to 'approved'"
}
```

**Valid Status Values:**
- `proposed`: Initial recommendation
- `approved`: Approved for implementation
- `in_progress`: Currently being implemented
- `completed`: Implementation finished
- `rejected`: Not approved for implementation

**Error Responses:**
- `400`: Missing enhancement ID or invalid status
- `404`: Enhancement not found

**Requirements:** 6.7, 13.8

## Implementation Details

### Architecture
- **Next.js 16 App Router**: Uses the new app directory structure
- **TypeScript**: Full type safety with interfaces from `lib/audit/types.ts`
- **Database Integration**: Uses MongoDB models and operations from `lib/audit/db-operations.ts`
- **Error Handling**: Consistent error responses using `lib/apiUtils.ts`

### Key Features
- **Asynchronous Execution**: Audit runs in background, status tracked via database
- **Progress Tracking**: Real-time progress estimation for running audits
- **Flexible Filtering**: Multiple query parameters for history endpoint
- **Response Formats**: Support for different response formats (full, summary)
- **Validation**: Input validation with helpful error messages
- **Pagination**: Efficient pagination for large result sets

### Database Models
The endpoints integrate with these MongoDB models:
- `AuditExecutionRecord`: Main audit execution tracking
- `SystemValidationRecord`: Individual system validation results
- `PerformanceBenchmarkRecord`: Performance metrics
- `EnhancementRecommendationRecord`: Enhancement suggestions
- `CompatibilityTestRecord`: Browser/device compatibility

### Testing
- **Unit Tests**: `tests/audit/api-endpoints.test.ts` - Tests individual endpoint logic
- **Integration Tests**: `tests/audit/api-integration.test.ts` - Tests full workflow with mocked database

### Usage Examples

#### Start a basic audit
```bash
curl -X POST http://localhost:3000/api/audit/execute \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Start a custom audit
```bash
curl -X POST http://localhost:3000/api/audit/execute \
  -H "Content-Type: application/json" \
  -d '{
    "options": {
      "categories": ["vision", "audio"],
      "includePerformance": false,
      "concurrency": 2
    }
  }'
```

#### Check audit status
```bash
curl http://localhost:3000/api/audit/status/audit-1710123456789-abc123def
```

#### Get audit results
```bash
curl http://localhost:3000/api/audit/results/audit-1710123456789-abc123def
```

#### Get audit history
```bash
curl "http://localhost:3000/api/audit/history?page=1&pageSize=5&status=completed&includeStats=true"
```

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **Requirement 13.1**: API endpoint validation for all audit operations
- **Requirement 13.9**: Real-time audit status and progress tracking
- **Requirement 13.10**: Comprehensive audit result retrieval with filtering options

The endpoints provide a complete API interface for the audit system, enabling:
- Programmatic audit execution
- Real-time monitoring of audit progress
- Comprehensive result analysis and reporting
- Historical audit data management