// Common character types used across the application

export interface Character {
  id: string;
  name: string;
  level: number;
  experience_points: number;
  species: any;
  class_primary: any;
  background: any;
  ability_scores: Record<string, number>;
  hit_points_current: number;
  hit_points_maximum: number;
  armor_class: number;
  created_at: string;
  updated_at: string;
}

export interface CharacterData {
  name: string;
  species: any;
  class_primary: any;
  background: any;
  ability_scores: Record<string, number>;
  level: number;
}