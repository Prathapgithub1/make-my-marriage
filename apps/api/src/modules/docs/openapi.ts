export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Make My Marriage API',
    version: '1.0.0',
    description:
      'Version 1 REST API. For browser-based auth testing, first call GET /auth/csrf. The Swagger page reads the readable CSRF cookie and adds X-CSRF-Token to subsequent write requests. Keep the Swagger page and API on the same origin so session and CSRF cookies are sent automatically.',
  },
  servers: [{ url: '/api/v1', description: 'This API server' }],
  tags: [
    { name: 'Health', description: 'Service and database status' },
    { name: 'Authentication', description: 'Email and password authentication' },
  ],
  components: {
    securitySchemes: {
      csrfToken: {
        type: 'apiKey',
        in: 'header',
        name: 'X-CSRF-Token',
        description:
          'Call GET /auth/csrf first. Swagger UI reads the matching CSRF cookie and supplies this header for write requests.',
      },
      sessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'mmm_session',
        description:
          'Set automatically by signup or login. It is HTTP-only and is sent by the browser when Swagger UI is served by this API origin.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error', 'requestId'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Check your request and try again.' },
            },
          },
          requestId: { type: 'string', format: 'uuid' },
        },
      },
      User: {
        type: 'object',
        required: ['id', 'email'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string', nullable: true },
        },
      },
      AuthResult: {
        type: 'object',
        required: ['data', 'requestId'],
        properties: {
          data: {
            type: 'object',
            required: ['user', 'hasWedding'],
            properties: {
              user: { $ref: '#/components/schemas/User' },
              hasWedding: { type: 'boolean', example: false },
            },
          },
          requestId: { type: 'string', format: 'uuid' },
        },
      },
      EmailRequest: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email', maxLength: 320 } },
      },
      SignupRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 120 },
          email: { type: 'string', format: 'email', maxLength: 320 },
          password: { type: 'string', minLength: 12, maxLength: 128, format: 'password' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', maxLength: 320 },
          password: { type: 'string', minLength: 1, maxLength: 128, format: 'password' },
        },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token: { type: 'string', minLength: 20, maxLength: 256 },
          newPassword: { type: 'string', minLength: 12, maxLength: 128, format: 'password' },
        },
      },
      SuccessResponse: {
        type: 'object',
        required: ['data', 'requestId'],
        properties: {
          data: { type: 'object', properties: { success: { type: 'boolean', example: true } } },
          requestId: { type: 'string', format: 'uuid' },
        },
      },
      RequestIdResponse: {
        type: 'object',
        required: ['requestId'],
        properties: { requestId: { type: 'string', format: 'uuid' } },
      },
    },
    responses: {
      BadRequest: {
        description: 'Request body failed validation',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: { code: 'VALIDATION_ERROR', message: 'Check your request and try again.' },
              requestId: '8f9b7f19-2d67-4f15-aefc-98b84b60a0cb',
            },
          },
        },
      },
      CsrfRejected: {
        description: 'Origin or CSRF token could not be verified',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: { code: 'CSRF_REJECTED', message: 'Refresh the page and try again.' },
              requestId: '8f9b7f19-2d67-4f15-aefc-98b84b60a0cb',
            },
          },
        },
      },
      RateLimited: {
        description: 'Too many requests in the current time window',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: {
                code: 'RATE_LIMITED',
                message: 'Too many requests. Please try again later.',
              },
              requestId: '8f9b7f19-2d67-4f15-aefc-98b84b60a0cb',
            },
          },
        },
      },
      ServiceUnavailable: {
        description: 'A required server configuration, database, or service is unavailable',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: {
                code: 'DATABASE_UNAVAILABLE',
                message: 'A required service is unavailable.',
              },
              requestId: '8f9b7f19-2d67-4f15-aefc-98b84b60a0cb',
            },
          },
        },
      },
      InternalError: {
        description: 'Unexpected server error. Use requestId when reporting this failure.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
              requestId: '8f9b7f19-2d67-4f15-aefc-98b84b60a0cb',
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API process health',
        responses: {
          '200': {
            description: 'API process is responding',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: { status: { type: 'string', example: 'ok' } },
                    },
                    requestId: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health/database': {
      get: {
        tags: ['Health'],
        summary: 'Check PostgreSQL connectivity',
        responses: {
          '200': {
            description: 'Database is reachable',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'ok' },
                        database: { type: 'string', example: 'connected' },
                      },
                    },
                    requestId: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
    },
    '/auth/csrf': {
      get: {
        tags: ['Authentication'],
        summary: 'Create a CSRF token and cookie',
        description:
          'Call this before signup, login, logout, forgot password, or reset password. The response returns data.csrfToken and sets the matching mmm_csrf cookie; Swagger UI uses that cookie for subsequent write requests.',
        responses: {
          '200': {
            description: 'CSRF token created',
            headers: {
              'Set-Cookie': { schema: { type: 'string' }, description: 'Sets the CSRF cookie.' },
            },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        csrfToken: { type: 'string', description: 'Sensitive request token.' },
                      },
                    },
                  },
                },
              },
            },
          },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
    },
    '/auth/signup': {
      post: {
        tags: ['Authentication'],
        summary: 'Create an account and sign in',
        description:
          'Creates a real account and sets an HTTP-only session cookie. Use a unique example.test email and a disposable test password; this operation persists a user in the configured database. Duplicate emails return a conflict.',
        security: [{ csrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SignupRequest' },
              example: {
                name: 'Alex Morgan',
                email: 'alex.morgan@example.test',
                password: 'DemoOnlyPass123!',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Account created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResult' },
                example: {
                  data: {
                    user: {
                      id: '9f0b2dd6-cdc5-46f9-8b1c-50cc0d7d5d86',
                      email: 'alex.morgan@example.test',
                      name: 'Alex Morgan',
                    },
                    hasWedding: false,
                  },
                  requestId: '8f9b7f19-2d67-4f15-aefc-98b84b60a0cb',
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '403': { $ref: '#/components/responses/CsrfRejected' },
          '409': {
            description: 'Email already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: {
                  error: {
                    code: 'EMAIL_ALREADY_EXISTS',
                    message: 'An account with this email already exists.',
                  },
                  requestId: '8f9b7f19-2d67-4f15-aefc-98b84b60a0cb',
                },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimited' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Sign in (login) with email and password',
        description: 'Sets the HTTP-only session cookie.',
        security: [{ csrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
              example: { email: 'alex.morgan@example.test', password: 'DemoOnlyPass123!' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Signed in',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResult' },
                example: {
                  data: {
                    user: {
                      id: '9f0b2dd6-cdc5-46f9-8b1c-50cc0d7d5d86',
                      email: 'alex.morgan@example.test',
                      name: 'Alex Morgan',
                    },
                    hasWedding: false,
                  },
                  requestId: '8f9b7f19-2d67-4f15-aefc-98b84b60a0cb',
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': {
            description: 'Invalid email or password',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '403': { $ref: '#/components/responses/CsrfRejected' },
          '429': { $ref: '#/components/responses/RateLimited' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Revoke the current session',
        security: [{ csrfToken: [], sessionCookie: [] }],
        responses: {
          '200': {
            description: 'Signed out and cookies cleared',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
                example: {
                  data: { success: true },
                  requestId: '8f9b7f19-2d67-4f15-aefc-98b84b60a0cb',
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/CsrfRejected' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get the current account and wedding state',
        description:
          'The browser sends the session cookie automatically. Wedding state is a placeholder until wedding features are implemented.',
        security: [{ sessionCookie: [] }],
        responses: {
          '200': {
            description: 'Current account',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        hasWedding: { type: 'boolean', example: false },
                        membership: { type: 'object', nullable: true },
                        wedding: { type: 'object', nullable: true },
                      },
                    },
                    requestId: { type: 'string', format: 'uuid' },
                  },
                },
                example: {
                  data: {
                    user: {
                      id: '9f0b2dd6-cdc5-46f9-8b1c-50cc0d7d5d86',
                      email: 'alex.morgan@example.test',
                      name: 'Alex Morgan',
                    },
                    hasWedding: false,
                    membership: null,
                    wedding: null,
                  },
                  requestId: '8f9b7f19-2d67-4f15-aefc-98b84b60a0cb',
                },
              },
            },
          },
          '401': {
            description: 'Missing or expired session',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Request password recovery',
        description:
          'Returns a generic accepted response without revealing whether the email exists. The request fails with 503 when reset email is not configured.',
        security: [{ csrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EmailRequest' },
              example: { email: 'alex.morgan@example.test' },
            },
          },
        },
        responses: {
          '202': {
            description: 'Generic recovery request accepted; the password has not been changed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'object', properties: { message: { type: 'string' } } },
                    requestId: { type: 'string', format: 'uuid' },
                  },
                },
                example: {
                  data: {
                    message:
                      'Request received. If an account exists, you may receive reset instructions. Your password has not been changed.',
                  },
                  requestId: '8f9b7f19-2d67-4f15-aefc-98b84b60a0cb',
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '403': { $ref: '#/components/responses/CsrfRejected' },
          '429': { $ref: '#/components/responses/RateLimited' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset password with a single-use token',
        description:
          'The token is provided in the URL fragment by the reset link, then submitted in this request body.',
        security: [{ csrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
              example: {
                token: 'replace-with-token-from-reset-email',
                newPassword: 'NewDemoPass456!',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password updated; existing sessions revoked',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
                example: {
                  data: { success: true },
                  requestId: '8f9b7f19-2d67-4f15-aefc-98b84b60a0cb',
                },
              },
            },
          },
          '400': {
            description: 'Invalid or expired reset token or invalid password',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '403': { $ref: '#/components/responses/CsrfRejected' },
          '429': { $ref: '#/components/responses/RateLimited' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
  },
} as const;
