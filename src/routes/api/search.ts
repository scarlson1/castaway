import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { getPodClient } from '~/lib/podcastIndexClient';

// can delete - not using (created to test http server fn)
export const Route = createFileRoute('/api/search')({
  server: {
    // middleware: [authMiddleware], // Runs first for all handlers
    handlers: ({ createHandlers }) =>
      createHandlers({
        GET: async ({ request }) => {
          const podClient = getPodClient();
          const results = await podClient.searchByTerm({
            query: 'Pod Save America',
          }); // Experience

          return json({ ...results });
        },
        // POST: {
        //   middleware: [validationMiddleware], // Runs after authMiddleware, only for POST
        //   handler: async ({ request }) => {
        //     const body = await request.json()
        //     return new Response(`Hello, ${body.name}!`)
        //   },
        // },
      }),
  },
});
