import { z } from 'zod';

/**
 * Login Validation Schemas
 */
export const LoginSchema = z.object({
  identifier: z.string().min(1, 'Username or Phone Number is required'),
});

export type LoginFormValues = z.infer<typeof LoginSchema>;

/**
 * Registration Validation Schemas
 */
export const RegistrationSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters'),
  mobileNumber: z
    .string()
    .min(10, 'Mobile number must be at least 10 digits')
    .regex(/^\+?[0-9]+$/, 'Invalid mobile number format'),
});

export type RegistrationFormValues = z.infer<typeof RegistrationSchema>;

/**
 * SNA Login Validation Schema
 */
export const SNALoginSchema = z.object({
  mobileNumber: z
    .string()
    .min(10, 'Mobile number must be at least 10 digits')
    .regex(/^\+?[0-9]+$/, 'Invalid mobile number format'),
});

export type SNALoginFormValues = z.infer<typeof SNALoginSchema>;
