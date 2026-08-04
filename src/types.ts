export type BoutStatus = 'LIVE' | 'WAITING';

export interface Bout {
  id: string;
  fighterId: string;
  boutNumber: string;
  eventName: string;
  eventType: string;
  tournamentRound: string;
  ring: string;
  weightCategory: string;
  status: BoutStatus;
  redName: string;
  redGym: string;
  redAvatar?: string;
  blueName: string;
  blueGym: string;
  blueAvatar?: string;
  timestamp: number;
}

export interface Fighter {
  id?: string | number;
  name?: string;
  nickname?: string;
  club?: string;
  imageUri?: string;
  photoUrl?: string;
  avatarUrl?: string;
}

export interface LiveFightCard {
  id?: string | number;
  fighterId?: string | number | null;
  eventName?: string;
  eventType?: string;
  eventStatus?: string;
  opponentName?: string;
  opponentClub?: string;
  weightCategory?: string;
  boutNumber?: string;
  tournamentRound?: string;
  ring?: string;
  status?: string;
  corner?: string;
  timestamp?: number;
}
