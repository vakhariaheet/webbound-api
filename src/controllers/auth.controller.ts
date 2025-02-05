import { Elysia, t } from 'elysia';
import sql from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import gupshup from '@api/gupshup';




export const authController = new Elysia({ prefix: '/auth' })
    .derive(authMiddleware)
    .guard({
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
    })
    .post('/send-otp', async (ctx) => {
        const { phone } = ctx.body;
        if (!phone) {
            return ctx.error(400, {
                status: 400,
                isSuccess: false,
                message: 'Phone number is required',
                data: null
            });
        }
        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Store OTP in database
        const [ result ] = await sql<[ { id: string } ]>`
      INSERT INTO otps (phone, otp, expires_at)
      VALUES (${phone}, ${otp}, CURRENT_TIMESTAMP + INTERVAL '10 minutes')
      RETURNING id
    `;
        const response = await gupshup.sendingAuthenticationTemplate({
            destination: phone,
            source: process.env.GUPSHUP_SENDER as string,
            template: {
                id: process.env.GUPSHUP_TEMPLATE_ID,
                variables: [ otp ]
            },
            channel: 'whatsapp',
            "src.name": 'Webbound',
            appId: process.env.GUPSHUP_APP_ID,

        }, {
            apikey: process.env.GUPSHUP_API_KEY as string
        })
        console.log(response);
        // For development, we'll return it in response
        return {
            status: 200,
            message: 'OTP sent successfully',
            isSuccess: true,
            data: {
                otp_id: result.id,
                otp: process.env.NODE_ENV === 'production' ? undefined : otp
            }
        };
    }, {
        body: t.Object({
            phone: t.String({
                examples: [ '919104680033' ],
                description: 'Phone number in E.164 format (with country code)',
                pattern: '^[0-9]{10,15}$'
            })
        }),

        tags: [ 'Authentication' ],
        detail: {


            summary: 'Send OTP',
            description: `
Sends a 6-digit OTP to the provided phone number.

**Authentication:**
- Requires API Key and Secret in headers
- x-api-key: Your API Key
- x-api-secret: Your API Secret

**Process:**
1. Generates a 6-digit OTP
2. Stores OTP in database with 10-minute expiry
3. Returns OTP ID for validation

**Note:**
- OTP will be sent via Whatsapp 
            `,
            tags: [ 'Authentication' ],
        },
        response: {
            200: t.Object({
                status: t.Number({ examples: [ 200 ] }),
                isSuccess: t.Boolean({ examples: [ true ] }),
                message: t.String({ examples: [ 'OTP sent successfully' ] }),
                data: t.Object({
                    otp_id: t.String({
                        examples: [ 'ecad80fe-285d-4474-a92d-45ff26615eed' ],
                        description: 'Unique identifier for the OTP'
                    }),
                    otp: process.env.NODE_ENV === 'production'
                        ? t.Undefined()
                        : t.String({
                            examples: [ '123456' ],
                            description: 'OTP value (only in development mode)'
                        })
                })
            }),
            400: t.Object({
                status: t.Number({ examples: [ 400 ] }),
                isSuccess: t.Boolean({ examples: [ false ] }),
                message: t.String({ examples: [ 'Phone number is required' ] }),
                data: t.Null()
            })
        }
    })
    .post('/validate-otp', async (ctx) => {
        const { otp_id, otp } = ctx.body;

        const [ otpRecord ] = await sql<[ { id: string, is_used: boolean, expires_at: string } ]>`
      SELECT id, is_used, expires_at
      FROM otps
      WHERE id = ${otp_id}
      AND otp = ${otp}
      LIMIT 1
    `;

        if (!otpRecord) {
            return ctx.error(400, {
                status: 401,
                isSuccess: false,
                message: 'Invalid OTP',
                data: null
            });
        }

        if (otpRecord.is_used) {
            return ctx.error(401, {
                status: 401,
                isSuccess: false,
                message: 'Invalid OTP',
                data: null
            });
        }

        const now = new Date().toISOString();
        const expiryDate = new Date(otpRecord.expires_at).toISOString();
        console.log(now, expiryDate);
        if (now > expiryDate) {
            return ctx.error(400, {
                status: 400,
                isSuccess: false,
                message: 'OTP expired',
                data: null
            });
        }

        // Mark OTP as used
        await sql`
      UPDATE otps
      SET is_used = true
      WHERE id = ${otp_id}
    `;

        return {
            status: 200,
            isSuccess: true,
            message: 'OTP validated successfully',
            data: null
        };
    }, {
        body: t.Object({
            otp_id: t.String({
                examples: [ "58c54b44-e3b6-4e8e-b94e-aad7d24cfaa5" ],
                description: 'OTP ID received from send-otp endpoint'
            }),
            otp: t.String({
                minLength: 6,
                maxLength: 6,
                examples: [ '123456' ],
                description: '6-digit OTP code',
                pattern: '^[0-9]{6}$'
            })
        }),
        tags: [ 'Authentication' ],
        detail: {
            summary: 'Validate OTP',
            description: `
Validates the provided OTP against the stored OTP.

**Authentication:**
- Requires API Key and Secret in headers
- x-api-key: Your API Key
- x-api-secret: Your API Secret

**Validation Rules:**
1. OTP must exist and match
2. OTP must not be already used
3. OTP must not be expired (10-minute validity)

**Process:**
1. Validates OTP against stored value
2. Checks expiry and usage status
3. Marks OTP as used if valid
            `,
            tags: [ 'Authentication' ],
        },
        response: {
            200: t.Object({
                status: t.Number({ examples: [ 200 ] }),
                isSuccess: t.Boolean({ examples: [ true ] }),
                message: t.String({ examples: [ 'OTP validated successfully' ] }),
                data: t.Null({ description: 'No data returned on successful validation' })
            }),
            401: t.Object({
                status: t.Number({ examples: [ 401 ] }),
                isSuccess: t.Boolean({ examples: [ false ] }),
                message: t.String({
                    examples: [ 'Invalid OTP' ],
                    description: 'Returned when OTP is invalid or already used'
                }),
                data: t.Null()
            }),
            400: t.Object({
                status: t.Number({ examples: [ 400 ] }),
                isSuccess: t.Boolean({ examples: [ false ] }),
                message: t.String({
                    examples: [ 'OTP expired' ],
                    description: 'Returned when OTP has expired (>10 minutes)'
                }),
                data: t.Null()
            }),
        }
    });