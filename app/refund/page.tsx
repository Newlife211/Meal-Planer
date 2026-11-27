import type { Metadata } from 'next';
import { LegalView } from '@/components/legal-view';

export const metadata: Metadata = {
  title: 'Refund Policy | Eatwise',
};

export default function RefundPage() {
  return <LegalView docKey="refund" />;
}
