# Database Schema - Flashcards AI

## 1. Tables

### 1.1 `public.profiles`
User preferences and settings linked to Supabase auth.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PRIMARY KEY`, `REFERENCES auth.users(id) ON DELETE CASCADE` | User identifier |
| `language_preference` | `TEXT` | `NOT NULL`, `DEFAULT 'en'`, `CHECK (language_preference IN ('en', 'pl'))` | UI language preference |
| `is_demo_deck_loaded` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Whether demo deck has been initialized |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Profile creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Last update timestamp |

**Indexes:**
- Primary key index on `id` (automatic)

---

### 1.2 `public.flashcards`
Core flashcard storage supporting both manual and AI-generated cards.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique card identifier |
| `user_id` | `UUID` | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Card owner |
| `front` | `TEXT` | `NOT NULL`, `CHECK (length(front) > 0 AND length(front) <= 2000)` | Question/front side |
| `back` | `TEXT` | `NOT NULL`, `CHECK (length(back) > 0 AND length(back) <= 2000)` | Answer/back side |
| `tags` | `TEXT[]` | `NOT NULL`, `DEFAULT '{}'` | Flat tag array with emoji support |
| `status` | `TEXT` | `NOT NULL`, `DEFAULT 'review'`, `CHECK (status IN ('review', 'active', 'archived'))` | Card workflow state |
| `source` | `TEXT` | `NOT NULL`, `CHECK (source IN ('manual', 'ai'))` | Creation method |
| `study_weight` | `FLOAT` | `NOT NULL`, `DEFAULT 1.0`, `CHECK (study_weight > 0)` | Weight for study algorithm |
| `generation_id` | `UUID` | `REFERENCES public.ai_generation_logs(id) ON DELETE SET NULL` | Link to AI generation batch |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Last modification timestamp |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | Soft delete timestamp (30-day retention) |

**Indexes:**
- Primary key index on `id` (automatic)
- `idx_flashcards_study` on `(user_id, status, study_weight)` - Optimizes study session queries
- `idx_flashcards_list` on `(user_id, created_at DESC)` - Optimizes dashboard listing
- `idx_flashcards_tags` GIN index on `tags` - Fast tag-based filtering
- `idx_flashcards_deleted` on `(deleted_at)` WHERE `deleted_at IS NOT NULL` - Optimizes purge job

---

### 1.3 `public.ai_generation_logs`
Tracks AI generation requests and acceptance metrics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique log identifier |
| `user_id` | `UUID` | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` | User who requested generation |
| `input_length` | `INTEGER` | `NOT NULL`, `CHECK (input_length > 0 AND input_length <= 1800)` | Character count of input text |
| `cards_generated` | `INTEGER` | `NOT NULL`, `CHECK (cards_generated >= 0)` | Number of cards created by AI |
| `cards_accepted` | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (cards_accepted >= 0 AND cards_accepted <= cards_generated)` | Number of cards accepted by user |
| `cards_rejected` | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (cards_rejected >= 0)` | Number of cards rejected by user |
| `cards_refined` | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (cards_refined >= 0)` | Number of cards refined by user |
| `timestamp` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Generation request timestamp |

**Indexes:**
- Primary key index on `id` (automatic)
- `idx_ai_logs_user_time` on `(user_id, timestamp DESC)` - Analytics queries

---

### 1.4 `public.study_reviews`
Historical record of study session interactions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique review identifier |
| `card_id` | `UUID` | `NOT NULL`, `REFERENCES public.flashcards(id) ON DELETE CASCADE` | Card being reviewed |
| `user_id` | `UUID` | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` | User performing review |
| `outcome` | `TEXT` | `NOT NULL`, `CHECK (outcome IN ('correct', 'incorrect', 'skipped'))` | Review result |
| `previous_weight` | `FLOAT` | `NOT NULL`, `CHECK (previous_weight > 0)` | Weight before review |
| `new_weight` | `FLOAT` | `NOT NULL`, `CHECK (new_weight > 0)` | Weight after review |
| `reviewed_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Review timestamp |

**Indexes:**
- Primary key index on `id` (automatic)
- `idx_study_reviews_card` on `(card_id, reviewed_at DESC)` - Card history queries
- `idx_study_reviews_user` on `(user_id, reviewed_at DESC)` - User analytics

---

## 2. Relationships

### Entity Relationship Diagram

```
auth.users (1) ──────────────────── (1) public.profiles
     │
     │ (1:N)
     │
     ├─────────────────────────────── (N) public.flashcards
     │                                      │
     │                                      │ (N:1)
     │                                      │
     │ (1:N)                                └─── (1) public.ai_generation_logs
     │                                                    │
     ├─────────────────────────────────────────────────┘
     │
     │ (1:N)
     │
     └─────────────────────────────── (N) public.study_reviews
                                            │
                                            │ (N:1)
                                            │
                                            └─── (1) public.flashcards
