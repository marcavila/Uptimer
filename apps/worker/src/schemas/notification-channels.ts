import { googleChatChannelConfigSchema, webhookChannelConfigSchema } from '@uptimer/db';
import { z } from 'zod';

export const createNotificationChannelInputSchema = z.discriminatedUnion('type', [
  z.object({
    name: z.string().min(1),
    type: z.literal('webhook'),
    config_json: webhookChannelConfigSchema,
    is_active: z.boolean().optional(),
  }),
  z.object({
    name: z.string().min(1),
    type: z.literal('google-chat'),
    config_json: googleChatChannelConfigSchema,
    is_active: z.boolean().optional(),
  }),
]);

export type CreateNotificationChannelInput = z.infer<typeof createNotificationChannelInputSchema>;

export const patchNotificationChannelInputSchema = z
  .object({
    name: z.string().min(1).optional(),
    config_json: z.union([webhookChannelConfigSchema, googleChatChannelConfigSchema]).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((val) => Object.keys(val).length > 0, {
    message: 'At least one field must be provided',
  });

export type PatchNotificationChannelInput = z.infer<typeof patchNotificationChannelInputSchema>;
