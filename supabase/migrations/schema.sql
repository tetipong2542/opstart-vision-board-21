-- Database Schema Documentation
-- Generated on: 2024

-- List of Schemas and their sizes
-- 1. auth schema (16 tables, 664 kB)
-- 2. storage schema (5 tables, 144 kB)
-- 3. realtime schema (3 tables, 56 kB)
-- 4. vault schema (1 table, 24 kB)
-- 5. extensions schema (0 tables)
-- 6. graphql schema (0 tables)
-- 7. graphql_public schema (0 tables)
-- 8. public schema (0 tables)

-- Note: These are system schemas managed by Supabase. 
-- The 'public' schema is empty and available for your application's tables.

-- =============================================
-- Schema: auth
-- Description: Authentication and Authorization
-- =============================================
-- Table: users (98 KB)
--   Description: Stores user login data within a secure schema
--   Columns: 35, Indexes: 11

-- Table: one_time_tokens (90 KB)
--   Columns: 7, Indexes: 4

-- Table: refresh_tokens (65 KB)
--   Description: Store of tokens used to refresh JWT tokens once they expire
--   Columns: 9, Indexes: 7

-- Table: mfa_factors (57 KB)
--   Description: Stores metadata about factors
--   Columns: 12, Indexes: 6

-- Table: saml_relay_states (40 KB)
--   Description: Contains SAML Relay State information
--   Columns: 8, Indexes: 4

-- Table: sessions (40 KB)
--   Description: Stores session data associated to a user
--   Columns: 11, Indexes: 4

-- Table: identities (40 KB)
--   Description: Stores identities associated to a user
--   Columns: 9, Indexes: 4

-- And 9 more tables...

-- =============================================
-- Schema: storage
-- Description: File Storage System
-- =============================================
-- Table: migrations (40 KB)
--   Columns: 4, Indexes: 2
--   Rows: 26

-- Table: objects (40 KB)
--   Columns: 12, Indexes: 4

-- Table: buckets (24 KB)
--   Columns: 10, Indexes: 2

-- Table: s3_multipart_uploads (24 KB)
--   Columns: 9, Indexes: 2

-- Table: s3_multipart_uploads_parts (16 KB)
--   Columns: 10, Indexes: 1

-- =============================================
-- Schema: realtime
-- Description: Real-time Subscriptions
-- =============================================
-- Table: subscription (32 KB)
--   Columns: 7, Indexes: 3

-- Table: schema_migrations (24 KB)
--   Columns: 2, Indexes: 1
--   Rows: 60

-- Table: messages (0 KB)
--   Columns: 8, Indexes: 1

-- =============================================
-- Schema: vault
-- Description: Secure Data Storage
-- =============================================
-- Table: secrets (24 KB)
--   Description: Table for storing sensitive information
--   Columns: 8, Indexes: 2

-- View: decrypted_secrets
--   Columns: 9

-- =============================================
-- Schema: public
-- Description: Application Data (Empty)
-- =============================================
-- No tables currently exist in the public schema.
-- This schema is available for your application's custom tables.

-- Note: This schema represents the current state of the Supabase database.
-- The public schema is empty and ready for your application's tables.
-- Other schemas contain system tables managed by Supabase services. 

-- =============================================
-- แบบแผนฐานข้อมูลสำหรับแอปสร้างกำลังใจ
-- =============================================

/**
 * ตารางสำหรับระบบแอปสร้างกำลังใจใน Schema: public
 * รายละเอียดตาราง:
 * 1. contributors - ผู้ร่วมสร้างกำลังใจ
 * 2. words - คำ
 * 3. templates - แม่แบบประโยคกำลังใจ
 * 4. emotions - ความรู้สึกแม่แบบ
 * 5. contributor_rankings - อันดับผู้ร่วมสร้างกำลังใจ
 * 6. statistics - สถิติทั้งหมด
 * 7. sentences - ประโยคทั้งหมด
 */

-- ตารางเก็บข้อมูลผู้ร่วมสร้างกำลังใจ
CREATE TABLE public.contributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    total_contributions INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- สร้างดัชนีสำหรับค้นหารายชื่อผู้ร่วมสร้างกำลังใจ
CREATE INDEX contributors_name_idx ON public.contributors(name);
CREATE INDEX contributors_total_contributions_idx ON public.contributors(total_contributions DESC);

COMMENT ON TABLE public.contributors IS 'ผู้ร่วมสร้างกำลังใจในระบบ';

-- ตารางความรู้สึกแม่แบบ
CREATE TABLE public.emotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE public.emotions IS 'ความรู้สึกแม่แบบสำหรับประโยคกำลังใจ';

