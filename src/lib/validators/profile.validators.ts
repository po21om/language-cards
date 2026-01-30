import { z } from 'zod';

export const UpdateProfileSchema = z
  .object({
    language_preference: z
      .enum(['en', 'pl'], {
        errorMap: () => ({ message: "Language preference must be 'en' or 'pl'" }),
      })
      .optional(),
  })
  .strict({
    message: "Only 'language_preference' field is allowed",
  });
