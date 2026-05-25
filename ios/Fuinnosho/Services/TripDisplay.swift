import Foundation

enum TripDisplay {
  static func status(for trip: Trip) -> TripStatus {
    if trip.status == .completed {
      return .completed
    }

    let calendar = Calendar.current
    let today = calendar.startOfDay(for: Date())
    let startDate = date(from: trip.startDate).map(calendar.startOfDay(for:)) ?? today
    let endDate = date(from: trip.endDate).map(calendar.startOfDay(for:)) ?? startDate

    if startDate > today {
      return .upcoming
    }

    if endDate < today {
      return .past
    }

    return .ongoing
  }

  static func compare(_ lhs: Trip, _ rhs: Trip) -> Bool {
    let priority: [TripStatus: Int] = [
      .ongoing: 0,
      .upcoming: 1,
      .past: 2,
      .completed: 3,
    ]
    let lhsPriority = priority[lhs.status] ?? 0
    let rhsPriority = priority[rhs.status] ?? 0

    if lhsPriority != rhsPriority {
      return lhsPriority < rhsPriority
    }

    let lhsStart = date(from: lhs.startDate) ?? .distantPast
    let rhsStart = date(from: rhs.startDate) ?? .distantPast
    let lhsEnd = date(from: lhs.endDate) ?? lhsStart
    let rhsEnd = date(from: rhs.endDate) ?? rhsStart

    switch lhs.status {
    case .ongoing:
      return lhsEnd < rhsEnd
    case .upcoming:
      return lhsStart < rhsStart
    case .past, .completed:
      return lhsEnd > rhsEnd
    }
  }

  static func date(from value: String) -> Date? {
    try? Date.ISO8601FormatStyle.iso8601.year().month().day().parseStrategy.parse(value)
  }
}