-- ตารางคำ
CREATE TABLE public.words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word VARCHAR(100) NOT NULL,
    meaning TEXT,
    contributor_id UUID REFERENCES public.contributors(id) ON DELETE SET NULL,
    emotion_id UUID REFERENCES public.emotions(id) ON DELETE SET NULL,
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- สร้างดัชนีสำหรับการค้นหาคำ
CREATE INDEX words_word_idx ON public.words(word);
CREATE INDEX words_emotion_id_idx ON public.words(emotion_id);
CREATE INDEX words_contributor_id_idx ON public.words(contributor_id);

COMMENT ON TABLE public.words IS 'คำสำหรับใช้ในการสร้างประโยคกำลังใจ';

-- ตารางแม่แบบประโยค
CREATE TABLE public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_text TEXT NOT NULL,
    placeholders JSONB,
    contributor_id UUID REFERENCES public.contributors(id) ON DELETE SET NULL,
    emotion_id UUID REFERENCES public.emotions(id) ON DELETE SET NULL,
    approved BOOLEAN DEFAULT false,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX templates_emotion_id_idx ON public.templates(emotion_id);
CREATE INDEX templates_contributor_id_idx ON public.templates(contributor_id);
CREATE INDEX templates_usage_count_idx ON public.templates(usage_count DESC);

COMMENT ON TABLE public.templates IS 'แม่แบบประโยคกำลังใจ';

-- ตารางอันดับผู้ร่วมสร้างกำลังใจ
CREATE TABLE public.contributor_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contributor_id UUID REFERENCES public.contributors(id) ON DELETE CASCADE,
    rank_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'all_time'
    score INT DEFAULT 0,
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX contributor_rankings_type_score_idx ON public.contributor_rankings(rank_type, score DESC);
CREATE INDEX contributor_rankings_contributor_id_idx ON public.contributor_rankings(contributor_id);

COMMENT ON TABLE public.contributor_rankings IS 'อันดับและคะแนนของผู้ร่วมสร้างกำลังใจตามช่วงเวลา';

-- ตารางประโยคทั้งหมด
CREATE TABLE public.sentences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sentence_text TEXT NOT NULL,
    template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
    emotion_id UUID REFERENCES public.emotions(id) ON DELETE SET NULL,
    creator_id UUID REFERENCES public.contributors(id) ON DELETE SET NULL,
    likes_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX sentences_emotion_id_idx ON public.sentences(emotion_id);
CREATE INDEX sentences_template_id_idx ON public.sentences(template_id);
CREATE INDEX sentences_creator_id_idx ON public.sentences(creator_id);
CREATE INDEX sentences_likes_count_idx ON public.sentences(likes_count DESC);
CREATE INDEX sentences_created_at_idx ON public.sentences(created_at DESC);

COMMENT ON TABLE public.sentences IS 'ประโยคกำลังใจทั้งหมดที่สร้างในระบบ';

-- ตารางสถิติ
CREATE TABLE public.statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stat_type VARCHAR(100) NOT NULL,
    stat_value JSONB NOT NULL,
    period VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'all_time'
    date_recorded DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX statistics_stat_type_period_idx ON public.statistics(stat_type, period);
CREATE INDEX statistics_date_recorded_idx ON public.statistics(date_recorded DESC);

COMMENT ON TABLE public.statistics IS 'สถิติต่างๆของระบบ';

-- เพิ่ม RLS (Row Level Security) พื้นฐาน
ALTER TABLE public.contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributor_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;

-- สร้างพื้นฐาน Policies
CREATE POLICY "Contributors are viewable by everyone" 
ON public.contributors FOR SELECT USING (true);

CREATE POLICY "Words are viewable by everyone" 
ON public.words FOR SELECT USING (approved = true);

CREATE POLICY "Templates are viewable by everyone" 
ON public.templates FOR SELECT USING (approved = true);

CREATE POLICY "Emotions are viewable by everyone" 
ON public.emotions FOR SELECT USING (true);

CREATE POLICY "Rankings are viewable by everyone" 
ON public.contributor_rankings FOR SELECT USING (true);

CREATE POLICY "Sentences are viewable by everyone" 
ON public.sentences FOR SELECT USING (true);

-- สร้าง Trigger Functions สำหรับการอัพเดตเวลา
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- เพิ่ม Triggers สำหรับการอัพเดตเวลา
CREATE TRIGGER update_contributors_updated_at
BEFORE UPDATE ON public.contributors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_words_updated_at
BEFORE UPDATE ON public.words
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contributor_rankings_updated_at
BEFORE UPDATE ON public.contributor_rankings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_statistics_updated_at
BEFORE UPDATE ON public.statistics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


