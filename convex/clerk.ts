import type { WebhookEvent } from '@clerk/backend';
import { ensureEnvironmentVariable } from 'convex/utils/env';
import { Webhook } from 'svix';
import { internal } from './_generated/api';
import { httpAction } from './_generated/server';

const webhookSecret = ensureEnvironmentVariable('CLERK_WEBHOOK_SECRET');

export const handleClerkWebhook = httpAction(async (ctx, req) => {
  const event = await validateRequest(req);
  // const event = await verifyWebhook(req);
  if (!event)
    return new Response('Error occurred', {
      status: 400,
    });

  switch (event.type) {
    case 'user.created': // intentional fallthrough
    case 'user.updated': {
      const existingUser = await ctx.runQuery(internal.users.getUser, {
        subject: event.data.id,
      });
      if (existingUser && event.type === 'user.created') {
        console.warn('Overwriting user', event.data.id, 'with', event.data);
      }
      console.log('creating/updating user', event.data.id);
      await ctx.runMutation(internal.users.updateOrCreateUser, {
        data: event.data,
      });

      // await ctx.runMutation(internal.users.updateOrCreateUser, {
      //   ...event.data,
      //   // clerkId: event.data.id,
      //   // clerkUser: event.data,
      // });
      break;
    }
    case 'user.deleted': {
      // Clerk docs say this is required, but the types say optional?
      const id = event.data.id!;
      await ctx.runMutation(internal.users.deleteUser, { id });
      break;
    }
    default: {
      console.log('ignored Clerk webhook event', event.type);
    }
  }

  return new Response(null, {
    status: 200,
  });
});

// use internalAction instead ?? https://codetv.dev/blog/react-sms-to-database-convex-twilio-clerk
async function validateRequest(
  req: Request
): Promise<WebhookEvent | undefined> {
  const payloadString = await req.text();

  const svixHeaders = {
    'svix-id': req.headers.get('svix-id')!,
    'svix-timestamp': req.headers.get('svix-timestamp')!,
    'svix-signature': req.headers.get('svix-signature')!,
  };
  const wh = new Webhook(webhookSecret);
  let evt: Event | null = null;
  try {
    evt = wh.verify(payloadString, svixHeaders) as Event;
  } catch (_) {
    console.log('error verifying');
    return;
  }

  return evt as unknown as WebhookEvent;
}
