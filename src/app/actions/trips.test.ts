import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-1234'),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock the reduceFilmCount function
vi.mock('./films', () => ({
  reduceFilmCount: vi.fn(),
}))

// Helper to create a chainable mock that properly awaits
function createChainableMock() {
  // Create a base object that chains back to itself
  const chain: Record<string, unknown> = {}

  const chainMethods = ['from', 'select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'isNull', 'gte', 'lte', 'lt', 'like', 'order']

  chainMethods.forEach(method => {
    chain[method] = vi.fn().mockImplementation(() => chain)
  })

  // Terminal methods that return promises
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null })
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })

  // Make chain awaitable by default (returns { error: null })
  // This is needed for chains like from().delete().eq().eq() which are awaited directly
  Object.defineProperty(chain, 'then', {
    value: (resolve: (value: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve),
    writable: true,
    configurable: true,
  })

  return chain as Record<string, ReturnType<typeof vi.fn>> & { then: (resolve: (value: unknown) => unknown) => Promise<unknown> }
}

// Mock Supabase client - will be reset in beforeEach
let mockSupabase: ReturnType<typeof createChainableMock> & { auth: { getUser: ReturnType<typeof vi.fn> } }

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

// Import after mocks are set up
import {
  createTrip,
  editTrip,
  getTrips,
  getTripById,
  deleteTrip,
  addFilmToTrip,
  removeFilmFromTrip,
  updateFilmQuantityInTrip,
  updateTripStatus,
  getTripWithFilms,
  getFilmsWithAvailability,
  addGearToTrip,
  removeGearFromTrip,
  getTripWithGear,
  getAvailableGear,
  consumePastTripFilms,
} from './trips'
import { reduceFilmCount } from './films'

