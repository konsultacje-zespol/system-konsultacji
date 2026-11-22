import swaggerJSDoc from 'swagger-jsdoc';

// General information only. Endpoints are NOT described here — every endpoint has its own
// @openapi comment directly above its route in a *.routes.js file (see health.routes.js).
const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Konsultacje API',
    version: '0.1.0',
    description: 'API systemu zapisów na konsultacje. Logowanie: ciasteczko access_token.',
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'access_token' },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['statusCode', 'code', 'message'],
        properties: {
          statusCode: { type: 'integer', example: 409 },
          code: { type: 'string', example: 'SLOT_FULL' },
          message: { type: 'string', example: 'Slot is full' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'topic' },
                message: { type: 'string', example: 'String must contain at least 3 character(s)' },
              },
            },
          },
        },
      },
    },
  },
  // By default every endpoint requires login; public routes set "security: []" in their comment
  security: [{ cookieAuth: [] }],
};

export const openapiSpec = swaggerJSDoc({
  definition,
  apis: ['./src/**/*.routes.js'],
  failOnErrors: true,
});
