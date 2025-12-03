// const { GraphQLClient, gql } = require('graphql-request');
import { createServerFn, createServerOnlyFn } from '@tanstack/react-start';
import { gql, GraphQLClient } from 'graphql-request';
import z from 'zod';

const getPodchaserCreds = createServerOnlyFn(() => ({
  client_id: process.env.PODCHASER_API_KEY,
  client_secret: process.env.PODCHASER_SECRET,
}));

let podchaserToken = '';
let expiresAt = 0;

const getGraphQLToken = createServerOnlyFn(async () => {
  if (podchaserToken && Date.now() < expiresAt) return podchaserToken;
  console.log('FETCHING PODCHASER ACCESS TOKEN');

  const query = gql`
    mutation getToken($client_id: String!, $client_secret: String!) {
      requestAccessToken(
        input: {
          grant_type: CLIENT_CREDENTIALS
          client_id: $client_id
          client_secret: $client_secret
        }
      ) {
        access_token
        token_type
      }
    }
  `;

  const client = new GraphQLClient('https://api.podchaser.com/graphql');
  const response = await client.request(query, getPodchaserCreds());

  podchaserToken = response.requestAccessToken.access_token;
  expiresAt = Date.now() + response.requestAccessToken.expires_in;

  return podchaserToken;
});

export const podcastIdentifierType = z.enum([
  'APPLE_PODCASTS',
  'SPOTIFY',
  'RSS',
  'PODCHASER',
]);
export type PodcastIdentifierType = z.infer<typeof podcastIdentifierType>;

const podcastIdentifier = z.object({
  id: z.string(),
  type: podcastIdentifierType,
});

const ratingFilter = z.object({
  minRating: z.number(),
  maxRating: z.number(),
});
const dateRangeInput = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});
const rangeInput = z.object({
  from: z.number().optional(),
  to: z.number().optional(),
});
const socialFollowerCount = z.object({
  platform: z.string(),
  from: z.int().optional(),
  to: z.int().optional(),
});
const podcastFilters = z
  .object({
    country: z.string(),
    language: z.string(),
    rating: ratingFilter.partial().optional(),
    categories: z.array(z.string()),
    addedDate: dateRangeInput,
    modifiedDate: dateRangeInput,
    powerScore: z.array(rangeInput),
    identifiers: z.array(podcastIdentifier),
    dateOfFirstEpisode: dateRangeInput,
    dateOfLatestEpisode: dateRangeInput,
    hasGuests: z.array(z.boolean()),
    includeRemoved: z.boolean(),
    episodeAudienceEstimate: rangeInput,
    brandSafety: z.object({
      riskExclusions: z.array(
        z.object({
          riskRange: z.any(), //FloatRange
          riskLevels: z.any(), // [BrandSafetyRiskLevel!]
          riskType: z.any(), // BrandSafetyCode!
        })
      ),
    }),
    status: z.array(z.string()),
    socialFollowerCount: z.array(socialFollowerCount),
    networks: z.array(
      z.object({
        id: z.string(),
        type: z.string(),
      })
    ),
    politicalSkew: z.array(z.string()),
    ageRanges: z.array(z.string()),
    incomeRanges: z.array(z.string()),
    genderBias: z.array(z.string()),
    countries: z.array(z.string()),
    states: z.array(z.string()),
    dmas: z.array(z.string()),
    occupations: z.array(z.string()),
    interests: z.array(z.string()),
    ethnicities: z.array(z.any()),
    parentalStatus: z.array(z.string()),
    topBrands: z.array(z.string()),
    topEmployers: z.array(z.string()),
    topInfluences: z.array(z.string()),
  })
  .partial();
const searchOptions = z.object({
  boolSearch: z.boolean().optional(),
});
const podcastSort = z.object({
  sortBy: z.enum([
    'ALPHABETICAL',
    'RELEVANCE',
    'TRENDING',
    'RATING',
    'DATE_OF_FIRST_EPISODE',
    'FOLLOWER_COUNT',
    'POWER_SCORE',
  ]),
  direction: z.enum(['ASCENDING', 'DESCENDING']).optional(),
});
const paginationType = z.any();
const podchaserPodcastsOptions = z.object({
  filters: podcastFilters.optional(),
  options: searchOptions.optional(),
  first: z.int().optional(),
  page: z.int().optional(),
  searchTerm: z.string().optional(),
  sort: podcastSort.optional(),
  paginationType: paginationType.optional(),
  cursor: z.enum(['PAGE', 'CURSOR']).optional(),
});

