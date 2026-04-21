-- D&D Character and Campaign Management Database Schema
-- PostgreSQL DDL for Django application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE join_mode_enum AS ENUM ('invitation_only', 'approval_required');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE encumbrance_enum AS ENUM ('disabled', 'simple', 'variant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rule_validation_enum AS ENUM ('strict', 'warnings', 'permissive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sharing_level_enum AS ENUM ('private', 'specific_users', 'specific_campaigns', 'public');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_type_enum AS ENUM ('species', 'class', 'spell', 'equipment', 'background');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE item_type_enum AS ENUM ('weapon', 'armor', 'tool', 'consumable', 'magical', 'misc');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User accounts
CREATE TABLE IF NOT EXISTS auth_user (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(254) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(128) NOT NULL,
    security_question TEXT,
    security_answer_hash VARCHAR(128),
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_staff BOOLEAN DEFAULT FALSE,
    date_joined TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- User profiles (extends auth_user)
CREATE TABLE IF NOT EXISTS users_userprofile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Species (races) - official and homebrew
CREATE TABLE IF NOT EXISTS content_species (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    ability_score_bonuses JSONB DEFAULT '{}',
    traits JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    proficiencies JSONB DEFAULT '[]',
    size VARCHAR(20) DEFAULT 'Medium',
    speed INTEGER DEFAULT 30,
    is_official BOOLEAN DEFAULT TRUE,
    creator_id UUID REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Character classes - official and homebrew
CREATE TABLE IF NOT EXISTS content_characterclass (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    hit_die VARCHAR(10) NOT NULL,
    primary_abilities JSONB DEFAULT '[]',
    saving_throw_proficiencies JSONB DEFAULT '[]',
    skill_proficiencies JSONB DEFAULT '[]',
    equipment_proficiencies JSONB DEFAULT '{}',
    spellcasting JSONB,
    features_by_level JSONB DEFAULT '{}',
    is_official BOOLEAN DEFAULT TRUE,
    creator_id UUID REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backgrounds
CREATE TABLE IF NOT EXISTS content_background (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    skill_proficiencies JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    equipment JSONB DEFAULT '[]',
    feature JSONB DEFAULT '{}',
    suggested_characteristics JSONB DEFAULT '{}',
    is_official BOOLEAN DEFAULT TRUE,
    creator_id UUID REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment items
CREATE TABLE IF NOT EXISTS content_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    item_type item_type_enum NOT NULL,
    weight DECIMAL(8,2) DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    properties JSONB DEFAULT '{}',
    armor_class INTEGER,
    damage JSONB,
    magical_properties JSONB,
    rarity VARCHAR(20) DEFAULT 'common',
    requires_attunement BOOLEAN DEFAULT FALSE,
    is_official BOOLEAN DEFAULT TRUE,
    creator_id UUID REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns_campaign (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    dm_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    join_mode join_mode_enum DEFAULT 'invitation_only',
    encumbrance_rules encumbrance_enum DEFAULT 'disabled',
    rule_validation rule_validation_enum DEFAULT 'warnings',
    max_players INTEGER DEFAULT 6,
    join_code VARCHAR(20),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_session TIMESTAMP WITH TIME ZONE,
    UNIQUE(dm_id, name)
);

-- Characters
CREATE TABLE IF NOT EXISTS characters_character (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns_campaign(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 1 CHECK (level > 0),
    experience_points INTEGER DEFAULT 0 CHECK (experience_points >= 0),
    species_id UUID NOT NULL REFERENCES content_species(id),
    class_id UUID NOT NULL REFERENCES content_characterclass(id),
    background_id UUID NOT NULL REFERENCES content_background(id),
    ability_scores JSONB NOT NULL,
    hit_points_current INTEGER NOT NULL,
    hit_points_maximum INTEGER NOT NULL,
    hit_dice_current JSONB DEFAULT '{}',
    armor_class INTEGER DEFAULT 10,
    proficiency_bonus INTEGER DEFAULT 2,
    skills JSONB DEFAULT '{}',
    saving_throws JSONB DEFAULT '{}',
    equipment JSONB DEFAULT '[]',
    currency JSONB DEFAULT '{"cp": 0, "sp": 0, "ep": 0, "gp": 0, "pp": 0}',
    features JSONB DEFAULT '[]',
    spells JSONB DEFAULT '{}',
    spell_slots JSONB DEFAULT '{}',
    notes TEXT,
    personality JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (hit_points_current <= hit_points_maximum AND hit_points_current >= 0)
);

-- Campaign membership tracking
CREATE TABLE IF NOT EXISTS campaigns_membership (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns_campaign(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters_character(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(campaign_id, user_id)
);

-- Campaign invitations
CREATE TABLE IF NOT EXISTS campaigns_invitation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns_campaign(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    invitee_email VARCHAR(254) NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE
);

-- Initiative tracking for combat
CREATE TABLE IF NOT EXISTS combat_initiativetracker (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns_campaign(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    round_number INTEGER DEFAULT 1,
    active_participant_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Combat participants
CREATE TABLE IF NOT EXISTS combat_participant (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiative_tracker_id UUID NOT NULL REFERENCES combat_initiativetracker(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters_character(id) ON DELETE CASCADE,
    npc_name VARCHAR(100),
    initiative_value INTEGER NOT NULL,
    hit_points_current INTEGER NOT NULL,
    hit_points_maximum INTEGER NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    display_name VARCHAR(100),
    turn_order INTEGER NOT NULL,
    conditions JSONB DEFAULT '[]',
    notes TEXT,
    CHECK ((character_id IS NOT NULL) OR (npc_name IS NOT NULL))
);

-- Spell effects tracking
CREATE TABLE IF NOT EXISTS combat_spelleffect (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiative_tracker_id UUID NOT NULL REFERENCES combat_initiativetracker(id) ON DELETE CASCADE,
    caster_id UUID NOT NULL REFERENCES combat_participant(id) ON DELETE CASCADE,
    spell_name VARCHAR(100) NOT NULL,
    duration_rounds INTEGER NOT NULL,
    concentration BOOLEAN DEFAULT FALSE,
    description TEXT,
    targets JSONB DEFAULT '[]',
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Homebrew content
CREATE TABLE IF NOT EXISTS content_homebrewcontent (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    content_type content_type_enum NOT NULL,
    data JSONB NOT NULL,
    creator_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    sharing_level sharing_level_enum DEFAULT 'private',
    version INTEGER DEFAULT 1,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Specific user access for homebrew content
CREATE TABLE IF NOT EXISTS content_homebrewaccess (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    homebrew_id UUID NOT NULL REFERENCES content_homebrewcontent(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    granted_by_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(homebrew_id, user_id)
);

-- Campaign-specific homebrew content access
CREATE TABLE IF NOT EXISTS campaigns_homebrewaccess (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns_campaign(id) ON DELETE CASCADE,
    homebrew_id UUID NOT NULL REFERENCES content_homebrewcontent(id) ON DELETE CASCADE,
    enabled_by_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    enabled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, homebrew_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_characters_owner ON characters_character(owner_id);
CREATE INDEX IF NOT EXISTS idx_characters_campaign ON characters_character(campaign_id);
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters_character(name);
CREATE INDEX IF NOT EXISTS idx_characters_level ON characters_character(level);

CREATE INDEX IF NOT EXISTS idx_campaigns_dm ON campaigns_campaign(dm_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns_campaign(is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_name ON campaigns_campaign(name);

CREATE INDEX IF NOT EXISTS idx_membership_campaign ON campaigns_membership(campaign_id);
CREATE INDEX IF NOT EXISTS idx_membership_user ON campaigns_membership(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_status ON campaigns_membership(status);

CREATE INDEX IF NOT EXISTS idx_initiative_campaign ON combat_initiativetracker(campaign_id);
CREATE INDEX IF NOT EXISTS idx_initiative_active ON combat_initiativetracker(is_active);

CREATE INDEX IF NOT EXISTS idx_participants_tracker ON combat_participant(initiative_tracker_id);
CREATE INDEX IF NOT EXISTS idx_participants_character ON combat_participant(character_id);
CREATE INDEX IF NOT EXISTS idx_participants_order ON combat_participant(turn_order);

CREATE INDEX IF NOT EXISTS idx_spelleffects_tracker ON combat_spelleffect(initiative_tracker_id);
CREATE INDEX IF NOT EXISTS idx_spelleffects_caster ON combat_spelleffect(caster_id);

CREATE INDEX IF NOT EXISTS idx_species_official ON content_species(is_official);
CREATE INDEX IF NOT EXISTS idx_species_name ON content_species(name);

CREATE INDEX IF NOT EXISTS idx_classes_official ON content_characterclass(is_official);
CREATE INDEX IF NOT EXISTS idx_classes_name ON content_characterclass(name);

CREATE INDEX IF NOT EXISTS idx_equipment_type ON content_equipment(item_type);
CREATE INDEX IF NOT EXISTS idx_equipment_name ON content_equipment(name);
CREATE INDEX IF NOT EXISTS idx_equipment_official ON content_equipment(is_official);

CREATE INDEX IF NOT EXISTS idx_homebrew_creator ON content_homebrewcontent(creator_id);
CREATE INDEX IF NOT EXISTS idx_homebrew_type ON content_homebrewcontent(content_type);
CREATE INDEX IF NOT EXISTS idx_homebrew_sharing ON content_homebrewcontent(sharing_level);
CREATE INDEX IF NOT EXISTS idx_homebrew_approved ON content_homebrewcontent(is_approved);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_userprofile_updated_at BEFORE UPDATE ON users_userprofile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_species_updated_at BEFORE UPDATE ON content_species FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_characterclass_updated_at BEFORE UPDATE ON content_characterclass FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_background_updated_at BEFORE UPDATE ON content_background FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_equipment_updated_at BEFORE UPDATE ON content_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_characters_character_updated_at BEFORE UPDATE ON characters_character FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_homebrewcontent_updated_at BEFORE UPDATE ON content_homebrewcontent FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE OR REPLACE VIEW character_summary AS
SELECT 
    c.id,
    c.name,
    c.level,
    c.hit_points_current,
    c.hit_points_maximum,
    s.name as species_name,
    cl.name as class_name,
    b.name as background_name,
    camp.name as campaign_name,
    u.username as owner_name,
    c.created_at
FROM characters_character c
JOIN content_species s ON c.species_id = s.id
JOIN content_characterclass cl ON c.class_id = cl.id
JOIN content_background b ON c.background_id = b.id
LEFT JOIN campaigns_campaign camp ON c.campaign_id = camp.id
JOIN auth_user u ON c.owner_id = u.id;

CREATE OR REPLACE VIEW campaign_summary AS
SELECT 
    c.id,
    c.name,
    c.description,
    c.is_active,
    c.join_mode,
    u.username as dm_name,
    COUNT(m.id) as player_count,
    c.created_at,
    c.last_session
FROM campaigns_campaign c
JOIN auth_user u ON c.dm_id = u.id
LEFT JOIN campaigns_membership m ON c.id = m.campaign_id AND m.status = 'active'
GROUP BY c.id, u.username;

-- Comments for documentation
COMMENT ON TABLE auth_user IS 'User accounts with authentication credentials';
COMMENT ON TABLE characters_character IS 'Player characters with all D&D statistics and progression';
COMMENT ON TABLE campaigns_campaign IS 'D&D campaigns with settings and DM management';
COMMENT ON TABLE combat_initiativetracker IS 'Combat encounters with turn tracking';
COMMENT ON TABLE content_homebrewcontent IS 'User-generated content with sharing permissions';
COMMENT ON COLUMN characters_character.ability_scores IS 'JSON object with six ability scores: strength, dexterity, constitution, intelligence, wisdom, charisma';
COMMENT ON COLUMN characters_character.equipment IS 'JSON array of equipment items with quantities';
COMMENT ON COLUMN characters_character.spells IS 'JSON object with known spells organized by level';
COMMENT ON COLUMN campaigns_campaign.settings IS 'JSON object with custom house rules and campaign-specific settings';