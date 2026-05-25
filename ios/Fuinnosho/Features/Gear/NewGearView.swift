import SwiftUI

struct NewGearView: View {
  @Environment(\.dismiss) private var dismiss
  @Environment(AuthSessionStore.self) private var authStore

  @State private var service = InventoryService()
  @State private var form: GearFormData
  @State private var cameras: [Gear] = []
  @State private var errorMessage: String?
  @State private var isSaving = false

  let gear: Gear?
  let onSave: () async -> Void

  init(gear: Gear? = nil, onSave: @escaping () async -> Void) {
    self.gear = gear
    self.onSave = onSave
    _form = State(initialValue: gear.map(GearFormData.init(gear:)) ?? GearFormData())
  }

  var body: some View {
    NavigationStack {
      Form {
        Section("Gear") {
          TextField("Name", text: $form.name)
          TextField("Brand", text: $form.brand)
          TextField("Model", text: $form.model)
          TextField("Serial number", text: $form.serialNumber)

          Picker("Type", selection: $form.type) {
            ForEach(GearType.allCases) { type in
              Text(type.rawValue.capitalized).tag(type)
            }
          }
          .onChange(of: form.type) { _, type in
            if type != .lens {
              form.cameraId = nil
            }
          }

          Picker("Condition", selection: $form.condition) {
            ForEach(GearCondition.allCases) { condition in
              Text(condition.rawValue.capitalized).tag(condition)
            }
          }
        }

        if form.type == .lens {
          Section("Camera Body") {
            Picker("Camera", selection: $form.cameraId) {
              Text("None").tag(UUID?.none)
              ForEach(cameras) { camera in
                Text("\(camera.brand) \(camera.name)")
                  .tag(UUID?.some(camera.id))
              }
            }
          }
        }

        Section("Purchase") {
          TextField("Purchase date", text: $form.purchaseDate)
          TextField("Purchase price", value: $form.purchasePrice, format: .number)
            .keyboardType(.decimalPad)
        }

        Section("Notes") {
          TextField("Notes", text: $form.notes, axis: .vertical)
        }

        if let errorMessage {
          Section {
            Text(errorMessage)
              .foregroundStyle(.red)
          }
        }
      }
      .task {
        await loadCameras()
      }
      .navigationTitle(gear == nil ? "New Gear" : "Edit Gear")
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Cancel") {
            dismiss()
          }
        }

        ToolbarItem(placement: .confirmationAction) {
          Button("Save") {
            save()
          }
          .disabled(isSaving || form.name.isEmpty || form.brand.isEmpty)
        }
      }
    }
  }

  private func loadCameras() async {
    do {
      cameras = try await service.listGear()
        .filter { item in
          item.type == .camera && item.id != gear?.id
        }
    } catch {
      if await authStore.signOutIfAuthenticationFailed(error) {
        return
      }

      errorMessage = error.localizedDescription
    }
  }

  private func save() {
    isSaving = true

    Task {
      do {
        if let gear {
          try await service.updateGear(gear, with: form)
        } else {
          try await service.createGear(form)
        }
        await onSave()
        dismiss()
      } catch {
        if await authStore.signOutIfAuthenticationFailed(error) {
          return
        }

        errorMessage = error.localizedDescription
      }

      isSaving = false
    }
  }
}
