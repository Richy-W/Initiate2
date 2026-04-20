// Common character types used across the application

export interface InventoryItem {
  equipment_id: string;
  quantity: number;
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  equipment_type: string;
  category?: string;
  weight: number;
  cost: Record<string, number>;
  rarity?: string;
  armor_class?: number;
  dex_bonus_max?: number;
  strength_requirement?: number;
  stealth_disadvantage?: boolean;
  damage?: Record<string, any>;
  properties?: string[];
  tool_type?: string;
  source: string;
  page: number;
}

export interface Character {
  id: string;
  name: string;
  level: number;
  experience_points: number;
  species: any;
  character_class: any;
  background: any;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  dexterity_modifier?: number;
  constitution_modifier?: number;
  strength_modifier?: number;
  intelligence_modifier?: number;
  wisdom_modifier?: number;
  charisma_modifier?: number;
  current_hit_points: number;
  max_hit_points: number;
  armor_class: number;
  proficiency_bonus: number;
  skills?: Record<string, any>;
  skill_proficiencies?: any[];
  skill_expertises?: any[];
  saving_throw_proficiencies?: string[];
  equipment: InventoryItem[];
  equipped_items: Record<string, string>;
  equipped_items_details?: Record<string, {
    equipment: Equipment;
    slot: string;
    id: string;
  }>;
  calculated_armor_class?: number;
  currency: Record<string, number>;
  total_weight?: number;
  carrying_capacity?: number;
  encumbrance_status?: 'normal' | 'encumbered' | 'heavily_encumbered';
  encumbrance_effects?: {
    speed_penalty: number;
    disadvantage_checks: boolean;
    description: string;
  };
  effective_speed?: number;
  is_encumbered?: boolean;
  currency_total_gp_value?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CharacterData {
  name: string;
  species: any;
  character_class: any;
  background: any;
  ability_scores: Record<string, number>;
  level: number;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  dm: string;
  dm_username: string;
  is_active: boolean;
  join_mode: 'invitation_only' | 'approval_required';
  encumbrance_rules: 'disabled' | 'simple' | 'variant';
  rule_validation: 'strict' | 'warnings' | 'permissive';
  settings: Record<string, any>;
  invite_code: string;
  created_at: string;
  updated_at: string;
  last_session: string | null;
  member_count: number;
  memberships?: CampaignMembership[];
}

export interface CampaignMembership {
  id: string;
  campaign: string;
  player: string;
  player_username: string;
  character: string | null;
  character_name: string | null;
  status: 'active' | 'invited' | 'pending' | 'left' | 'removed';
  joined_at: string;
  updated_at: string;
}

export interface CampaignInvitation {
  id: string;
  campaign: string;
  campaign_name: string;
  invited_by: string;
  invited_by_username: string;
  email: string;
  invitee: string | null;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';
  message: string;
  created_at: string;
  expires_at: string | null;
}

export interface CampaignNotification {
  id: string;
  campaign: string;
  recipient: string;
  notification_type: 'info' | 'invite' | 'join_request' | 'combat' | 'session';
  title: string;
  message: string;
  payload: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface InitiativeParticipant {
  id: string;
  character: string | null;
  character_name: string | null;
  npc_name: string;
  display_name: string;
  display: string;
  initiative_value: number;
  hit_points: number;
  max_hit_points: number;
  is_visible: boolean;
  is_active: boolean;
  turn_order: number;
  notes: string;
}

export interface SpellEffect {
  id: string;
  caster: string;
  caster_name: string;
  spell_name: string;
  duration_rounds: number;
  concentration: boolean;
  description: string;
  is_visible: boolean;
  created_at: string;
}

export interface InitiativeTracker {
  id: string;
  campaign: string;
  name: string;
  round_number: number;
  active_participant: string | null;
  status: 'rolling' | 'active' | 'paused' | 'concluded';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  participant_count: number;
  participants?: InitiativeParticipant[];
  spell_effects?: SpellEffect[];
}

export interface HomebrewContent {
  id: string;
  creator: string;
  creator_username: string;
  content_type: 'species' | 'class' | 'background' | 'spell' | 'equipment' | 'feat' | 'monster' | 'magic_item' | 'other';
  name: string;
  description: string;
  data: Record<string, any>;
  dependencies: string[];
  version: number;
  status: 'draft' | 'published' | 'archived';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentSharingPermission {
  id: string;
  content: string;
  campaign: string | null;
  user: string | null;
  permission_type: 'view' | 'use';
  granted_at: string;
}