import Foundation

enum TripDisplay {
  struct SortKey {
    var status: TripStatus
    var startDate: Date
    var endDate: Date
  }

  private static let dateParseStrategy = Date.ISO8601FormatStyle.iso8601.year().month().day().parseStrategy
  private static let priority: [TripStatus: Int] = [
    .ongoing: 0,
    .upcoming: 1,
    .past: 2,
    .completed: 3,
  ]

  static func status(for trip: Trip) -> TripStatus {
    sortKey(for: trip).status
  }

  static func sortKey(for trip: Trip) -> SortKey {
    let calendar = Calendar.current
    let today = calendar.startOfDay(for: Date())
    let startDate = date(from: trip.startDate).map(calendar.startOfDay(for:)) ?? today
    let endDate = date(from: trip.endDate).map(calendar.startOfDay(for:)) ?? startDate

    if trip.status == .completed {
      return SortKey(status: .completed, startDate: startDate, endDate: endDate)
    }

    if startDate > today {
      return SortKey(status: .upcoming, startDate: startDate, endDate: endDate)
    }

    if endDate < today {
      return SortKey(status: .past, startDate: startDate, endDate: endDate)
    }

    return SortKey(status: .ongoing, startDate: startDate, endDate: endDate)
  }

  static func compare(_ lhs: Trip, _ rhs: Trip) -> Bool {
    compare(sortKey(for: lhs), sortKey(for: rhs))
  }

  static func compare(_ lhs: SortKey, _ rhs: SortKey) -> Bool {
    let lhsPriority = priority[lhs.status] ?? 0
    let rhsPriority = priority[rhs.status] ?? 0

    if lhsPriority != rhsPriority {
      return lhsPriority < rhsPriority
    }

    switch lhs.status {
    case .ongoing:
      return lhs.endDate < rhs.endDate
    case .upcoming:
      return lhs.startDate < rhs.startDate
    case .past, .completed:
      return lhs.endDate > rhs.endDate
    }
  }

  static func date(from value: String) -> Date? {
    try? dateParseStrategy.parse(value)
  }
}
