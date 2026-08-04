export type BoutStatus = 'LIVE' | 'WAITING' | 'COMPLETED';

export interface RoundScore {
  round: string;
  red: string;
  blue: string;
}

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
  gomoCorner: 'RED' | 'BLUE';
  redName: string;
  redGym: string;
  redAvatar?: string;
  blueName: string;
  blueGym: string;
  blueAvatar?: string;
  result: string;
  methodOrMedal: string;
  medal: string;
  rounds: RoundScore[];
  redPoints: string;
  bluePoints: string;
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
  result?: string;
  methodOrMedal?: string;
  medal?: string;
  score?: string;
  r1Score?: string;
  r2Score?: string;
  r3Score?: string;
  r4Score?: string;
  r5Score?: string;
  rounds?: RoundScore[];
  redPoints?: string | number;
  bluePoints?: string | number;
  timestamp?: number;
}
