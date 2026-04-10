export type TripListItem = {
  id: string;
  busNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  startLocation: string;
  endLocation: string;
  availableTickets: number;
};

export type TripList = TripListItem[]

export type TripRequestFilter = {
  pickup: string;
  destination: string;
  seats_limit: string;
  date_of_journey: string;
};
