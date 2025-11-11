// using clerk ui components instead
export {};

// import {
//   Box,
//   Button,
//   Divider,
//   Card as MuiCard,
//   styled,
//   SvgIcon,
//   Typography,
// } from '@mui/material';
// import { useSearch } from '@tanstack/react-router';
// import { AuthForm, signInFormOpts } from '~/components/AuthForm';
// import { MuiLink } from '~/components/MuiLink';
// import { useAppForm } from '~/hooks/form';
// // import { useAsyncToast } from '~/hooks/useAsyncToast';
// // import { ForgotPassword } from '~/components/ForgotPassword';
// // import { signInWithCredentials } from '~/lib/auth';

// export const Card = styled(MuiCard)(({ theme }) => ({
//   display: 'flex',
//   flexDirection: 'column',
//   alignSelf: 'center',
//   width: '100%',
//   padding: theme.spacing(4),
//   gap: theme.spacing(2),
//   margin: 'auto',
//   [theme.breakpoints.up('sm')]: {
//     maxWidth: '450px',
//   },
//   boxShadow:
//     'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
//   ...theme.applyStyles('dark', {
//     boxShadow:
//       'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
//   }),
// }));

// export const SignIn = () => {
//   // const navigate = useNavigate({ from: '/auth/signin' });
//   const search = useSearch({
//     from: '/auth/signin',
//     shouldThrow: false,
//   });
//   // const toast = useAsyncToast();

//   const form = useAppForm({
//     ...signInFormOpts,
//     onSubmit: async ({ value }) => {
//       console.log(value);
//       alert('TODO: sign in submit handler');
//       // const { success, user, error } = await signInWithCredentials(
//       //   value.email,
//       //   value.password
//       // );
//       // if (!success) {
//       //   // TODO: handle errors
//       //   console.log('user: ', user);
//       //   toast.error(error || 'authentication unsuccessful');
//       //   return;
//       // }

//       // navigate({ to: search?.redirect || '/', replace: true });
//     },
//   });

//   return (
//     <Card>
//       <Box
//         component='form'
//         onSubmit={(e) => {
//           e.preventDefault();
//           e.stopPropagation();
//           form.handleSubmit();
//         }}
//         noValidate
//         sx={{
//           display: 'flex',
//           flexDirection: 'column',
//           width: '100%',
//           gap: 2,
//         }}
//       >
//         <AuthForm form={form} title={'Sign in'} />
//       </Box>
//       {/* <ForgotPasswordModal /> */}
//       <Divider>or</Divider>
//       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//         <Button
//           fullWidth
//           variant='outlined'
//           onClick={() => alert('Sign in with Google')}
//           startIcon={<GoogleIcon />}
//         >
//           Sign in with Google
//         </Button>
//         {/* <Button
//           fullWidth
//           variant='outlined'
//           onClick={() => alert('Sign in with Facebook')}
//           startIcon={<FacebookIcon />}
//         >
//           Sign in with Facebook
//         </Button> */}
//         <Typography sx={{ textAlign: 'center' }}>
//           Don&apos;t have an account?{' '}
//           <MuiLink
//             to='/auth/signup'
//             search={search}
//             variant='body2'
//             sx={{ alignSelf: 'center' }}
//           >
//             Sign up
//           </MuiLink>
//         </Typography>
//       </Box>
//     </Card>
//   );
// };

// // function ForgotPasswordModal() {
// //   const [open, setOpen] = useState(false);
// //   const handleClickOpen = () => {
// //     setOpen(true);
// //   };
// //   const handleClose = () => {
// //     setOpen(false);
// //   };
// //   return (
// //     <>
// //       <ForgotPassword open={open} handleClose={handleClose} />
// //       <Link
// //         component='button'
// //         type='button'
// //         onClick={handleClickOpen}
// //         variant='body2'
// //         sx={{ alignSelf: 'center' }}
// //       >
// //         Forgot your password?
// //       </Link>
// //     </>
// //   );
// // }

// export function GoogleIcon() {
//   return (
//     <SvgIcon>
//       <svg
//         width='16'
//         height='16'
//         viewBox='0 0 16 16'
//         fill='none'
//         xmlns='http://www.w3.org/2000/svg'
//       >
//         <path
//           d='M15.68 8.18182C15.68 7.61455 15.6291 7.06909 15.5345 6.54545H8V9.64364H12.3055C12.1164 10.64 11.5491 11.4836 10.6982 12.0509V14.0655H13.2945C14.8073 12.6691 15.68 10.6182 15.68 8.18182Z'
//           fill='#4285F4'
//         />
//         <path
//           d='M8 16C10.16 16 11.9709 15.2873 13.2945 14.0655L10.6982 12.0509C9.98545 12.5309 9.07636 12.8218 8 12.8218C5.92 12.8218 4.15273 11.4182 3.52 9.52727H0.858182V11.5927C2.17455 14.2036 4.87273 16 8 16Z'
//           fill='#34A853'
//         />
//         <path
//           d='M3.52 9.52C3.36 9.04 3.26545 8.53091 3.26545 8C3.26545 7.46909 3.36 6.96 3.52 6.48V4.41455H0.858182C0.312727 5.49091 0 6.70545 0 8C0 9.29455 0.312727 10.5091 0.858182 11.5855L2.93091 9.97091L3.52 9.52Z'
//           fill='#FBBC05'
//         />
//         <path
//           d='M8 3.18545C9.17818 3.18545 10.2255 3.59273 11.0618 4.37818L13.3527 2.08727C11.9636 0.792727 10.16 0 8 0C4.87273 0 2.17455 1.79636 0.858182 4.41455L3.52 6.48C4.15273 4.58909 5.92 3.18545 8 3.18545Z'
//           fill='#EA4335'
//         />
//       </svg>
//     </SvgIcon>
//   );
// }
