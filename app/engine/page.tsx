import type { Metadata } from 'next';
import EngineExhibit from '@/components/engine/exhibit';
export const metadata: Metadata = {
  title: 'Four-Stroke Engine Lab',
  description:
    'Take apart an interactive four-cylinder engine. Explore combustion, moving parts, oil, and cooling with a guided tour and hands-on controls.',
};
export default function EnginePage() {
  return <EngineExhibit />;
}
