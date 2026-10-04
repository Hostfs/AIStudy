export interface MenuItem {
  id: string;
  name: string;
  emoji: string;
  color: string;
  textColor: string;
  description: string;
  weight: number; // 1, 2, 3
  enabled: boolean;
  isDefault?: boolean;
}

export interface SpinHistoryItem {
  id: string;
  menuId: string;
  menuName: string;
  emoji: string;
  color: string;
  timestamp: number;
}
