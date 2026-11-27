import type { Metadata } from 'next';
import { LegalView } from '@/components/legal-view';

export const metadata: Metadata = {
  title: 'Terms of Service | Eatwise',
};

export default function TermsPage() {
  return <LegalView docKey="terms" />;
}