describe('Trip Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Create fresh chainable mock for each test
    mockSupabase = {
      ...createChainableMock(),
      auth: {
        getUser: vi.fn(),
      },
    } as ReturnType<typeof createChainableMock> & { auth: { getUser: ReturnType<typeof vi.fn> } }
  })

  describe('createTrip', () => {
    const validTripData = {
      title: 'Summer Road Trip',
      description: 'Photography trip through California',
      start_date: '2024-07-01',
      end_date: '2024-07-15',
    }

    it('should create a trip successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      ;(mockSupabase.insert as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null })

      const result = await createTrip(validTripData)

      expect(result.success).toBe(true)
      expect(result.trip).toBeDefined()
      expect(result.trip?.id).toBe('test-uuid-1234')
      expect(result.trip?.title).toBe('Summer Road Trip')
      expect(result.trip?.status).toBe('upcoming')
      expect(result.trip?.user_id).toBe('user-123')
      expect(mockSupabase.from).toHaveBeenCalledWith('trips')
    })

    it('should reject when end date is before start date', async () => {
      const invalidData = {
        ...validTripData,
        start_date: '2024-07-15',
        end_date: '2024-07-01',
      }

      const result = await createTrip(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('End date must be on or after start date')
    })

    it('should allow same start and end date (single day trip)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      ;(mockSupabase.insert as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null })

      const sameDayTrip = {
        ...validTripData,
        start_date: '2024-07-01',
        end_date: '2024-07-01',
      }

      const result = await createTrip(sameDayTrip)

      expect(result.success).toBe(true)
    })

    it('should fail when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await createTrip(validTripData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not authenticated')
    })

    it('should handle database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      ;(mockSupabase.insert as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: { message: 'Database connection failed' },
      })

      const result = await createTrip(validTripData)

      expect(result.success).toBe(false)
    })

    it('should validate required fields', async () => {
      const incompleteData = {
        title: '',
        description: 'Some description',
        start_date: '2024-07-01',
        end_date: '2024-07-15',
      }

      const result = await createTrip(incompleteData)

      expect(result.success).toBe(false)
    })
  })

  describe('editTrip', () => {
    const tripId = 'trip-123'
    const updateData = {
      title: 'Updated Trip Title',
      description: 'Updated description',
      start_date: '2024-08-01',
      end_date: '2024-08-10',
    }

    it('should update trip successfully', async () => {
      const updatedTrip = { id: tripId, ...updateData, status: 'upcoming' }
      ;(mockSupabase.eq as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ error: null })
      ;(mockSupabase.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data: updatedTrip, error: null })

      const result = await editTrip(tripId, updateData)

      expect(result.success).toBe(true)
      expect(result.trip).toEqual(updatedTrip)
      expect(mockSupabase.from).toHaveBeenCalledWith('trips')
    })

    it('should reject invalid date range on edit', async () => {
      const invalidData = {
        ...updateData,
        start_date: '2024-08-10',
        end_date: '2024-08-01',
      }

      const result = await editTrip(tripId, invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('End date must be on or after start date')
    })

    it('should handle update errors', async () => {
      ;(mockSupabase.eq as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        error: { message: 'Update failed' },
      })

      const result = await editTrip(tripId, updateData)

      expect(result.success).toBe(false)
    })
  })

  describe('getTrips', () => {
    it('should fetch trips and calculate reserved film counts', async () => {
      const mockTrips = [
        {
          id: 'trip-1',
          title: 'Trip 1',
          start_date: '2023-01-01',
          end_date: '2023-01-10',
          status: 'completed',
          trip_films: [{ quantity: 3 }, { quantity: 2 }],
        },
        {
          id: 'trip-2',
          title: 'Trip 2',
          start_date: '2023-02-01',
          end_date: '2023-02-10',
          status: 'completed',
          trip_films: [{ quantity: 5 }],
        },
      ]
      ;(mockSupabase.order as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockTrips, error: null })

      const result = await getTrips()

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0].reserved_film_count).toBe(5) // 3 + 2
      expect(result.data?.[1].reserved_film_count).toBe(5)
    })

    it('should auto-calculate status based on dates for non-completed trips', async () => {
      // Create dates with explicit UTC to avoid timezone issues
      const today = new Date()
      today.setHours(12, 0, 0, 0) // Set to noon to avoid edge cases

      const pastDate = new Date(today)
      pastDate.setFullYear(pastDate.getFullYear() - 1)

      const futureDate = new Date(today)
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      const mockTrips = [
        {
          id: 'trip-1',
          title: 'Past Trip',
          start_date: '2023-01-01',
          end_date: '2023-01-10',
          status: 'upcoming', // Will be recalculated
          trip_films: [],
        },
        {
          id: 'trip-2',
          title: 'Completed Trip',
          start_date: '2023-06-01',
          end_date: '2023-06-10',
          status: 'completed', // Should stay completed
          trip_films: [],
        },
      ]
      ;(mockSupabase.order as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockTrips, error: null })

      const result = await getTrips()

      expect(result.data).toBeDefined()
      // Past trip should be recalculated to 'past'
      expect(result.data?.[0].status).toBe('past')
      // Completed trip should remain completed
      expect(result.data?.[1].status).toBe('completed')
    })

    it('should handle database errors', async () => {
      ;(mockSupabase.order as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      })

      const result = await getTrips()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })

    it('should handle empty trip list', async () => {
      ;(mockSupabase.order as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], error: null })

      const result = await getTrips()

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })
  })

  describe('getTripById', () => {
    it('should fetch a single trip by ID', async () => {
      const mockTrip = {
        id: 'trip-123',
        title: 'Test Trip',
        description: 'A test trip',
        start_date: '2024-07-01',
        end_date: '2024-07-15',
        status: 'upcoming',
      }
      ;(mockSupabase.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockTrip, error: null })

      const result = await getTripById('trip-123')

      expect(result).toEqual(mockTrip)
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'trip-123')
    })

    it('should return null when trip not found', async () => {
      ;(mockSupabase.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      })

      const result = await getTripById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('deleteTrip', () => {
    it('should delete a trip successfully', async () => {
      // The chain is: from().delete().eq() - eq needs to resolve
      ;(mockSupabase.eq as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null })

      const result = await deleteTrip('trip-123')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Trip deleted successfully')
      expect(mockSupabase.from).toHaveBeenCalledWith('trips')
      expect(mockSupabase.delete).toHaveBeenCalled()
    })

    it('should handle deletion errors', async () => {
      ;(mockSupabase.eq as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: { message: 'Deletion failed' },
      })

      const result = await deleteTrip('trip-123')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('addFilmToTrip', () => {
    it('should add a new film to trip', async () => {
      ;(mockSupabase.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: null, error: null })
      ;(mockSupabase.insert as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null })

      const result = await addFilmToTrip('trip-123', 'film-456', 3)

      expect(result.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('trip_films')
    })

    it('should update quantity when film already exists in trip', async () => {
      const existingTripFilm = {
        trip_id: 'trip-123',
        film_id: 'film-456',
        quantity: 2,
      }
      ;(mockSupabase.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: existingTripFilm, error: null })
      // Chain: from().update().eq().eq() - counter-based mocking
      let eqCount = 0
      ;(mockSupabase.eq as ReturnType<typeof vi.fn>).mockImplementation(() => {
        eqCount++
        // First 2 eq calls are for the select check, next 2 are for update
        if (eqCount >= 4) {
          return Promise.resolve({ error: null })
        }
        return mockSupabase
      })

      const result = await addFilmToTrip('trip-123', 'film-456', 3)

      expect(result.success).toBe(true)
      expect(mockSupabase.update).toHaveBeenCalledWith({ quantity: 5 }) // 2 + 3
    })

    it('should use default quantity of 1', async () => {
      ;(mockSupabase.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: null, error: null })
      ;(mockSupabase.insert as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null })

      const result = await addFilmToTrip('trip-123', 'film-456')

      expect(result.success).toBe(true)
    })

    it('should handle errors when adding film', async () => {
      ;(mockSupabase.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: null, error: null })
      ;(mockSupabase.insert as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: { message: 'Insert failed' },
      })

      const result = await addFilmToTrip('trip-123', 'film-456', 1)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('updateFilmQuantityInTrip', () => {
    it('should update film quantity', async () => {
      // Chain: from().update().eq().eq() - last eq needs to resolve
      let eqCount = 0
      ;(mockSupabase.eq as ReturnType<typeof vi.fn>).mockImplementation(() => {
        eqCount++
        if (eqCount >= 2) {
          return Promise.resolve({ error: null })
        }
        return mockSupabase
      })

      const result = await updateFilmQuantityInTrip('trip-123', 'film-456', 5)

      expect(result.success).toBe(true)
      expect(mockSupabase.update).toHaveBeenCalledWith({ quantity: 5 })
    })

    it('should reject quantity less than 1', async () => {
      const result = await updateFilmQuantityInTrip('trip-123', 'film-456', 0)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Quantity must be at least 1')
    })

    it('should reject negative quantity', async () => {
      const result = await updateFilmQuantityInTrip('trip-123', 'film-456', -1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Quantity must be at least 1')
    })
  })

  describe('removeFilmFromTrip', () => {
    it('should remove film from trip', async () => {
      // Chain: from().delete().eq().eq() - last eq needs to resolve
      let eqCount = 0
      ;(mockSupabase.eq as ReturnType<typeof vi.fn>).mockImplementation(() => {
        eqCount++
        if (eqCount >= 2) {
          return Promise.resolve({ error: null })
        }
        return mockSupabase
      })

      const result = await removeFilmFromTrip('trip-123', 'film-456')

      expect(result.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('trip_films')
      expect(mockSupabase.delete).toHaveBeenCalled()
    })

    it('should handle removal errors', async () => {
      let eqCount = 0
      ;(mockSupabase.eq as ReturnType<typeof vi.fn>).mockImplementation(() => {
        eqCount++
        if (eqCount >= 2) {
          return Promise.resolve({ error: { message: 'Delete failed' } })
        }
        return mockSupabase
      })

      const result = await removeFilmFromTrip('trip-123', 'film-456')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('updateTripStatus', () => {
    beforeEach(() => {
      vi.mocked(reduceFilmCount).mockReset()
    })

    it('should update trip status to upcoming', async () => {
      ;(mockSupabase.eq as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null })

      const result = await updateTripStatus('trip-123', 'upcoming')

      expect(result.success).toBe(true)
      expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'upcoming' })
    })

    it('should update trip status to past', async () => {
      ;(mockSupabase.eq as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null })

      const result = await updateTripStatus('trip-123', 'past')

      expect(result.success).toBe(true)
      expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'past' })
    })

    it('should consume films when marking as completed', async () => {
      // Override from to handle different tables
      ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'trips') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { title: 'Test Trip' },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'trip_films') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { film_id: 'film-1', quantity: 2 },
                  { film_id: 'film-2', quantity: 3 },
                ],
                error: null,
              }),
            }),
          }
        }
        if (table === 'film_usage') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }
        }
        return mockSupabase
      })

      vi.mocked(reduceFilmCount).mockResolvedValue({ success: true, newCount: 0 })

      const result = await updateTripStatus('trip-123', 'completed')

      expect(result.success).toBe(true)
      expect(vi.mocked(reduceFilmCount)).toHaveBeenCalledWith(
        'film-1',
        2,
        'Trip: Test Trip (completed)'
      )
      expect(vi.mocked(reduceFilmCount)).toHaveBeenCalledWith(
        'film-2',
        3,
        'Trip: Test Trip (completed)'
      )
    })

    it('should fail if film consumption fails when completing trip', async () => {
      ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'trips') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { title: 'Test Trip' },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'trip_films') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ film_id: 'film-1', quantity: 2 }],
                error: null,
              }),
            }),
          }
        }
        if (table === 'film_usage') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }
        }
        return mockSupabase
      })

      vi.mocked(reduceFilmCount).mockResolvedValue({
        error: 'Film not found'
      })

      const result = await updateTripStatus('trip-123', 'completed')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to consume films')
    })
  })

  describe('consumeTripFilms (via updateTripStatus)', () => {
    beforeEach(() => {
      vi.mocked(reduceFilmCount).mockReset()
    })

    it('should skip films that have already been consumed', async () => {
      ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'trips') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { title: 'Test Trip' },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'trip_films') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { film_id: 'film-1', quantity: 2 },
                  { film_id: 'film-2', quantity: 3 },
                ],
                error: null,
              }),
            }),
          }
        }
        if (table === 'film_usage') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockResolvedValue({
                // film-1 has already been consumed for this trip
                data: [{ film_id: 'film-1' }],
                error: null,
              }),
            }),
          }
        }
        return mockSupabase
      })

      vi.mocked(reduceFilmCount).mockResolvedValue({ success: true, newCount: 0 })

      const result = await updateTripStatus('trip-123', 'completed')

      expect(result.success).toBe(true)
      // film-1 should be skipped since it's already consumed
      expect(vi.mocked(reduceFilmCount)).not.toHaveBeenCalledWith(
        'film-1',
        expect.any(Number),
        expect.any(String)
      )
      // film-2 should still be consumed
      expect(vi.mocked(reduceFilmCount)).toHaveBeenCalledWith(
        'film-2',
        3,
        'Trip: Test Trip (completed)'
      )
    })

    it('should handle trips with no films gracefully', async () => {
      ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'trips') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { title: 'Empty Trip' },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'trip_films') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [], // No films
                error: null,
              }),
            }),
          }
        }
        return mockSupabase
      })

      const result = await updateTripStatus('trip-123', 'completed')

      expect(result.success).toBe(true)
      expect(vi.mocked(reduceFilmCount)).not.toHaveBeenCalled()
    })
  })

  describe('getTripWithFilms', () => {
    it('should fetch trip with associated films', async () => {
      const mockTrip = {
        id: 'trip-123',
        title: 'Test Trip',
        description: 'A test trip',
        start_date: '2024-07-01',
        end_date: '2024-07-15',
        status: 'upcoming',
      }
      const mockTripFilms = [
        {
          quantity: 3,
          films: {
            id: 'film-1',
            name: 'Portra 400',
            brand: 'Kodak',
            iso: 400,
            format: '35mm',
            type: 'color',
          },
        },
      ]

      ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'trips') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockTrip, error: null }),
              }),
            }),
          }
        }
        if (table === 'trip_films') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockTripFilms, error: null }),
            }),
          }
        }
        return mockSupabase
      })

      const result = await getTripWithFilms('trip-123')

      expect(result.trip).toEqual(mockTrip)
      expect(result.films).toHaveLength(1)
      expect(result.films?.[0].name).toBe('Portra 400')
      expect(result.films?.[0].reserved_quantity).toBe(3)
      expect(result.error).toBeNull()
    })

    it('should handle trip not found', async () => {
      ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Trip not found' },
            }),
          }),
        }),
      }))

      const result = await getTripWithFilms('non-existent')

      expect(result.trip).toBeNull()
      expect(result.films).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('getFilmsWithAvailability', () => {
    it('should fetch films with availability data', async () => {
      const mockFilms = [
        {
          id: 'film-1',
          name: 'Portra 400',
          brand: 'Kodak',
          total_count: 10,
          reserved_quantity: 3,
          available_count: 7,
        },
      ]
      ;(mockSupabase.order as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockFilms, error: null })

      const result = await getFilmsWithAvailability()

      expect(result.data).toEqual(mockFilms)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('films_with_availability')
    })

    it('should handle errors', async () => {
      ;(mockSupabase.order as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      })

      const result = await getFilmsWithAvailability()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('Gear functions', () => {
    describe('addGearToTrip', () => {
      it('should add gear to trip', async () => {
        ;(mockSupabase.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: null, error: null })
        ;(mockSupabase.insert as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null })

        const result = await addGearToTrip('trip-123', 'gear-456')

        expect(result.success).toBe(true)
        expect(mockSupabase.from).toHaveBeenCalledWith('trip_gear')
      })

      it('should reject when gear already in trip', async () => {
        ;(mockSupabase.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          data: { trip_id: 'trip-123', gear_id: 'gear-456' },
          error: null,
        })

        const result = await addGearToTrip('trip-123', 'gear-456')

        expect(result.success).toBe(false)
        expect(result.error).toBe('This gear is already reserved for this trip')
      })
    })

    describe('removeGearFromTrip', () => {
      it('should remove gear from trip', async () => {
        // Chain: from().delete().eq().eq() - last eq needs to resolve
        let eqCount = 0
        ;(mockSupabase.eq as ReturnType<typeof vi.fn>).mockImplementation(() => {
          eqCount++
          if (eqCount >= 2) {
            return Promise.resolve({ error: null })
          }
          return mockSupabase
        })

        const result = await removeGearFromTrip('trip-123', 'gear-456')

        expect(result.success).toBe(true)
        expect(mockSupabase.from).toHaveBeenCalledWith('trip_gear')
        expect(mockSupabase.delete).toHaveBeenCalled()
      })
    })

    describe('getTripWithGear', () => {
      it('should fetch trip with associated gear', async () => {
        const mockTrip = {
          id: 'trip-123',
          title: 'Test Trip',
          status: 'upcoming',
        }
        const mockTripGear = [
          {
            gear: {
              id: 'gear-1',
              name: 'Contax T2',
              brand: 'Contax',
              type: 'camera',
              model: 'T2',
            },
          },
        ]

        ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
          if (table === 'trips') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockTrip, error: null }),
                }),
              }),
            }
          }
          if (table === 'trip_gear') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: mockTripGear, error: null }),
              }),
            }
          }
          return mockSupabase
        })

        const result = await getTripWithGear('trip-123')

        expect(result.trip).toEqual(mockTrip)
        expect(result.gear).toHaveLength(1)
        expect(result.gear?.[0].name).toBe('Contax T2')
        expect(result.error).toBeNull()
      })
    })

    describe('getAvailableGear', () => {
      it('should fetch all gear', async () => {
        const mockGear = [
          { id: 'gear-1', name: 'Camera 1', type: 'camera' },
          { id: 'gear-2', name: 'Lens 1', type: 'lens' },
        ]
        // Chain: from().select().order().order().order() - last order resolves
        let orderCount = 0
        ;(mockSupabase.order as ReturnType<typeof vi.fn>).mockImplementation(() => {
          orderCount++
          if (orderCount >= 3) {
            return Promise.resolve({ data: mockGear, error: null })
          }
          return mockSupabase
        })

        const result = await getAvailableGear()

        expect(result.data).toEqual(mockGear)
        expect(result.error).toBeNull()
        expect(mockSupabase.from).toHaveBeenCalledWith('gear')
      })
    })
  })

  describe('consumePastTripFilms', () => {
    beforeEach(() => {
      vi.mocked(reduceFilmCount).mockReset()
    })

    it('should process past trips and consume their films', async () => {
      const pastTrips = [
        { id: 'trip-1', title: 'Past Trip 1', end_date: '2023-01-01' },
        { id: 'trip-2', title: 'Past Trip 2', end_date: '2023-06-01' },
      ]

      ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'trips') {
          return {
            select: vi.fn().mockReturnValue({
              neq: vi.fn().mockReturnValue({
                lt: vi.fn().mockResolvedValue({ data: pastTrips, error: null }),
              }),
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { title: 'Past Trip' },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'trip_films') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ film_id: 'film-1', quantity: 2 }],
                error: null,
              }),
            }),
          }
        }
        if (table === 'film_usage') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }
        }
        return mockSupabase
      })

      vi.mocked(reduceFilmCount).mockResolvedValue({ success: true, newCount: 0 })

      const result = await consumePastTripFilms()

      expect(result.success).toBe(true)
      expect(result.consumed).toBe(2) // 2 trips processed
    })

    it('should return 0 consumed when no past trips exist', async () => {
      ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          neq: vi.fn().mockReturnValue({
            lt: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }))

      const result = await consumePastTripFilms()

      expect(result.success).toBe(true)
      expect(result.consumed).toBe(0)
    })

    it('should handle errors when fetching past trips', async () => {
      ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          neq: vi.fn().mockReturnValue({
            lt: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Query failed' },
            }),
          }),
        }),
      }))

      const result = await consumePastTripFilms()

      expect(result.success).toBe(false)
      expect(result.consumed).toBe(0)
      expect(result.error).toBe('Failed to fetch past trips')
    })
  })

  describe('Date edge cases', () => {
    it('should handle trips starting exactly today as ongoing', async () => {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const futureDate = new Date(today)
      futureDate.setDate(futureDate.getDate() + 5)
      const futureDateStr = futureDate.toISOString().split('T')[0]

      const mockTrips = [
        {
          id: 'trip-1',
          title: 'Today Trip',
          start_date: todayStr,
          end_date: futureDateStr,
          status: 'upcoming',
          trip_films: [],
        },
      ]

      ;(mockSupabase.order as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockTrips, error: null })

      const result = await getTrips()

      expect(result.data?.[0].status).toBe('ongoing')
    })

    it('should handle trips ending exactly today as ongoing', async () => {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const pastDate = new Date(today)
      pastDate.setDate(pastDate.getDate() - 5)
      const pastDateStr = pastDate.toISOString().split('T')[0]

      const mockTrips = [
        {
          id: 'trip-1',
          title: 'Ending Today Trip',
          start_date: pastDateStr,
          end_date: todayStr,
          status: 'upcoming',
          trip_films: [],
        },
      ]

      ;(mockSupabase.order as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockTrips, error: null })

      const result = await getTrips()

      expect(result.data?.[0].status).toBe('ongoing')
    })

    it('should handle trips ending yesterday as past', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      const startDate = new Date(yesterday)
      startDate.setDate(startDate.getDate() - 5)
      const startDateStr = startDate.toISOString().split('T')[0]

      const mockTrips = [
        {
          id: 'trip-1',
          title: 'Yesterday Trip',
          start_date: startDateStr,
          end_date: yesterdayStr,
          status: 'upcoming',
          trip_films: [],
        },
      ]

      ;(mockSupabase.order as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockTrips, error: null })

      const result = await getTrips()

      expect(result.data?.[0].status).toBe('past')
    })

    it('should handle trips starting tomorrow as upcoming', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      const endDate = new Date(tomorrow)
      endDate.setDate(endDate.getDate() + 5)
      const endDateStr = endDate.toISOString().split('T')[0]

      const mockTrips = [
        {
          id: 'trip-1',
          title: 'Tomorrow Trip',
          start_date: tomorrowStr,
          end_date: endDateStr,
          status: 'past', // Will be recalculated
          trip_films: [],
        },
      ]

      ;(mockSupabase.order as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockTrips, error: null })

      const result = await getTrips()

      expect(result.data?.[0].status).toBe('upcoming')
    })
  })
})
