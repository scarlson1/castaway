import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string(), // .default('development'), // z.enum(['development', 'production', 'test']),
  MODE: z.string(),
  // VITE_API_URL: z.string().url(),
  // VITE_FB_API_KEY: z.string(),
  // VITE_FB_AUTH_DOMAIN: z.string(),
  // VITE_FB_PROJECT_ID: z.string(),
  // VITE_FB_STORAGE_BUCKET: z.string(),
  // VITE_FB_MSG_SENDER_ID: z.string(),
  // VITE_FB_APP_ID: z.string(),
  // VITE_FB_MEASUREMENT_ID: z.string(),
  // VITE_FB_FUNCTIONS_URL: import.meta.env.DEV ? z.string() : z.url(),
  VITE_CLERK_PUBLISHABLE_KEY: z.string(),
  VITE_CONVEX_URL: z.string(),
  CLERK_SIGN_IN_URL: z.string().optional(),
  CLERK_SIGN_UP_URL: z.string().optional(),
  VITE_SENTRY_DNS: z.string(),
  // COOKIE_SECRET: z.string(),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  console.log('NODE_ENV: ', import.meta.env.NODE_ENV);
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
