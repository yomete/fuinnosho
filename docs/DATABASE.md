# Database Schema

Fuinnosho uses PostgreSQL via Supabase with Row Level Security (RLS) enabled on all tables.

## Entity Relationship Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   films     │────<│ trip_films  │>────│   trips     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │            ┌─────────────┐            │
       └───────────<│ trip_gear   │>───────────┘
                    └─────────────┘
                           │
                    ┌─────────────┐
                    │    gear     │
                    └─────────────┘

┌─────────────────────┐     ┌──────────────────────┐
│ chemistry_inventory │────<│  development_recipes │
└─────────────────────┘     └──────────────────────┘
           │
           │     ┌──────────────────────────┐
           └────<│ session_chemistry_usage  │
                 └──────────────────────────┘
                            │
                 ┌──────────────────────┐
                 │ development_sessions │
                 └──────────────────────┘
                            │
                 ┌──────────────────────┐
                 │    session_films     │>──── films
                 └──────────────────────┘
```

## Core Tables

### films

Stores film inventory with support for both regular rolls and bulk film.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner (foreign key to auth.users) |
| name | VARCHAR | Film name (e.g., "Portra 400") |
| brand | VARCHAR | Manufacturer (e.g., "Kodak") |
| iso | INTEGER | Film speed |
| format | VARCHAR | 35mm, 120, 4x5 |
| type | VARCHAR | color_negative, black_white, slide |
| count | INTEGER | Number of rolls |
| price | DECIMAL | Cost per roll |
| expiration_date | DATE | Expiry date |
| notes | TEXT | General notes |
| editing_notes | TEXT | Post-processing notes |
| is_ecn | BOOLEAN | ECN-2 process film |
| is_bulk_film | BOOLEAN | Bulk film flag |
| bulk_length_meters | DECIMAL | Total bulk length |
| bulk_rolls_used | INTEGER | Rolls consumed from bulk |
| spooled_cassettes | INTEGER | Ready-to-use cassettes |
| deleted_at | TIMESTAMP | Soft delete timestamp |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last modification |

### film_usage

Tracks film consumption and spooling activities.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| film_id | UUID | Foreign key to films |
| quantity | INTEGER | Amount used |
| usage_type | VARCHAR | spool, shoot, add |
| usage_note | TEXT | Description |
| exposures_used | INTEGER | For bulk film |
| trip_id | UUID | Associated trip |
| created_at | TIMESTAMP | When logged |

### gear

Equipment inventory.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner |
| name | VARCHAR | Gear name |
| brand | VARCHAR | Manufacturer |
| type | VARCHAR | camera, lens, flash, accessory, tripod, filter, bag |
| model | VARCHAR | Model number |
| serial_number | VARCHAR | Serial number |
| purchase_date | DATE | When purchased |
| purchase_price | DECIMAL | Cost |
| condition | VARCHAR | excellent, good, fair, poor |
| notes | TEXT | Additional info |
| camera_id | UUID | For lenses: linked camera |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last modification |

### trips

Photo trip planning.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner |
| title | VARCHAR | Trip name |
| description | TEXT | Trip details |
| start_date | DATE | Start date |
| end_date | DATE | End date |
| status | VARCHAR | upcoming, ongoing, completed, past |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last modification |

### trip_films

Many-to-many: films reserved for trips.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| trip_id | UUID | Foreign key to trips |
| film_id | UUID | Foreign key to films |
| quantity | INTEGER | Rolls reserved |
| created_at | TIMESTAMP | Record creation |

### trip_gear

Many-to-many: gear packed for trips.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| trip_id | UUID | Foreign key to trips |
| gear_id | UUID | Foreign key to gear |
| created_at | TIMESTAMP | Record creation |

## Chemistry & Development Tables

### chemistry_inventory

Chemistry products for film development.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner |
| name | TEXT | Product name |
| brand | TEXT | Manufacturer |
| chemistry_type | TEXT | developer, stop_bath, fixer, bleach, hypo_clear, wetting_agent, pre_wash, other |
| process_type | TEXT | black_white, color |
| volume_ml | DECIMAL | Current volume |
| original_volume_ml | DECIMAL | Initial volume |
| purchase_date | DATE | When purchased |
| expiry_date | DATE | Expiration |
| opened_date | DATE | When opened |
| cost | DECIMAL | Price paid |
| storage_location | TEXT | Where stored |
| notes | TEXT | Additional info |
| max_reuses | INTEGER | Maximum reuse count |
| times_used | INTEGER | Current use count |
| total_volume_processed_ml | DECIMAL | Film volume processed |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last modification |

### development_recipes

Reusable development recipes.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner |
| name | TEXT | Recipe name |
| film_type | TEXT | Compatible film |
| developer_id | UUID | Foreign key to chemistry_inventory |
| dilution_ratio | TEXT | e.g., "1+50", "1:1" |
| temperature_celsius | DECIMAL | Dev temperature |
| development_time_minutes | DECIMAL | Dev time |
| agitation_pattern | TEXT | Agitation instructions |
| notes | TEXT | Additional info |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last modification |

### development_sessions

Individual development sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner |
| session_date | DATE | When developed |
| process_type | TEXT | black_white, color |
| temperature_celsius | DECIMAL | Session temperature |
| notes | TEXT | Session notes |
| total_cost | DECIMAL | Calculated cost |
| created_at | TIMESTAMP | Record creation |

### session_films

Many-to-many: films developed in a session.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | UUID | Foreign key to development_sessions |
| film_id | UUID | Foreign key to films |
| created_at | TIMESTAMP | Record creation |

### session_chemistry_usage

Chemistry used in a development session.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | UUID | Foreign key to development_sessions |
| chemistry_id | UUID | Foreign key to chemistry_inventory |
| volume_used_ml | DECIMAL | Amount used |
| dilution_ratio | TEXT | Dilution used |
| development_time_minutes | DECIMAL | Time used |
| notes | TEXT | Additional info |
| created_at | TIMESTAMP | Record creation |

## Row Level Security

All tables have RLS enabled. Users can only access their own data via the `user_id` column which is checked against `auth.uid()`.

Example policy:
```sql
CREATE POLICY "Users can view their own films" ON films
    FOR SELECT USING (auth.uid() = user_id);
```

## Views

### films_with_availability

A view that calculates available film count by subtracting reserved quantities from total count.

## Migrations

Migrations are in `supabase/migrations/` and should be run in order. Key migrations:

- `000_create_base_schema.sql` - Base tables
- `002_add_trips_and_trip_films.sql` - Trip planning
- `003_add_gear_and_trip_gear.sql` - Gear management
- `012_bulk_film_spooling_support.sql` - Bulk film support
- `015_add_soft_delete_to_films.sql` - Soft delete
- `023_add_chemistry_and_development.sql` - Chemistry tracking
