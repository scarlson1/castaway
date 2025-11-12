import { handleClerkWebhook } from 'convex/clerk';
import { httpRouter } from 'convex/server';

const http = httpRouter();

http.route({
  path: '/api/webhooks/clerk',
  method: 'POST',
  handler: handleClerkWebhook,
});

export default http;
