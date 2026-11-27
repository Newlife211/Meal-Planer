import { Suspense } from 'react';
import { SuccessClient } from './success-client';

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessClient />
    </Suspense>
  );
}
