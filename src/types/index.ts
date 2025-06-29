export interface Coin {
  id: string;
  name: string;
  ticker: string;
}

export interface PriceData {
  date: string;
  price: number;
  "50_day_ma"?: number;
  "200_day_ma"?: number;
}
