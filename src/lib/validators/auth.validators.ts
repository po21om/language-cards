import { z } from 'zod';

export const SignUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain letters')
    .regex(/[0-9]/, 'Password must contain numbers'),
});

export const SignInSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});
