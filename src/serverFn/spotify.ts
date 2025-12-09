import {
  SpotifyApi,
  type Episode,
  type Market,
  type Playlist,
  type QueryAdditionalTypes,
} from '@spotify/web-api-ts-sdk';
import { createServerFn, createServerOnlyFn } from '@tanstack/react-start';
import z from 'zod';

// const getSpotifyToken = createServerOnlyFn(async () => {
//   var client_id = process.env.VITE_SPOTIFY_CLIENT_ID;
//   var client_secret = process.env.SPOTIFY_CLIENT_SECRET;

//   const authUrl = 'https://accounts.spotify.com/api/token';
//   // const formData = new FormData();
//   // formData.append('grant_type', 'client_credentials');

//   const options = {
//     headers: {
//       Authorization:
//         'Basic ' +
//         Buffer.from(client_id + ':' + client_secret).toString('base64'),
//       'Content-Type': 'application/x-www-form-urlencoded',
//     },
//     body: new URLSearchParams({
//       grant_type: 'client_credentials',
//     }), // formData,
//   };

//   const res = await ky
//     .post<{ access_token: string; token_type: string; expires_in: number }>(
//       authUrl,
//       options
//     )
//     .json();

//   const token = res.access_token;

//   return token;
// });

let spotify: SpotifyApi;

const getSpotify = createServerOnlyFn(() => {
  if (spotify) return spotify;

  var client_id = process.env.VITE_SPOTIFY_CLIENT_ID;
  var client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!(client_id && client_secret))
    throw new Error('missing spotify cred env vars');

  spotify = SpotifyApi.withClientCredentials(client_id, client_secret);
  return spotify;
});

export const fetchSpotifyPlaylistArgs = z.object({
  playlistId: z.string(),
  market: z.string().optional(),
  fields: z.string().optional(),
  additional_types: z.array(z.string()).optional(),
});
export type FetchSpotifyPlaylistArgs = z.infer<typeof fetchSpotifyPlaylistArgs>;

export const fetchSpotifyPlaylist = createServerFn()
  .inputValidator(fetchSpotifyPlaylistArgs)
  .handler(
    async ({
      data: { playlistId, market, fields, additional_types = ['episodes'] },
    }) => {
      const sdk = getSpotify();

      return (await sdk.playlists.getPlaylist<QueryAdditionalTypes>(
        playlistId,
        market as Market,
        fields,
        additional_types as QueryAdditionalTypes
      )) as Playlist<Episode>;

      // const token = await getSpotifyToken();

      // // https://api.spotify.com/v1/playlists/{playlist_id}
      // const result = await ky
      //   .get<any>(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      //     // prefixUrl: 'https://api.spotify.com/v1/',
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   })
      //   .json();

      // return result;
    }
  );
