import { t } from 'elysia';
import sql from '../config/database';

export const authGuard = {
  detail: {
    security: [
      {
        apiKey: [],
      }, {
        apiSecret: [],
      }
    ],
    parameters: [
      {
        name: 'x-api-key',
        in: 'header',
        description: 'API Key',
        required: true,
        schema: t.String({
          description: 'API Key',
          examples: [ '<your-api-key>' ],
        }),
      },
      {
        name: 'x-api-secret',
        in: 'header',
        description: 'API Secret',
        required: true,
        schema: t.String({
          description: 'API Secret',
          examples: [ '<your-api-secret>' ],
        }),
      }
    ]
  }
};

export const authMiddleware = async ({ request }:any) => {
    const apiKey = request.headers.get('x-api-key');
    const apiSecret = request.headers.get('x-api-secret');

    if (!apiKey || !apiSecret) {
      throw new Error('Missing API credentials');
    }

    const [company] = await sql<[{ id: string; name: string; is_active: boolean }]>`
      SELECT id, name, is_active
      FROM companies
      WHERE api_key = ${apiKey}
      AND api_secret = ${apiSecret}
      LIMIT 1
    `;

    if (!company) {
      throw new Error('Invalid API credentials');
    }

    if (!company.is_active) {
      throw new Error('Company account is inactive');
    }

    return { company };
  };