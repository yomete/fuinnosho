import Foundation

struct TripFormData {
  var title = ""
  var description = ""
  var startDate = Date.now
  var endDate = Date.now

  init() {}

  init(trip: Trip) {
    title = trip.title
    description = trip.description
    startDate = Self.date(from: trip.startDate) ?? .now
    endDate = Self.date(from: trip.endDate) ?? startDate
  }

  var startDateString: String {
    startDate.formatted(.iso8601.year().month().day())
  }

  var endDateString: String {
    endDate.formatted(.iso8601.year().month().day())
  }

  private static func date(from value: String) -> Date? {
    try? Date.ISO8601FormatStyle.iso8601.year().month().day().parseStrategy.parse(value)
  }
}
