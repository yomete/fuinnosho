import SwiftUI

struct GearDetailView: View {
  @Environment(\.dismiss) private var dismiss
  @Environment(AuthSessionStore.self) private var authStore

  let gear: Gear
  let onChange: () async -> Void

  @State private var service = InventoryService()
  @State private var currentGear: Gear
  @State private var isShowingEdit = false
  @State private var isDeleting = false
  @State private var isConfirmingDelete = false
  @State private var errorMessage: String?

  init(gear: Gear, onChange: @escaping () async -> Void) {
    self.gear = gear
    self.onChange = onChange
    _currentGear = State(initialValue: gear)
  }

  var body: some View {
    List {
      Section("Gear") {
        LabeledContent("Brand", value: currentGear.brand)
        LabeledContent("Type", value: currentGear.type.rawValue.capitalized)
        LabeledContent("Condition", value: currentGear.condition.rawValue.capitalized)
        if let model = currentGear.model, !model.isEmpty {
          LabeledContent("Model", value: model)
        }
        if let serialNumber = currentGear.serialNumber, !serialNumber.isEmpty {
          LabeledContent("Serial", value: serialNumber)
        }
      }

      if currentGear.purchaseDate != nil || currentGear.purchasePrice != nil {
        Section("Purchase") {
          if let purchaseDate = currentGear.purchaseDate, !purchaseDate.isEmpty {
            LabeledContent("Date", value: purchaseDate)
          }
          if let purchasePrice = currentGear.purchasePrice {
            LabeledContent("Price", value: purchasePrice.formatted(.currency(code: Locale.current.currency?.identifier ?? "USD")))
          }
        }
      }

      if let notes = currentGear.notes, !notes.isEmpty {
        Section("Notes") {
          Text(notes)
        }
      }

      Section {
        Button(role: .destructive) {
          isConfirmingDelete = true
        } label: {
          HStack {
            if isDeleting {
              ProgressView()
            }
            Text("Delete Gear")
          }
        }
        .disabled(isDeleting)
      }
    }
    .navigationTitle(currentGear.name)
    .toolbar {
      ToolbarItem(placement: .topBarTrailing) {
        Button("Edit") {
          isShowingEdit = true
        }
      }
    }
    .alert("Gear Error", isPresented: Binding(
      get: { errorMessage != nil },
      set: { if !$0 { errorMessage = nil } }
    )) {
      Button("OK", role: .cancel) {}
    } message: {
      Text(errorMessage ?? "")
    }
    .confirmationDialog(
      "Delete gear?",
      isPresented: $isConfirmingDelete,
      titleVisibility: .visible
    ) {
      Button("Delete Gear", role: .destructive) {
        deleteGear()
      }
      Button("Cancel", role: .cancel) {}
    } message: {
      Text("This permanently removes \(currentGear.name) unless Supabase blocks it because it is reserved for an upcoming trip.")
    }
    .sheet(isPresented: $isShowingEdit) {
      NewGearView(gear: currentGear) {
        await onChange()
        await reload()
      }
    }
  }

  private func reload() async {
    do {
      currentGear = try await service.getGear(id: currentGear.id)
    } catch {
      if await authStore.signOutIfAuthenticationFailed(error) {
        return
      }

      errorMessage = error.localizedDescription
    }
  }

  private func deleteGear() {
    isDeleting = true

    Task {
      defer { isDeleting = false }

      do {
        try await service.deleteGear(currentGear)
        await onChange()
        dismiss()
      } catch {
        if await authStore.signOutIfAuthenticationFailed(error) {
          return
        }

        errorMessage = error.localizedDescription
      }
    }
  }
}
