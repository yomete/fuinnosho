import Foundation

struct GearFormData {
  var name = ""
  var brand = ""
  var type: GearType = .camera
  var model = ""
  var serialNumber = ""
  var purchaseDate = ""
  var purchasePrice = 0.0
  var condition: GearCondition = .good
  var notes = ""
  var cameraId: UUID?

  init() {}

  init(gear: Gear) {
    name = gear.name
    brand = gear.brand
    type = gear.type
    model = gear.model ?? ""
    serialNumber = gear.serialNumber ?? ""
    purchaseDate = gear.purchaseDate ?? ""
    purchasePrice = gear.purchasePrice ?? 0
    condition = gear.condition
    notes = gear.notes ?? ""
    cameraId = gear.cameraId
  }

  var optionalModel: String? {
    model.isEmpty ? nil : model
  }

  var optionalSerialNumber: String? {
    serialNumber.isEmpty ? nil : serialNumber
  }

  var optionalPurchaseDate: String? {
    purchaseDate.isEmpty ? nil : purchaseDate
  }

  var optionalPurchasePrice: Double? {
    purchasePrice > 0 ? purchasePrice : nil
  }

  var optionalCameraId: String? {
    type == .lens ? cameraId?.uuidString : nil
  }
}
