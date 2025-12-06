export {};

// import { Box, Stack, styled, Typography } from '@mui/material';
// import { type LinkProps } from '@tanstack/react-router';
// import { useRef, type RefObject } from 'react';
// import { MuiStackLink } from '~/components/MuiStackLink';
// import { SubscribeIconButton } from '~/components/SubscribeIconButton';
// import { SubscribeIconButtonITunes } from '~/components/SubscribeIconButtonITunes';
// import { useHover } from '~/hooks/useHover';
// import type { PodcastFeed, TrendingFeed } from '~/lib/podcastIndexTypes';

// // TODO: separate component from data --> reuse for pod and episode
// // dynamic:
// // action (play episode / subscribe)
// // link (pass link as link component to primary/ secondary text instead of wrapping entire component ??)
// // use mui list item ??

// const ClampedTypography = styled(Typography)({
//   overflow: 'hidden',
//   display: '-webkit-box',
//   // lineClamp: 2,
//   '-webkit-line-clamp': '2',
//   '-webkit-box-orient': 'vertical',
//   // boxOrient: 'vertical',
//   textOverflow: 'ellipsis',
// });

// interface TrendingCardProps {
//   feed: PodcastFeed | TrendingFeed;
//   orientation?: 'vertical' | 'horizontal';
//   rank?: number;
//   linkProps?: LinkProps;
// }

// // use clsx for orientation styling ??
// // TODO: finish support for orientation

// export function TrendingCardPodIndex({
//   feed,
//   orientation = 'horizontal',
//   rank,
//   linkProps,
// }: TrendingCardProps) {
//   const ref = useRef<HTMLDivElement>(null);
//   const [isHovering] = useHover<HTMLDivElement>(
//     ref as RefObject<HTMLDivElement>
//   );

//   let isRow = orientation === 'horizontal';

//   return (
//     <div ref={ref}>
//       <MuiStackLink
//         direction={isRow ? 'row' : 'column'}
//         spacing={isRow ? 2 : 0.5}
//         to={'/podcast/$podId'}
//         params={{ podId: `${feed.id || ''}` }}
//         sx={{
//           position: 'relative',
//           textDecoration: 'none',
//           '&:visited': { color: 'textPrimary' },
//           '&:hover': { color: 'textPrimary' },
//         }}
//         {...linkProps}
//       >
//         {rank !== undefined ? (
//           <Typography
//             variant='overline'
//             color='textSecondary'
//             sx={{ lineHeight: '1.4', textAlign: 'center' }}
//           >
//             {rank || ''}
//           </Typography>
//         ) : null}

//         <Box sx={{ position: 'relative' }}>
//           <Box
//             sx={{
//               width: isRow ? 60 : '100%',
//               height: isRow ? 60 : 'auto',
//               overflow: 'hidden',
//               borderRadius: 1,
//               objectFit: 'cover',
//               aspectRatio: '1/1',
//               '& > img': { width: '100%' },
//             }}
//           >
//             <img src={feed.artwork || feed.image} alt={`${feed.title}`} />
//           </Box>
//           {!isRow && (feed as PodcastFeed).podcastGuid ? (
//             <Box
//               sx={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 opacity: isHovering ? 1 : 0,
//                 transition: 'opacity 0.3s ease-in-out',
//                 position: 'absolute',
//                 bottom: 8,
//                 right: 4,
//               }}
//             >
//               <SubscribeIconButton
//                 podcastId={(feed as PodcastFeed).podcastGuid}
//               />
//             </Box>
//           ) : !isRow && feed.itunesId ? (
//             <Box
//               sx={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 opacity: isHovering ? 1 : 0,
//                 transition: 'opacity 0.3s ease-in-out',
//                 position: 'absolute',
//                 bottom: 8,
//                 right: 4,
//               }}
//             >
//               <SubscribeIconButtonITunes itunesId={feed.itunesId as number} />
//             </Box>
//           ) : null}
//         </Box>
//         <Stack
//           direction='column'
//           spacing={0.25}
//           sx={{
//             justifyContent: isRow ? 'center' : 'flex-start',
//             flex: '1 1 auto',
//           }}
//         >
//           <ClampedTypography
//             variant='body1'
//             color='textPrimary'
//             fontWeight='medium'
//             sx={{ '-webkit-line-clamp': isRow ? '1' : '2' }}
//           >
//             {feed.title}
//           </ClampedTypography>
//           <ClampedTypography
//             variant='body2'
//             color='textSecondary'
//             fontWeight={500}
//             sx={{ '-webkit-line-clamp': isRow ? '1' : '2' }}
//           >
//             {feed.author}
//           </ClampedTypography>
//         </Stack>

//         {isRow && (feed as PodcastFeed).podcastGuid ? (
//           <Box
//             sx={{
//               display: 'flex',
//               alignItems: 'center',
//               opacity: isHovering ? 1 : 0,
//               transition: 'opacity 0.3s ease-in-out',
//             }}
//           >
//             <SubscribeIconButton
//               podcastId={(feed as PodcastFeed).podcastGuid}
//             />
//           </Box>
//         ) : isRow && feed.itunesId ? (
//           <Box
//             sx={{
//               display: 'flex',
//               alignItems: 'center',
//               opacity: isHovering ? 1 : 0,
//               transition: 'opacity 0.3s ease-in-out',
//               // position: 'absolute',
//               // bottom: 8,
//               // right: 4,
//             }}
//           >
//             <SubscribeIconButtonITunes itunesId={feed.itunesId as number} />
//           </Box>
//         ) : null}
//       </MuiStackLink>
//     </div>
//   );
// }
