export type TripListItem = {
  id: string;
  busNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  startLocation: number;
  endLocation: number;
  availableTickets: number;
};

export type TripList = TripListItem[];

export type TripRequestFilter = {
  pickup: number;
  destination: number;
  seats_limit: number;
  date_of_journey: string;
};
