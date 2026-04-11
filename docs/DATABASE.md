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

Migrations are in `supabase/migrations/`. The current consolidated schema lives in `001_initial_schema.sql`.
