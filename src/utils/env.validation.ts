import { z } from 'zod';

const envSchema = z.object({
  // NODE_ENV: z.string().optional(), // .default('development'), // z.enum(['development', 'production', 'test']),
  MODE: z.string(),
  VITE_CLERK_PUBLISHABLE_KEY: z.string(),
  VITE_CONVEX_URL: z.string(),
  CLERK_SIGN_IN_URL: z.string().optional(),
  CLERK_SIGN_UP_URL: z.string().optional(),
  VITE_SENTRY_DNS: z.string(),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsedEnv = envSchema.safeParse(import.meta.env);

  if (!parsedEnv.success) {
    console.error(z.prettifyError(parsedEnv.error));
    console.error(
      'Invalid environment variables:',
      z.treeifyError(parsedEnv.error),
      import.meta.env
    );
    throw new Error(
      'Invalid environment variables. Check console for details.'
    );
  }

  return parsedEnv.data;
}

export const env = validateEnv();