const PODCASTS_QUERY = gql`
  query FetchPodcasts(
    $filters: PodcastFilters
    $options: SearchOptions
    $first: Int = 10
    $page: Int = 0
    $searchTerm: String
    $sort: PodcastSort
    $paginationType: PaginationType
    $cursor: String
  ) {
    podcasts(
      filters: $filters
      options: $options
      first: $first
      page: $page
      searchTerm: $searchTerm
      sort: $sort
      paginationType: $paginationType
      cursor: $cursor
    ) {
      paginatorInfo {
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
      data {
        id
        title
        description
        url
        webUrl
        rssUrl
        imageUrl
        numberOfEpisodes
        latestEpisodeDate
        ratingCount
        ratingAverage
        reviewCount
        categories {
          title
          slug
        }
      }
    }
  }
`;
// socialLinks categories feeds
// userReview userRating ratingSummary author networks
// powerScore

export const podchaserPodcasts = createServerFn()
  .inputValidator(podchaserPodcastsOptions)
  .handler(async ({ data }) => {
    const accessToken = await getGraphQLToken();
    const client = new GraphQLClient('https://api.podchaser.com/graphql', {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    // return await client.request({
    //   document: PODCASTS_QUERY,
    //   variables: data,
    // });
    try {
      return await client.request(PODCASTS_QUERY, data);
    } catch (err) {
      if (err.response?.errors?.length) {
        console.error('GraphQL error:', err.response.errors[0].message);
      } else {
        console.error('Network or other error:', err.message);
      }
      throw new Error('something went wrong');
    }
  });

const PODCAST_QUERY = gql`
  query FetchPodcasts($identifier: PodcastIdentifier!) {
    podcast(identifier: $identifier) {
      id
      title
      description
      url
      webUrl
      rssUrl
      imageUrl
      numberOfEpisodes
      latestEpisodeDate
      ratingCount
      ratingAverage
      reviewCount
      categories {
        title
        slug
      }
    }
  }
`;

export const podchaserPodcast = createServerFn()
  .inputValidator(podcastIdentifier)
  .handler(async ({ data }) => {
    const accessToken = await getGraphQLToken();
    const client = new GraphQLClient('https://api.podchaser.com/graphql', {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    try {
      return await client.request(PODCAST_QUERY, { identifier: data });
    } catch (err) {
      if (err.response?.errors?.length) {
        console.error('GraphQL error:', err.response.errors[0].message);
      } else {
        console.error('Network or other error:', err.message);
      }
      throw new Error('something went wrong');
    }
  });

const TRANSCRIPT_SEARCH_QUERY = gql`
  query SearchTranscripts(
    $filters: TranscriptFilters
    $term: String!
    $first: Int = 0
    $page: Int = 0
    $options: TranscriptSearchOptions
  ) {
    transcriptSearch(
      filters: $filters
      term: $term
      first: $first
      page: $page
      options: $options
    ) {
      data {
        mentionCount
        episode {
          id
          title
          description
          htmlDescription
          airDate
          addedDate
          imageUrl
          audioUrl
          url
          webUrl
          fileSize
          guid
          length
          explicit
          episodeType
          modifiedDate
          podcast {
            id
            title
          }
          ratingCount
          reviewCount
          ratingAverage
        }
        mentions {
          startTime
          endTime
          snippet
        }
      }
      paginatorInfo {
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
    }
  }
`;

const transcriptFilters = z
  .object({
    identifiers: z.array(podcastIdentifier),
    powerScore: z.array(rangeInput),
    airDate: z.array(dateRangeInput),
    categories: z.array(z.string()),
    transcriptCreationDate: z.array(dateRangeInput),
  })
  .partial();

const transcriptSearchOptions = z.object({
  filters: transcriptFilters.optional(),
  term: z.string(),
  first: z.int().optional(),
  page: z.int().optional(),
  options: z.object({ mentionsPerEpisode: z.int() }).optional(),
});
export type TranscriptSearchOptions = z.infer<typeof transcriptSearchOptions>;

export const transcriptSearch = createServerFn()
  .inputValidator(transcriptSearchOptions)
  .handler(async ({ data }) => {
    const accessToken = await getGraphQLToken();
    const client = new GraphQLClient('https://api.podchaser.com/graphql', {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    console.log('SEARCH DATA: ', data);

    try {
      return await client.request(TRANSCRIPT_SEARCH_QUERY, data);
    } catch (err) {
      if (err.response?.errors?.length) {
        let msg = err.response.errors[0].message;
        if (msg) throw new Error(msg);
      } else {
        console.error('Network or other error:', err.message);
      }
      throw new Error('something went wrong');
    }
  });
