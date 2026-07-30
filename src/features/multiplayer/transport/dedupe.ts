/**
 * Duplicate suppression for the hybrid transport.
 *
 * Relay and P2P deliver the same updates by different routes, at different
 * latencies. The receiver keeps whichever copy arrives first and drops the
 * rest, per sender.
 *
 * Sequence numbers are per-sender and monotonic, so "already seen" reduces to
 * "not newer than the highest seq from this sender". That also discards
 * genuinely stale updates — a position that overtook a newer one in flight
 * would otherwise make a rider's marker jump backwards on the map.
 */

export interface Sequenced {
  userId: string;
  seq: number;
}

export class SequenceFilter {
  private highest = new Map<string, number>();

  /**
   * True if this update should be delivered — i.e. it is the newest seen from
   * that sender. Records it as seen as a side effect.
   */
  accept(update: Sequenced): boolean {
    const previous = this.highest.get(update.userId);
    if (previous !== undefined && update.seq <= previous) return false;

    this.highest.set(update.userId, update.seq);
    return true;
  }

  /**
   * Forgets a sender, so a rider who leaves and rejoins with a counter reset to
   * zero is not silently filtered out for the rest of the ride.
   */
  forget(userId: string): void {
    this.highest.delete(userId);
  }

  reset(): void {
    this.highest.clear();
  }
}

/** Monotonic counter for outbound updates from this device. */
export class SequenceGenerator {
  private current = 0;

  next(): number {
    return ++this.current;
  }
}
