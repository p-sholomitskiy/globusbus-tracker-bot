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
  pickup: number | null;
  destination: number | null;
  seats_limit: number | null;
  date_of_journey: string | null;
};
