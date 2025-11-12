import { Stack, Typography } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
// const filePath = 'count.txt';

// async function readCount() {
//   return parseInt(
//     await fs.promises.readFile(filePath, 'utf-8').catch(() => '0')
//   );
// }

// const getCount = createServerFn({
//   method: 'GET',
// }).handler(() => {
//   return readCount();
// });

// // const updateCount = createServerFn({ method: 'POST' })
// //   .inputValidator((d: number) => d)
// //   .handler(async ({ data }) => {
// //     const count = await readCount();
// //     await fs.promises.writeFile(filePath, `${count + data}`);
// //   });

// const indexSearchSchema = z.object({
//   count: z.number().optional(), // .default(0),
// });

export const Route = createFileRoute('/')({
  component: Home,
  // loader: async () => await getCount(),
  // validateSearch: (search) => indexSearchSchema.parse(search),
});

function Home() {
  return (
    <Stack alignItems='center'>
      <Typography variant='h1' marginBlockEnd={4}>
        Hello world!
      </Typography>
      <button
        onClick={() => {
          fetch('/api/search', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            // body: JSON.stringify({ name: 'Tanner' }),
          })
            .then((res) => res.json())
            .then((data) => console.log(data));
        }}
      >
        Say Hello
      </button>
    </Stack>
  );
}

// function Home() {
//   const router = useRouter();
//   const state = Route.useLoaderData();

//   return (
//     <Button
//       variant='contained'
//       onClick={() => {
//         updateCount({ data: 1 }).then(() => {
//           router.invalidate();
//         });
//       }}
//     >
//       Add 1 to {state}?
//     </Button>
//   );
// }
