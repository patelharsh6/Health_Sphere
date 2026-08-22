const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const { PORT, NODE_ENV } = require('./env');

/**
 * OpenAPI spec for /api/docs.
 *
 * Route-level detail is read from the `@openapi` JSDoc blocks in
 * src/routes/*.js, so the docs live next to the routes they describe and
 * cannot drift into a separate hand-maintained file.
 */
const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'HealthSphere API',
      version: '1.0.0',
      description:
        'Backend API for HealthSphere — patients, doctors, appointments, ' +
        'medical reports with automated lab-value extraction, a disease and ' +
        'medicine catalog, and an AI assistant.\n\n' +
        'All responses use the envelope `{ success, message?, data, count?, page?, pages? }`.\n\n' +
        '**401 vs 403:** the web client signs the user out on any 401, so ' +
        'permission failures return 403 instead.',
    },
    servers: [{ url: `http://localhost:${PORT}/api`, description: NODE_ENV }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Resource not found.' },
            errors: {
              type: 'object',
              additionalProperties: { type: 'string' },
              description: 'Field-level validation errors, when applicable.',
            },
          },
        },
        Paginated: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            count: { type: 'integer', description: 'Total matching documents.', example: 42 },
            page: { type: 'integer', example: 1 },
            pages: { type: 'integer', example: 5 },
            data: { type: 'array', items: { type: 'object' } },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Validation failed.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        Unauthorized: {
          description: 'Missing, invalid, or expired token.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        Forbidden: {
          description: 'Authenticated, but not permitted.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        NotFound: {
          description: 'No such resource.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Registration, login, password and avatar.' },
      { name: 'Patients', description: 'Patient profile and dashboard.' },
      { name: 'Doctors', description: 'Directory, schedule, and a doctor\'s own patients.' },
      { name: 'Appointments', description: 'Booking lifecycle.' },
      { name: 'Reports', description: 'Upload and automated analysis of lab reports.' },
      { name: 'Catalog', description: 'Diseases, medicines, and the symptom checker.' },
      { name: 'AI', description: 'Assistant chat sessions.' },
      { name: 'Admin', description: 'Platform operations. Admin role only.' },
    ],
  },
  // glob needs forward slashes. path.resolve returns backslashes on Windows,
  // which silently matches nothing — the spec builds with zero operations and
  // no error at all.
  apis: [path.join(__dirname, '..', 'routes', '*.js').split(path.sep).join('/')],
};

module.exports = swaggerJsdoc(options);
