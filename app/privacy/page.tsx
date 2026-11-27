import type { Metadata } from 'next';
import { LegalView } from '@/components/legal-view';

export const metadata: Metadata = {
  title: 'Privacy Policy | Eatwise',
};

export default function PrivacyPage() {
  return <LegalView docKey="privacy" />;
}
