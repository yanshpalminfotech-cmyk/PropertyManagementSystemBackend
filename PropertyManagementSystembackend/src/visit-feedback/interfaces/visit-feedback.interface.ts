export enum InterestLevel {
  NOT_INTERESTED = 'NOT_INTERESTED',
  MAYBE = 'MAYBE',
  INTERESTED = 'INTERESTED',
  VERY_INTERESTED = 'VERY_INTERESTED',
}

export interface IVisitFeedback {
  id: string;
  visitRequestId: string;
  interestLevel: InterestLevel;
  feedback: string;
  createdAt: Date;
}
