export interface ExclusiveOrderItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  color?: string;
  date: string;
}

export interface ExclusiveOrderGroup {
  id: string;
  clientName: string;
  whatsapp: string;
  status: 'PENDING' | 'PURCHASED';
  items: ExclusiveOrderItem[];
  createdAt: string;
  purchasedAt?: string;
}
