import { useColorScheme } from '@mui/material';
import { useMemo } from 'react';
import type { ToastOptions } from 'react-hot-toast';
import { Toaster as HotToaster, ToastBar } from 'react-hot-toast';
import { CustomToast } from '~/components/Toast';
import { darkToastOptions, lightToastOptions } from '~/constants/toast';

export interface CustomToastOptions extends ToastOptions {
  withProgress?: boolean;
}

export const Toaster = () => {
  const t = useColorScheme();
  let mode = (t.mode === 'system' ? t.systemMode : t.mode) as 'light' | 'dark';

  const options = useMemo(
    () => (mode === 'dark' ? darkToastOptions : lightToastOptions),
    [mode]
  );

  return (
    <HotToaster toastOptions={options}>
      {(t) => (
        <ToastBar toast={t}>
          {(props) => <CustomToast {...props} t={t} />}
        </ToastBar>
      )}
    </HotToaster>
  );
};
