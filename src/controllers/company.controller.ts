import { Elysia, t } from 'elysia';
import sql from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';

export const companyController = new Elysia({ prefix: '/companies' }).derive(authMiddleware).guard({
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
                  
                }),
            },
            {
                name: 'x-api-secret',
                in: 'header',
                description: 'API Secret',
                required: true,
                schema: t.String({
                    description: 'API Secret',
                   
                }),
            }
        ]
    }
})
    .post('/', async (ctx) => {
        const { name } = ctx.body;
        
        const [company] = await sql<[{ id: string; name: string; api_key: string; api_secret: string }]>`
            INSERT INTO companies (name)
            VALUES (${name})
            RETURNING id, name, api_key, api_secret
        `;

        return {
            status: 200,
            isSuccess: true,
            message: 'Company created successfully',
            data: company
        };
    }, {
        body: t.Object({
            name: t.String({ examples: ['Test Company'], description: 'Company name' })
        }),
        tags: ['Companies'],
        detail: {
            summary: 'Create Company',
            description: 'Create a new company',
        },
        response: {
            200: t.Object({
                status: t.Number({ examples: [200] }),
                isSuccess: t.Boolean({ examples: [true] }),
                message: t.String({ examples: ['Company created successfully'] }),
                data: t.Object({
                    id: t.String(),
                    name: t.String(),
                    api_key: t.String(),
                    api_secret: t.String()
                })
            })
        }
    })

    .get('/', async () => {
        const companies = await sql<Array<{ id: string; name: string; created_at: Date; is_active: boolean }>>`
            SELECT id, name, created_at, is_active
            FROM companies
            ORDER BY created_at DESC
        `;

        return {
            status: 200,
            isSuccess: true,
            message: 'Companies fetched successfully',
            data: companies
        };
    }, {
        tags: ['Companies'],
        detail: {
            summary: 'List Companies',
            description: 'Get all companies',
        },
        response: {
            200: t.Object({
                status: t.Number({ examples: [200] }),
                isSuccess: t.Boolean({ examples: [true] }),
                message: t.String({ examples: ['Companies fetched successfully'] }),
                data: t.Array(t.Object({
                    id: t.String(),
                    name: t.String(),
                    created_at: t.Date(),
                    is_active: t.Boolean()
                }))
            })
        }
    })

    .get('/:id', async ({ params: { id },error }) => {
        const [company] = await sql<[{ id: string; name: string; created_at: Date; is_active: boolean }]>`
            SELECT id, name, created_at, is_active
            FROM companies
            WHERE id = ${id}
        `;

        if (!company) {
            error(404, {
                status: 404,
                data: null,
                isSuccess: false,
                message: 'Company not found'
            })
        }

        return {
            status: 200,
            isSuccess: true,
            message: 'Company fetched successfully',
            data: company
        };
    }, {
       
        tags: ['Companies'],
        detail: {
            summary: 'Get Company',
            description: 'Retrieve a company by its unique ID.',
        },
        response: {
            200: t.Object({
                status: t.Number({ examples: [200] }),
                isSuccess: t.Boolean({ examples: [true] }),
                message: t.String({ examples: ['Company fetched successfully'] }),
                data: t.Object({
                    id: t.String(),
                    name: t.String(),
                    created_at: t.Date(),
                    is_active: t.Boolean()
                })
            }),
            404: t.Object({
                status: t.Number({ examples: [404] }),
                isSuccess: t.Boolean({ examples: [false] }),
                message: t.String({ examples: ['Company not found'] }),
                data: t.Null()
            })
        }
    })

    .put('/:id', async ({ params: { id }, body }) => {
        const [company] = await sql<[{ id: string; name: string }]>`
            UPDATE companies
            SET name = ${body.name}
            WHERE id = ${id}
            RETURNING id, name
        `;

        if (!company) {
            throw new Error('Company not found');
        }

        return {
            status: 200,
            isSuccess: true,
            message: 'Company updated successfully',
            data: company
        };
    }, {
        params: t.Object({
            id: t.String({ examples: ['123e4567-e89b-12d3-a456-426614174000'] })
        }),
        body: t.Object({
            name: t.String({ examples: ['Updated Company Name'] })
        }),
        tags: ['Companies'],
        detail: {
            summary: 'Update Company',
            description: 'Update company details',
        },
        response: {
            200: t.Object({
                status: t.Number({ examples: [200] }),
                isSuccess: t.Boolean({ examples: [true] }),
                message: t.String({ examples: ['Company updated successfully'] }),
                data: t.Object({
                    id: t.String(),
                    name: t.String()
                })
            })
        }
    })

    .delete('/:id', async ({ params: { id } }) => {
        const [company] = await sql<[{ id: string }]>`
            UPDATE companies
            SET is_active = false
            WHERE id = ${id}
            RETURNING id
        `;

        if (!company) {
            throw new Error('Company not found');
        }

        return {
            status: 200,
            isSuccess: true,
            message: 'Company deleted successfully',
            data: null
        };
    }, {
        params: t.Object({
            id: t.String({ examples: ['123e4567-e89b-12d3-a456-426614174000'] })
        }),
        tags: ['Companies'],
        detail: {
            summary: 'Delete Company',
            description: 'Soft delete company by setting is_active to false',
        },
        response: {
            200: t.Object({
                status: t.Number({ examples: [200] }),
                isSuccess: t.Boolean({ examples: [true] }),
                message: t.String({ examples: ['Company deleted successfully'] }),
                data: t.Null()
            })
        }
    });