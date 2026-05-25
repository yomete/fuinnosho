import Foundation

struct FilmFormData {
  var name = ""
  var brand = ""
  var iso = 400
  var format = "35mm"
  var type = "Color Negative"
  var expirationDate = "2030-01-01"
  var price = 0.0
  var count = 1
  var notes = ""
  var editingNotes = ""
  var isECN = false
  var isBulkFilm = false
  var bulkLengthMeters = 30.5
  var bulkQuantity = 1
  var calculatedRolls = 18
  var bulkRemainingExposures = 648
  var spooledCassettes = 0

  init() {}

  init(film: Film) {
    name = film.name
    brand = film.brand
    iso = film.iso
    format = film.format
    type = film.type
    expirationDate = film.expirationDate ?? "2030-01-01"
    price = film.price ?? 0
    count = film.count ?? film.availableCount ?? 1
    notes = film.notes ?? ""
    editingNotes = film.editingNotes ?? ""
    isECN = film.isECN ?? false
    isBulkFilm = film.isBulkFilm ?? false
    bulkLengthMeters = film.bulkLengthMeters ?? 30.5
    bulkQuantity = film.bulkQuantity ?? 1
    calculatedRolls = film.calculatedRolls ?? 18
    bulkRemainingExposures = film.bulkRemainingExposures ?? 648
    spooledCassettes = film.spooledCassettes ?? 0
  }

  var optionalPrice: Double? {
    price > 0 ? price : nil
  }

  var optionalBulkLengthMeters: Double? {
    isBulkFilm ? bulkLengthMeters : nil
  }

  var optionalBulkQuantity: Int? {
    isBulkFilm ? bulkQuantity : nil
  }

  var optionalCalculatedRolls: Int? {
    isBulkFilm ? calculatedRolls : nil
  }

  var optionalBulkRemainingExposures: Int? {
    isBulkFilm ? bulkRemainingExposures : nil
  }

  var optionalSpooledCassettes: Int? {
    isBulkFilm ? spooledCassettes : nil
  }
}
