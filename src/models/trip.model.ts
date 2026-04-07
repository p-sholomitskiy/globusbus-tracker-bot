export type TripItem = {
  id: string;
  busNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  startLocation: string;
  endLocation: string;
  availableTickets: number;
  description?: string;
};

export type TripRequestFilter = {
  pickup: string;
  destination: string;
  seats_limit: string;
  date_of_journey: string;
};
