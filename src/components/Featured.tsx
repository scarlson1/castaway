import { convexQuery } from '@convex-dev/react-query';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { LinkProps } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useMemo } from 'react';
import { MuiLink } from '~/components/MuiLink';

interface CarouselItemProps {
  imgSrc: string;
  title: string;
  subtitle?: string;
  description: string;
  linkProps: LinkProps; // <'a', >;
}

const Carousel = ({ items }: { items: CarouselItemProps[] }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, containScroll: false },
    [Autoplay({ delay: 10000 })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <>
      <Box
        sx={{
          overflow: 'hidden',
          position: 'relative',
          height: { xs: 'inherit', sm: '100%' },
        }}
        ref={emblaRef}
      >
        <Box
          sx={{ display: 'flex', alignContent: 'center', height: 'inherit' }}
        >
          {items.map((item, i) => (
            <Box
              key={`${item.title}-${i}`}
              sx={{ flex: '0 0 100%', minWidth: 0 }}
            >
              <CarouselItem {...item} />
            </Box>
          ))}
        </Box>
        {items.length > 1 ? (
          <>
            <IconButton
              size='small'
              onClick={scrollPrev}
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.6)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
              }}
            >
              <ArrowBackIos fontSize='inherit' />
            </IconButton>

            <IconButton
              size='small'
              onClick={scrollNext}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.6)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
              }}
            >
              <ArrowForwardIos fontSize='inherit' />
            </IconButton>
          </>
        ) : null}
      </Box>
    </>
  );
};

function CarouselItem({
  imgSrc,
  title,
  subtitle,
  description,
  linkProps,
}: CarouselItemProps) {
  return (
    <Box display='flex'>
      <Box
        sx={{
          objectFit: 'cover',
          aspectRatio: '1/1',
          overflow: 'hidden',
          // flexGrow: 0,
          // flexShrink: 0,
          // flexBasis: { xs: '80px', sm: '100px', md: '140px', lg: '180px' },
          flex: {
            xs: '0 0 100px',
            sm: '0 0 160px',
            md: '0 0 200px',
            lg: '0 0 240px',
          },
          width: { xs: 100, sm: 160, md: 200, lg: 240 },
          height: 'auto',
          borderRadius: 1, // { xs: 1, md: 2 },
          '& > img': { width: '100%', borderRadius: 'inherit' },
        }}
      >
        <img src={imgSrc} alt={title} />
      </Box>
      <Box flex='1 1 auto' sx={{ ml: 2 }}>
        <Typography
          variant='overline'
          // lineHeight={1.6}
          color='primary'
          component='div'
          fontWeight='medium'
        >
          Featured
        </Typography>
        <MuiLink
          variant='h5'
          fontWeight={500}
          {...linkProps}
          underline='none'
          color='textPrimary'
          gutterBottom
        >
          {title}
        </MuiLink>
        {subtitle ? (
          <Typography variant='subtitle1' fontWeight={500} gutterBottom>
            {subtitle}
          </Typography>
        ) : null}
        <Typography color='textSecondary' variant='body2'>
          {description}
        </Typography>
      </Box>
    </Box>
  );
}

export const Featured = () => {
  const { data } = useSuspenseQuery(
    convexQuery(api.podcasts.recentlyUpdated, {})
  );

  const items = useMemo(
    () =>
      data.map((pod) => ({
        imgSrc: pod.imageUrl || '',
        title: pod.title,
        subtitle: pod.author,
        description: pod.description,
        linkProps: {
          to: '/podcasts/$podId',
          params: { podId: pod.podcastId },
        } as LinkProps,
      })),
    [data]
  );

  return <Carousel items={items} />;
};
