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
  startDate: string;
  endDate: string;
  location: string;
  eventType: string;
  tournamentRound: string;
  ring: string;
  weightCategory: string;
  status: BoutStatus;
  isUpNext?: boolean;
  currentRound?: string;
  roundTimer?: string;
  estimatedMinutes?: number;
  waitOrder?: number;
  gomoCorner: 'RED' | 'BLUE';
  redName: string;
  redGym: string;
  redAvatar?: string;
  redProfileUrl?: string;
  blueName: string;
  blueGym: string;
  blueAvatar?: string;
  blueProfileUrl?: string;
  result: string;
  methodOrMedal: string;
  medal: string;
  rounds: RoundScore[];
  redPoints: string;
  bluePoints: string;
  redWinStreak?: number;
  blueWinStreak?: number;
  timestamp: number;
}

export interface Fighter {
  id?: string | number;
  firestoreDocId?: string;
  name?: string;
  nickname?: string;
  nokp?: string;
  dob?: string;
  age?: number;
  weightKg?: number;
  heightCm?: number;
  club?: string;
  manager?: string;
  school?: string;
  gradeClass?: string;
  classTeacher?: string;
  pkTeacher?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  ifmaLicense?: string;
  stance?: string;
  favTechnique?: string;
  createdAt?: number;
  updatedAt?: number;
  isStarred?: boolean;
  imageUri?: string;
  photoUrl?: string;
  avatarUrl?: string;
  winStreak?: number;
  streak?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  videoUrl?: string;
}

export interface FightRecord {
  id?: string | number;
  fighterId?: string | number;
  eventName?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  location?: string;
  opponentName?: string;
  opponentClub?: string;
  weightCategory?: string;
  boutNumber?: string;
  tournamentRound?: string;
  ring?: string;
  status?: string;
  corner?: string;
  gomoCorner?: string;
  result?: string;
  methodOrMedal?: string;
  method?: string;
  medal?: string;
  score?: string;
  redPoints?: string | number;
  bluePoints?: string | number;
  redName?: string;
  blueName?: string;
  redGym?: string;
  blueGym?: string;
  rounds?: RoundScore[];
  completedAt?: number;
  timestamp?: number;
}

export interface LiveFightCard {
  id?: string | number;
  fighterId?: string | number | null;
  linkedFightRecordId?: string | number | null;
  eventName?: string;
  eventType?: string;
  eventStatus?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
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
  winStreak?: number;
  streak?: number;
  redWinStreak?: number;
  blueWinStreak?: number;
  completedAt?: number;
  timestamp?: number;
}