```

### Relationship Details

1. **`auth.users` ↔ `public.profiles`** (1:1)
   - One user has exactly one profile
   - Cascade delete: Profile removed when user deleted

2. **`auth.users` ↔ `public.flashcards`** (1:N)
   - One user owns many flashcards
   - Cascade delete: All flashcards removed when user deleted

3. **`auth.users` ↔ `public.ai_generation_logs`** (1:N)
   - One user has many AI generation requests
   - Cascade delete: All logs removed when user deleted

4. **`auth.users` ↔ `public.study_reviews`** (1:N)
   - One user has many study reviews
   - Cascade delete: All reviews removed when user deleted

5. **`public.flashcards` ↔ `public.ai_generation_logs`** (N:1, optional)
   - Many flashcards can belong to one generation batch
   - Set null on delete: If log deleted, cards remain but lose generation link

6. **`public.flashcards` ↔ `public.study_reviews`** (1:N)
   - One flashcard has many review records
   - Cascade delete: All reviews removed when card deleted

---

## 3. Indexes

### Performance Optimization Strategy

| Index Name | Table | Columns | Type | Purpose |
|------------|-------|---------|------|---------|
| `idx_flashcards_study` | `flashcards` | `(user_id, status, study_weight)` | B-tree | Study session card selection |
| `idx_flashcards_list` | `flashcards` | `(user_id, created_at DESC)` | B-tree | Dashboard card listing |
| `idx_flashcards_tags` | `flashcards` | `tags` | GIN | Tag-based filtering |
| `idx_flashcards_deleted` | `flashcards` | `deleted_at` (partial) | B-tree | Purge job efficiency |
| `idx_ai_logs_user_time` | `ai_generation_logs` | `(user_id, timestamp DESC)` | B-tree | Analytics queries |
| `idx_study_reviews_card` | `study_reviews` | `(card_id, reviewed_at DESC)` | B-tree | Card history |
| `idx_study_reviews_user` | `study_reviews` | `(user_id, reviewed_at DESC)` | B-tree | User study analytics |

---

## 4. Row-Level Security (RLS) Policies

All tables enforce strict multi-tenant isolation using Supabase RLS.

### 4.1 `public.profiles`

**Enable RLS:**
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

**Policies:**

1. **`profiles_select_own`** (SELECT)
   - Users can view their own profile
   - `auth.uid() = id`

2. **`profiles_insert_own`** (INSERT)
   - Users can create their own profile
   - `auth.uid() = id`

3. **`profiles_update_own`** (UPDATE)
   - Users can update their own profile
   - `auth.uid() = id`

4. **`profiles_delete_own`** (DELETE)
   - Users can delete their own profile
   - `auth.uid() = id`

---

### 4.2 `public.flashcards`

**Enable RLS:**
```sql
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
```

**Policies:**

1. **`flashcards_select_own`** (SELECT)
   - Users can view their own flashcards
   - `auth.uid() = user_id`

2. **`flashcards_insert_own`** (INSERT)
   - Users can create flashcards for themselves
   - `auth.uid() = user_id`

3. **`flashcards_update_own`** (UPDATE)
   - Users can update their own flashcards
   - `auth.uid() = user_id`

4. **`flashcards_delete_own`** (DELETE)
   - Users can delete their own flashcards
   - `auth.uid() = user_id`

---

### 4.3 `public.ai_generation_logs`

**Enable RLS:**
```sql
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;
```

**Policies:**

1. **`ai_logs_select_own`** (SELECT)
   - Users can view their own generation logs
   - `auth.uid() = user_id`

2. **`ai_logs_insert_own`** (INSERT)
   - Users can create their own generation logs
   - `auth.uid() = user_id`

3. **`ai_logs_update_own`** (UPDATE)
   - Users can update their own generation logs
   - `auth.uid() = user_id`

---

### 4.4 `public.study_reviews`

**Enable RLS:**
```sql
ALTER TABLE public.study_reviews ENABLE ROW LEVEL SECURITY;
```

**Policies:**

1. **`study_reviews_select_own`** (SELECT)
   - Users can view their own study reviews
   - `auth.uid() = user_id`

2. **`study_reviews_insert_own`** (INSERT)
   - Users can create their own study reviews
   - `auth.uid() = user_id`

---

## 5. Database Functions & Triggers

### 5.1 Demo Deck Initialization

**Function: `create_demo_deck_for_new_user()`**

Automatically creates a demo deck when a new user signs up.

```sql
CREATE OR REPLACE FUNCTION public.create_demo_deck_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, language_preference, is_demo_deck_loaded)
  VALUES (NEW.id, 'en', true);
  
  -- Insert demo flashcards
  INSERT INTO public.flashcards (user_id, front, back, tags, status, source, study_weight)
  VALUES
    (NEW.id, 'What is spaced repetition?', 'A learning technique that involves reviewing information at increasing intervals to improve long-term retention.', ARRAY['📚', 'learning'], 'active', 'manual', 1.0),
    (NEW.id, 'How do flashcards help learning?', 'They promote active recall, which strengthens memory connections and improves retention.', ARRAY['📚', 'memory'], 'active', 'manual', 1.0),
    (NEW.id, 'What is the benefit of AI-generated flashcards?', 'They save time by automatically creating high-quality study materials from text.', ARRAY['🤖', 'ai'], 'active', 'manual', 1.0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Trigger: `on_auth_user_created`**

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_demo_deck_for_new_user();
```

---

### 5.2 Updated Timestamp Maintenance

**Function: `update_updated_at_column()`**

Automatically updates the `updated_at` timestamp on row modification.

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Triggers:**

```sql
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at
  BEFORE UPDATE ON public.flashcards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

---

### 5.3 Soft Delete Purge Job

**Function: `purge_old_deleted_flashcards()`**

Permanently deletes flashcards that have been soft-deleted for more than 30 days.

```sql
CREATE OR REPLACE FUNCTION public.purge_old_deleted_flashcards()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.flashcards
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Scheduled Execution:**

This function should be scheduled to run daily using pg_cron or a Supabase Edge Function:

```sql
-- Using pg_cron (if available)
SELECT cron.schedule(
  'purge-deleted-flashcards',
  '0 2 * * *', -- Daily at 2 AM
  'SELECT public.purge_old_deleted_flashcards();'
);
```

---

## 6. Database Views

### 6.1 `view_flashcards_export`

Simplified view for data export functionality (CSV/JSON).

```sql
CREATE OR REPLACE VIEW public.view_flashcards_export AS
SELECT
  f.id,
  f.user_id,
  f.front,
  f.back,
  f.tags,
  f.source,
  f.created_at,
  f.updated_at
FROM public.flashcards f
WHERE f.status = 'active'
  AND f.deleted_at IS NULL;
```

**RLS Policy for View:**

```sql
ALTER VIEW public.view_flashcards_export SET (security_invoker = true);
```

---

## 7. Design Decisions & Notes

### 7.1 Multi-Tenancy & Security

- **RLS Enforcement:** All tables use `user_id = auth.uid()` policies to ensure complete data isolation
- **Cascade Deletes:** `ON DELETE CASCADE` ensures GDPR compliance with immediate data purge on account deletion
- **Security Definer Functions:** Demo deck creation uses `SECURITY DEFINER` to bypass RLS during initialization

### 7.2 Soft Delete Implementation

- **30-Day Retention:** `deleted_at` timestamp enables recovery window
- **Immediate Exclusion:** Application queries filter `WHERE deleted_at IS NULL`
- **Scheduled Purge:** Daily cron job permanently removes expired cards
- **Index Optimization:** Partial index on `deleted_at` improves purge job performance

### 7.3 Study Algorithm Support

- **Weight Storage:** `study_weight` column enables weighted random selection
- **History Tracking:** `study_reviews` table maintains complete audit trail
- **Weight Evolution:** `previous_weight` and `new_weight` columns track algorithm adjustments

### 7.4 AI Analytics

- **Generation Tracking:** `ai_generation_logs` table captures batch-level metrics
- **Card Linking:** `generation_id` foreign key enables per-card attribution
- **Acceptance Metrics:** Counters for accepted/rejected/refined cards support KPI calculation
- **Null Safety:** `ON DELETE SET NULL` preserves cards if logs are purged

### 7.5 Tagging System

- **Array Storage:** `text[]` type provides native PostgreSQL array support
- **Unicode Support:** Full emoji support without encoding issues
- **GIN Index:** Enables fast tag-based queries using `@>` operator
- **Flat Structure:** No join table needed, simplifying queries and improving performance

### 7.6 Data Validation

- **Length Constraints:** `CHECK` constraints enforce 1-2000 character limits on card content
- **Enum Validation:** Status, source, and outcome fields use `CHECK IN` constraints
- **Weight Bounds:** `study_weight > 0` ensures algorithm stability
- **Input Limits:** `input_length <= 1800` enforces PRD requirement

### 7.7 Timestamp Strategy

- **TIMESTAMPTZ:** All timestamps use timezone-aware type for global compatibility
- **Automatic Tracking:** Triggers maintain `updated_at` columns
- **Audit Trail:** Creation and modification times tracked on all entities

### 7.8 Performance Considerations

- **Composite Indexes:** `(user_id, status, study_weight)` optimizes study session queries
- **Partial Indexes:** `deleted_at IS NOT NULL` reduces index size for purge operations
- **GIN Indexes:** Tag array indexing enables fast filtering without full scans
- **View Optimization:** Export view pre-filters active cards to reduce query complexity

### 7.9 Scalability Notes

- **Index Strategy:** All foreign keys and common query patterns are indexed
- **Normalization:** Schema follows 3NF with denormalization only for `study_weight` (performance)
- **Analytics Separation:** High-volume `study_reviews` table isolated from core `flashcards` table
- **Batch Operations:** `generation_id` enables efficient batch processing

### 7.10 Future Considerations

- **Algorithm Configuration:** Current schema stores weights but not algorithm parameters (e.g., decay rates)
- **Partitioning:** `study_reviews` table may benefit from time-based partitioning at scale
- **Archival:** Long-term analytics may require separate data warehouse for historical `study_reviews`
- **Caching:** Frequently accessed cards could benefit from application-level caching layer

---

## 8. Migration Checklist

When implementing this schema, execute in the following order:

1. ✅ Create `public.profiles` table
2. ✅ Create `public.ai_generation_logs` table
3. ✅ Create `public.flashcards` table (depends on ai_generation_logs)
4. ✅ Create `public.study_reviews` table (depends on flashcards)
5. ✅ Create all indexes
6. ✅ Enable RLS on all tables
7. ✅ Create RLS policies for all tables
8. ✅ Create `update_updated_at_column()` function
9. ✅ Create triggers for `updated_at` maintenance
10. ✅ Create `create_demo_deck_for_new_user()` function
11. ✅ Create `on_auth_user_created` trigger
12. ✅ Create `purge_old_deleted_flashcards()` function
13. ✅ Schedule purge job (pg_cron or Edge Function)
14. ✅ Create `view_flashcards_export` view
15. ✅ Test all RLS policies with different user contexts
16. ✅ Verify cascade deletes work correctly
17. ✅ Test demo deck creation on new user signup

---

## 9. Sample Queries

### 9.1 Fetch Cards for Study Session

```sql
SELECT id, front, back, study_weight
FROM public.flashcards
WHERE user_id = auth.uid()
  AND status = 'active'
  AND deleted_at IS NULL
ORDER BY random() * study_weight DESC
LIMIT 20;
```

### 9.2 Calculate AI Acceptance Rate

```sql
SELECT
  user_id,
  SUM(cards_accepted)::FLOAT / NULLIF(SUM(cards_generated), 0) * 100 AS acceptance_rate
FROM public.ai_generation_logs
WHERE user_id = auth.uid()
GROUP BY user_id;
```

### 9.3 Filter Cards by Tag

```sql
SELECT id, front, back, tags
FROM public.flashcards
WHERE user_id = auth.uid()
  AND status = 'active'
  AND deleted_at IS NULL
  AND tags @> ARRAY['📚']
ORDER BY created_at DESC;
```

### 9.4 Export Active Cards

```sql
SELECT *
FROM public.view_flashcards_export
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### 9.5 Get Cards Pending Purge

```sql
SELECT id, front, deleted_at
FROM public.flashcards
WHERE user_id = auth.uid()
  AND deleted_at IS NOT NULL
  AND deleted_at > NOW() - INTERVAL '30 days'
ORDER BY deleted_at DESC;
```
