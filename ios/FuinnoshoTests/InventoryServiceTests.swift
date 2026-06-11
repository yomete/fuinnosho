import XCTest
@testable import Fuinnosho

final class InventoryServiceTests: XCTestCase {
  func testDisplayStatusKeepsCompletedTripsCompleted() {
    let trip = makeTrip(status: .completed, startOffset: -5, endOffset: -2)

    XCTAssertEqual(TripDisplay.status(for: trip), .completed)
  }

  func testDisplayStatusDetectsUpcomingOngoingAndPastTrips() {
    XCTAssertEqual(
      TripDisplay.status(for: makeTrip(status: .upcoming, startOffset: 2, endOffset: 4)),
      .upcoming
    )
    XCTAssertEqual(
      TripDisplay.status(for: makeTrip(status: .upcoming, startOffset: -1, endOffset: 1)),
      .ongoing
    )
    XCTAssertEqual(
      TripDisplay.status(for: makeTrip(status: .upcoming, startOffset: -4, endOffset: -2)),
      .past
    )
  }

  func testTripDisplaySortingMatchesAppPriority() {
    let trips = [
      makeTrip(title: "completed", status: .completed, startOffset: -8, endOffset: -7),
      makeTrip(title: "past", status: .past, startOffset: -5, endOffset: -3),
      makeTrip(title: "upcoming", status: .upcoming, startOffset: 3, endOffset: 4),
      makeTrip(title: "ongoing", status: .ongoing, startOffset: -1, endOffset: 1),
    ]

    let sortedTitles = trips
      .sorted(by: TripDisplay.compare)
      .map(\.title)

    XCTAssertEqual(sortedTitles, ["ongoing", "upcoming", "past", "completed"])
  }

  private func makeTrip(
    title: String = "Trip",
    status: TripStatus,
    startOffset: Int,
    endOffset: Int
  ) -> Trip {
    let calendar = Calendar.current
    let today = calendar.startOfDay(for: Date())
    let startDate = calendar.date(byAdding: .day, value: startOffset, to: today) ?? today
    let endDate = calendar.date(byAdding: .day, value: endOffset, to: today) ?? today

    return Trip(
      id: UUID(),
      title: title,
      description: "Smoke test trip",
      startDate: dateString(startDate),
      endDate: dateString(endDate),
      createdAt: nil,
      updatedAt: nil,
      userId: UUID().uuidString,
      status: status,
      reservedFilmCount: nil
    )
  }

  private func dateString(_ date: Date) -> String {
    date.formatted(.iso8601.year().month().day())
  }
}
