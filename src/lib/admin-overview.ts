/**
 * أنواع لوحة المالك والقيمة الفارغة الافتراضية (بدون منطق خادم).
 */
export interface AdminCaseStat {
  caseId: string;
  title: string | null;
  paidPurchases: number;
  pendingPurchases: number;
  failedPurchases: number;
  trialPlayers: number;
}

export interface AdminActivityRow {
  id: string;
  eventType: string;
  caseId: string | null;
  roomCode: string | null;
  path: string | null;
  userId: string | null;
  createdAt: string;
}

export interface AdminRoomRow {
  code: string;
  caseId: string;
  phase: string;
  players: number;
  updatedAt: string;
}

export interface AdminOverview {
  allowed: boolean;
  /** إجمالي الحسابات المسجّلة (من جدول الملفات الشخصية). */
  totalProfiles: number | null;
  /** حسابات أُنشئت خلال آخر ٧ أيام. */
  newProfiles7d: number | null;
  totalPurchases: number | null;
  paidPurchases: number | null;
  totalRevenue: { amount: number; currency: string }[] | null;
  totalRooms: number | null;
  activeRooms: number | null;
  totalRoomPlayers: number | null;
  activeProgress: number | null;
  trialRows: number | null;
  webhookEvents: number | null;
  cases: AdminCaseStat[];
  rooms: AdminRoomRow[] | null;
  activity: AdminActivityRow[] | null;
  activityTotal: number | null;
  activity7dByType: { eventType: string; count: number }[] | null;
  contactSubmissions: number | null;
}

export const emptyAdminOverview: AdminOverview = {
  allowed: false,
  totalProfiles: null,
  newProfiles7d: null,
  totalPurchases: null,
  paidPurchases: null,
  totalRevenue: null,
  totalRooms: null,
  activeRooms: null,
  totalRoomPlayers: null,
  activeProgress: null,
  trialRows: null,
  webhookEvents: null,
  cases: [],
  rooms: null,
  activity: null,
  activityTotal: null,
  activity7dByType: null,
  contactSubmissions: null,
};

