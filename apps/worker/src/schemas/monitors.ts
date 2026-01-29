import { expectedStatusJsonSchema, httpHeadersJsonSchema } from '@uptimer/db';
import { z } from 'zod';

import { validateHttpTarget, validateTcpTarget } from '../monitor/targets';

export const createMonitorInputSchema = z
  .object({
    name: z.string().min(1),
    type: z.enum(['http', 'tcp']),
    target: z.string().min(1),

    interval_sec: z.number().int().min(60).optional(),
    timeout_ms: z.number().int().min(1000).optional(),

    http_method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']).optional(),
    http_headers_json: httpHeadersJsonSchema.optional(),
    http_body: z.string().optional(),
    expected_status_json: expectedStatusJsonSchema.optional(),
    response_keyword: z.string().min(1).optional(),
    response_forbidden_keyword: z.string().min(1).optional(),

    is_active: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    const err = val.type === 'http' ? validateHttpTarget(val.target) : validateTcpTarget(val.target);
    if (err) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: err, path: ['target'] });
    }

    if (
      val.type === 'tcp' &&
      (val.http_method !== undefined ||
        val.http_headers_json !== undefined ||
        val.http_body !== undefined ||
        val.expected_status_json !== undefined ||
        val.response_keyword !== undefined ||
        val.response_forbidden_keyword !== undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'http_* fields are not allowed for tcp monitors',
      });
    }
  });

export type CreateMonitorInput = z.infer<typeof createMonitorInputSchema>;
