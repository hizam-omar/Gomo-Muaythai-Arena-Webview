export interface Bout {
  id: string;
  boutNumber: string;
  roundName: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  redName: string;
  redGym: string;
  redPoints: number;
  redAvatar?: string;
  blueName: string;
  blueGym: string;
  bluePoints: number;
  blueAvatar?: string;
  isWinnerRed: boolean;
  isWinnerBlue: boolean;
  updatedAt?: any;
}

export interface FightEvent {
  id: string;
  eventName: string;
  location: string;
  date: string;
  isActive: boolean;
}
