import { createFormHook } from '@tanstack/react-form';
// import { MaskInput } from '../components/MaskInput';
import { Checkbox, Select, SubmitButton, TextField } from '~/components/form';
// import { WizardNavButtons } from '../components/WizardNavButtons';
import { fieldContext, formContext } from './formContext';

// useAppForm is similar to useForm, but provides reusable custom UI components (<field.TextField>, <form.SubmitButton>, etc.)
const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    TextField,
    Select,
    Checkbox,
    // MaskInput,
  },
  formComponents: {
    SubmitButton,
    // WizardNavButtons,
  },
  fieldContext,
  formContext,
});

export { useAppForm, withForm };

// USAGE

// // /src/features/people/shared-form.ts, to be used across `people` features
// const formOpts = formOptions({
//   defaultValues: {
//     firstName: 'John',
//     lastName: 'Doe',
//   },
// })

// // /src/features/people/nested-form.ts, to be used in the `people` page
// const ChildForm = withForm({
//   ...formOpts,
//   // Optional, but adds props to the `render` function outside of `form`
//   props: {
//     title: 'Child Form',
//   },
//   render: ({ form, title }) => {
//     return (
//       <div>
//         <p>{title}</p>
//         <form.AppField
//           name="firstName"
//           children={(field) => <field.TextField label="First Name" />}
//         />
//         <form.AppForm>
//           <form.SubscribeButton label="Submit" />
//         </form.AppForm>
//       </div>
//     )
//   },
// })

// // /src/features/people/page.ts
// const Parent = () => {
//   const form = useAppForm({
//     ...formOpts,
//   })

//   return <ChildForm form={form} title={'Testing'} />
// }
