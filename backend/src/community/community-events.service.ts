import { Injectable } from '@nestjs/common';
import { Observable, Subject, filter, map } from 'rxjs';

export type CommunityEvent =
  | { type: 'NEW_POST'; companySlug: string; post: unknown }
  | { type: 'POST_LIKED'; companySlug: string; postId: string; likeCount: number }
  | { type: 'POST_COMMENTED'; companySlug: string; postId: string; commentCount: number; comment: unknown }
  | { type: 'STATS_UPDATED'; companySlug: string; verifiedCount: number };

export interface SseMessage {
  data: string;
}

@Injectable()
export class CommunityEventsService {
  private readonly bus$ = new Subject<CommunityEvent>();

  emit(event: CommunityEvent) {
    this.bus$.next(event);
  }

  subscribe(companySlug: string): Observable<SseMessage> {
    return this.bus$.asObservable().pipe(
      filter((e) => e.companySlug === companySlug),
      map((e) => ({
        data: JSON.stringify(e),
      } as SseMessage)),
    );
  }
}
