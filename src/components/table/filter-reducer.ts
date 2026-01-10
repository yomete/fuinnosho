import { FilterState, FilterAction } from "./enhanced-filters-v2";

// Helper function to toggle item in array
function toggleInArray<T>(array: T[], item: T): T[] {
  return array.includes(item) 
    ? array.filter(i => i !== item)
    : [...array, item];
}

// Initial filter state - always returns consistent values for SSR hydration
export function createInitialFilterState(uniqueIsos: number[]): FilterState {
  const minIso = Math.min(...uniqueIsos);
  const maxIso = Math.max(...uniqueIsos);

  return {
    name: "",
    brands: [],
    types: [],
    formats: [],
    isos: [],
    isoRange: [minIso, maxIso],
    notBrands: [],
    notTypes: [],
    notFormats: [],
    notIsos: [],
    hideZeroQuantity: false, // Always false initially, synced from localStorage via useEffect
    expandedSections: {
      brands: false,
      types: false,
      formats: false,
      isos: false,
    },
    notModes: {
      brands: false,
      types: false,
      formats: false,
      isos: false,
    },
  };
}

// Reducer function - pure, predictable state updates
export function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.value };
      
    case 'TOGGLE_BRAND':
      if (action.isNot) {
        return { ...state, notBrands: toggleInArray(state.notBrands, action.brand) };
      } else {
        return { ...state, brands: toggleInArray(state.brands, action.brand) };
      }
      
    case 'TOGGLE_TYPE':
      if (action.isNot) {
        return { ...state, notTypes: toggleInArray(state.notTypes, action.filmType) };
      } else {
        return { ...state, types: toggleInArray(state.types, action.filmType) };
      }
      
    case 'TOGGLE_FORMAT':
      if (action.isNot) {
        return { ...state, notFormats: toggleInArray(state.notFormats, action.format) };
      } else {
        return { ...state, formats: toggleInArray(state.formats, action.format) };
      }
      
    case 'TOGGLE_ISO':
      if (action.isNot) {
        return { ...state, notIsos: toggleInArray(state.notIsos, action.iso) };
      } else {
        return { ...state, isos: toggleInArray(state.isos, action.iso) };
      }
      
    case 'SET_ISO_RANGE':
      return { ...state, isoRange: action.range };
      
    case 'TOGGLE_HIDE_ZERO':
      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("hideZeroQuantityFilms", action.value.toString());
      }
      return { ...state, hideZeroQuantity: action.value };
      
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
        ...(action.section === 'formats' && {
          formats: [],
          notFormats: [],
        }),
        ...(action.section === 'isos' && {
          isos: [],
          notIsos: [],
        }),
      };
      
    case 'CLEAR_ALL':
      const uniqueIsos = Array.from(new Set([50, 100, 200, 400, 800, 1600, 3200])); // Default fallback
      const minIso = Math.min(...uniqueIsos);
      const maxIso = Math.max(...uniqueIsos);
      
      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("hideZeroQuantityFilms", "false");
      }
      
      return {
        ...state,
        name: "",
        brands: [],
        types: [],
        formats: [],
        isos: [],
        isoRange: [minIso, maxIso],
        notBrands: [],
        notTypes: [],
        notFormats: [],
        notIsos: [],
        hideZeroQuantity: false,
        notModes: {
          brands: false,
          types: false,
          formats: false,
          isos: false,
        },
      };
      
    default:
      return state;
  }
}