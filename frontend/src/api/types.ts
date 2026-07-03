// Typy odpowiedzi API współdzielone przez aplikację frontendową.

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  durationMin: number;
  posterUrl: string | null;
}

export interface Screening {
  id: string;
  startsAt: string;
  price: number; // grosze
  movie: Pick<Movie, 'id' | 'title' | 'durationMin' | 'posterUrl'>;
  hall: { id: string; name: string; rows: number; cols: number };
}

export interface Seat {
  id: string;
  row: number;
  col: number;
  occupied: boolean;
}

export interface SeatMapResponse {
  screening: {
    id: string;
    startsAt: string;
    price: number;
    movie: { id: string; title: string; durationMin: number };
  };
  hall: { id: string; name: string; rows: number; cols: number };
  seats: Seat[];
}

export interface Reservation {
  id: string;
  createdAt: string;
  seat: { id: string; row: number; col: number };
  screening: {
    id: string;
    startsAt: string;
    price: number;
    movie: { id: string; title: string; posterUrl: string | null };
    hall: { id: string; name: string };
  };
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: { id: string; email: string };
}

export interface MovieReviewsResponse {
  average: number | null; // średnia ocen (null gdy brak recenzji)
  count: number;
  reviews: Review[];
}
