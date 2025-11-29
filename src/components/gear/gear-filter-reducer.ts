import { GearFilterState, GearFilterAction } from "./enhanced-gear-filters";

// Helper function to toggle item in array
function toggleInArray<T>(array: T[], item: T): T[] {
  return array.includes(item) 
    ? array.filter(i => i !== item)
    : [...array, item];
}

// Initial filter state
export function createInitialGearFilterState(uniquePrices: number[]): GearFilterState {
  const minPrice = uniquePrices.length > 0 ? Math.floor(Math.min(...uniquePrices)) : 0;
  const maxPrice = uniquePrices.length > 0 ? Math.ceil(Math.max(...uniquePrices)) : 1000;
  
  return {
    search: "",
    brands: [],
    types: [],
    conditions: [],
    priceRange: [minPrice, maxPrice],
    notBrands: [],
    notTypes: [],
    notConditions: [],
    expandedSections: {
      brands: false,
      types: false,
      conditions: false,
      price: false,
    },
    notModes: {
      brands: false,
      types: false,
      conditions: false,
    },
  };
}

// Reducer function - pure, predictable state updates
export function gearFilterReducer(state: GearFilterState, action: GearFilterAction): GearFilterState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.value };
      
    case 'TOGGLE_BRAND':
      if (action.isNot) {
        return { ...state, notBrands: toggleInArray(state.notBrands, action.brand) };
      } else {
        return { ...state, brands: toggleInArray(state.brands, action.brand) };
      }
      
    case 'TOGGLE_TYPE':
      if (action.isNot) {
        return { ...state, notTypes: toggleInArray(state.notTypes, action.gearType) };
      } else {
        return { ...state, types: toggleInArray(state.types, action.gearType) };
      }
      
    case 'TOGGLE_CONDITION':
      if (action.isNot) {
        return { ...state, notConditions: toggleInArray(state.notConditions, action.condition) };
      } else {
        return { ...state, conditions: toggleInArray(state.conditions, action.condition) };
      }
      
    case 'SET_PRICE_RANGE':
      return { ...state, priceRange: action.range };
      
    case 'TOGGLE_SECTION':
      return {
        ...state,
        expandedSections: {
          ...state.expandedSections,
          [action.section]: !state.expandedSections[action.section],
        },
      };
      
    case 'TOGGLE_NOT_MODE':
      return {
        ...state,
        notModes: {
          ...state.notModes,
          [action.section]: !state.notModes[action.section],
        },
        // Clear existing selections when toggling NOT mode
        ...(action.section === 'brands' && {
          brands: [],
          notBrands: [],
        }),
        ...(action.section === 'types' && {
          types: [],
          notTypes: [],
        }),
        ...(action.section === 'conditions' && {
          conditions: [],
          notConditions: [],
        }),
      };
      
    case 'CLEAR_ALL':
      // We need to preserve the price range bounds but reset selection
      // Since we don't have access to original bounds here easily without passing them in,
      // we might need to handle the price range reset in the parent or pass initial bounds.
      // For now, we'll keep the current range or maybe reset to 0-max if we had it.
      // A better approach is to pass the initial state or bounds to the reducer if needed,
      // but usually the parent component handles re-initialization or we just keep current bounds.
      // Let's assume the parent might re-initialize or we just reset lists.
      
      return {
        ...state,
        search: "",
        brands: [],
        types: [],
        conditions: [],
        // priceRange: ... // Ideally reset to full range, but we don't know it here. 
        // We will handle price range reset in the component by re-creating initial state or similar.
        // Actually, let's just clear the lists and search.
        notBrands: [],
        notTypes: [],
        notConditions: [],
        notModes: {
          brands: false,
          types: false,
          conditions: false,
        },
      };
      
    default:
      return state;
  }
}
