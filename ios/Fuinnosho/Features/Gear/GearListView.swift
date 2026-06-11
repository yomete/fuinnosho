import SwiftUI

struct GearListView: View {
  @Environment(AuthSessionStore.self) private var authStore

  @State private var service = InventoryService()
  @State private var gear: [Gear] = []
  @State private var errorMessage: String?
  @State private var isLoading = false
  @State private var isShowingNewGear = false
  @State private var searchText = ""
  @State private var selectedType: GearType?
  @State private var selectedBrand = "All"
  @State private var selectedCondition: GearCondition?
  @State private var minPrice: Double?
  @State private var maxPrice: Double?

  var body: some View {
    List {
      if isLoading && gear.isEmpty {
        ProgressView()
      }

      if !gear.isEmpty {
        Section("Summary") {
          LabeledContent("Items", value: "\(gear.count)")
          LabeledContent("Value", value: totalValue.formatted(.currency(code: "EUR")))
          LabeledContent("Average value", value: averageValue.formatted(.currency(code: "EUR")))
        }

        Section("Top Brands") {
          ForEach(topBrands, id: \.brand) { item in
            LabeledContent(item.brand, value: "\(item.count)")
          }
        }

        Section("Condition") {
          ForEach(conditionBreakdown, id: \.condition) { item in
            LabeledContent(item.condition.rawValue.capitalized, value: "\(item.count)")
          }
        }

        Section("Filters") {
          Picker("Type", selection: $selectedType) {
            Text("All").tag(nil as GearType?)
            ForEach(GearType.allCases) { type in
              Text(type.rawValue.capitalized).tag(type as GearType?)
            }
          }

          Picker("Brand", selection: $selectedBrand) {
            Text("All").tag("All")
            ForEach(availableBrands, id: \.self) { brand in
              Text(brand).tag(brand)
            }
          }

          Picker("Condition", selection: $selectedCondition) {
            Text("All").tag(nil as GearCondition?)
            ForEach(GearCondition.allCases) { condition in
              Text(condition.rawValue.capitalized).tag(condition as GearCondition?)
            }
          }

          TextField("Minimum price", value: $minPrice, format: .number)
            .keyboardType(.decimalPad)
          TextField("Maximum price", value: $maxPrice, format: .number)
            .keyboardType(.decimalPad)

          if hasActiveFilters {
            Button("Clear Filters") {
              clearFilters()
            }
          }
        }
      }

      ForEach(filteredGear) { item in
        NavigationLink {
          GearDetailView(gear: item) {
            await reload()
          }
        } label: {
          VStack(alignment: .leading, spacing: 6) {
            Text(item.name)
              .font(.headline)
            Text("\(item.brand) · \(item.type.rawValue.capitalized)")
              .font(.subheadline)
              .foregroundStyle(.secondary)
            Text(item.condition.rawValue.capitalized)
              .font(.caption)
              .foregroundStyle(FuinnoshoTheme.accent)
          }
          .padding(.vertical, 4)
        }
      }
    }
    .navigationTitle("Gear")
    .toolbar {
      ToolbarItem(placement: .topBarTrailing) {
        Button {
          isShowingNewGear = true
        } label: {
          Label("Add Gear", systemImage: "plus")
        }
      }
    }
    .overlay {
      if filteredGear.isEmpty && !isLoading {
        ContentUnavailableView("No gear yet", systemImage: "camera", description: Text("Add cameras, lenses, and accessories."))
      }
    }
    .searchable(text: $searchText, prompt: "Search gear")
    .alert("Gear Error", isPresented: Binding(
      get: { errorMessage != nil },
      set: { if !$0 { errorMessage = nil } }
    )) {
      Button("OK", role: .cancel) {}
    } message: {
      Text(errorMessage ?? "")
    }
    .sheet(isPresented: $isShowingNewGear) {
      NewGearView {
        await reload()
      }
    }
    .task {
      await reload()
    }
    .refreshable {
      await reload()
    }
    .safeAreaInset(edge: .bottom) {
      DebugLoadStatusView(label: "Gear", count: filteredGear.count)
    }
  }

  private var filteredGear: [Gear] {
    let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

    return gear.filter { item in
      let matchesType = selectedType == nil || item.type == selectedType
      let matchesBrand = selectedBrand == "All" || item.brand == selectedBrand
      let matchesCondition = selectedCondition == nil || item.condition == selectedCondition
      let matchesPrice = priceMatches(item)
      let matchesQuery = query.isEmpty
        || item.name.lowercased().contains(query)
        || item.brand.lowercased().contains(query)
        || (item.model?.lowercased().contains(query) ?? false)
        || (item.serialNumber?.lowercased().contains(query) ?? false)
      return matchesType && matchesBrand && matchesCondition && matchesPrice && matchesQuery
    }
  }

  private var totalValue: Double {
    gear.reduce(0) { $0 + ($1.purchasePrice ?? 0) }
  }

  private var averageValue: Double {
    guard !gear.isEmpty else { return 0 }
    return totalValue / Double(gear.count)
  }

  private var availableBrands: [String] {
    Array(Set(gear.map(\.brand))).sorted()
  }

  private var topBrands: [(brand: String, count: Int)] {
    let grouped = gear.reduce(into: [String: Int]()) { result, item in
      result[item.brand, default: 0] += 1
    }

    return grouped
      .map { (brand: $0.key, count: $0.value) }
      .sorted { first, second in
        if first.count == second.count {
          return first.brand < second.brand
        }

        return first.count > second.count
      }
      .prefix(5)
      .map { $0 }
  }

  private var conditionBreakdown: [(condition: GearCondition, count: Int)] {
    GearCondition.allCases.compactMap { condition in
      let count = gear.filter { $0.condition == condition }.count
      return count > 0 ? (condition: condition, count: count) : nil
    }
  }

  private var hasActiveFilters: Bool {
    selectedType != nil
      || selectedBrand != "All"
      || selectedCondition != nil
      || minPrice != nil
      || maxPrice != nil
  }

  private func priceMatches(_ item: Gear) -> Bool {
    let price = item.purchasePrice ?? 0

    if let minPrice, price < minPrice {
      return false
    }

    if let maxPrice, price > maxPrice {
      return false
    }

    return true
  }

  private func clearFilters() {
    selectedType = nil
    selectedBrand = "All"
    selectedCondition = nil
    minPrice = nil
    maxPrice = nil
  }

  private func reload() async {
    isLoading = true
    defer { isLoading = false }

    do {
      gear = try await service.listGear()
    } catch {
      if await authStore.signOutIfAuthenticationFailed(error) {
        return
      }

      errorMessage = error.localizedDescription
    }
  }
}
