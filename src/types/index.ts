export interface Coin {
  id: string;
  name: string;
  ticker: string;
}

export interface PriceData {
  date: string;
  price: number;
  "ma_short"?: number;
  "ma_long"?: number;
}
