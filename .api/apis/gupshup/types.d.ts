import type { FromSchema } from 'json-schema-to-ts';
import * as schemas from './schemas';
export type SendingAuthenticationTemplateFormDataParam = FromSchema<typeof schemas.SendingAuthenticationTemplate.formData>;
export type SendingAuthenticationTemplateMetadataParam = FromSchema<typeof schemas.SendingAuthenticationTemplate.metadata>;
export type SendingAuthenticationTemplateResponse202 = FromSchema<typeof schemas.SendingAuthenticationTemplate.response['202']>;
export type SendingAuthenticationTemplateResponse400 = FromSchema<typeof schemas.SendingAuthenticationTemplate.response['400']>;
export type SendingAuthenticationTemplateResponse401 = FromSchema<typeof schemas.SendingAuthenticationTemplate.response['401']>;
