export interface GroupMember {
  id: string;
  name: string;
  location: [number, number];
  lastUpdated: number;
}

export interface GroupData {
  groupId: string;
  members: Record<string, GroupMember>;
}
