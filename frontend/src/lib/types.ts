export interface Violation {
  id: string;
  violation_type: "no_hardhat" | "no_vest" | "no_mask";
  label: string;
  confidence: number;
  camera_zone: string;
  detected_at: string;
  annotated_image: string | null;
  acknowledged: boolean;
}

export interface Stats {
  total: number;
  unacknowledged: number;
  by_type: Record<string, number>;
}
