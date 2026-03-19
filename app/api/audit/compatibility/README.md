# Compatibility Testing API Endpoints

This directory contains API endpoints for testing browser and device compatibility with AI detection systems.

## Endpoints

### POST /api/audit/compatibility/test
Tests AI system compatibility for a specific browser and version.

**Request Body:**
```json
{
  "browser": "Chrome",
  "browserVersion": "120.0",
  "platform": "Windows",
  "systemIds": ["face-detection", "voice-activity"] // optional
}
```

**Response:**
```json
{
  "executionId": "compat-1234567890-abc123",
  "browser": "chrome",
  "browserVersion": "120.0",
  "systemCompatibility": [...],
  "overallCompatibility": 95,
  "supportedSystems": 18,
  "partialSystems": 2,
  "unsupportedSystems": 0
}
```

### GET /api/audit/compatibility/matrix
Returns complete compatibility matrix for all browsers with recommendations.

**Query Parameters:**
- `includeRecommendations` (boolean, default: true) - Include compatibility recommendations

**Response:**
```json
{
  "compatibilityMatrix": {
    "browsers": [...],
    "recommendedConfiguration": {...}
  },
  "recommendations": [...],
  "lastUpdated": "2024-01-15T10:30:00Z",
  "totalSystems": 29,
  "testedBrowsers": 4
}
```

## Browser Support

- **Chrome 88+**: Full support for all AI systems
- **Edge 88+**: Full support for all AI systems  
- **Firefox 85+**: Limited Web Speech API support
- **Safari 14+**: Limited Web Speech and screen capture support

## Testing

Run compatibility tests with:
```bash
npm test -- tests/audit/compatibility-api-endpoints.test.ts
```