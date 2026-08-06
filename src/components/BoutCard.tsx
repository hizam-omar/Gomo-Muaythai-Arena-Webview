import type { Bout } from '../types';
import { CompletedBoutCard } from './CompletedBoutCard';
import { LiveBoutCard } from './LiveBoutCard';
import { UpcomingBoutCard } from './UpcomingBoutCard';
import { WaitingBoutCard } from './WaitingBoutCard';

export function BoutCard({ bout }: { bout: Bout; key?: string }) {
  if (bout.status === 'LIVE') {
    return <LiveBoutCard bout={bout} />;
  }

  if (bout.status === 'COMPLETED') {
    return <CompletedBoutCard bout={bout} />;
  }

  if (bout.isUpNext) {
    return <UpcomingBoutCard bout={bout} />;
  }

  return <WaitingBoutCard bout={bout} />;
}
