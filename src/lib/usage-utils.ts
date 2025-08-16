import { Film } from "./utils";

// Development cost mapping based on film types
// ECN/motion picture films: €9, C41: €6, B&W: €9
export function getDevelopmentCost(film: Film): number {
  // ECN films: detect by brand (35mmdealer, Safelight)
  // TODO: Add more ECN vendors here if needed
  const ecnBrands = ['35mmdealer', 'safelight'];
  const isECN = ecnBrands.some(brand => 
    film.brand?.toLowerCase().includes(brand.toLowerCase())
  );
  
  if (isECN) {
    return 9; // ECN development cost
  }
  
  // C41 films: type is "Color Negative"
  if (film.type === 'Color Negative') {
    return 6; // C41 development cost
  }
  
  // B&W films: type contains "Black & White"
  if (film.type?.includes('Black & White')) {
    return 9; // B&W development cost
  }
  
  // Default to C41 cost for unknown types
  return 6;
}

export function getDevelopmentType(film: Film): string {
  const ecnBrands = ['35mmdealer', 'safelight'];
  const isECN = ecnBrands.some(brand => 
    film.brand?.toLowerCase().includes(brand.toLowerCase())
  );
  
  if (isECN) {
    return 'ECN';
  }
  
  if (film.type === 'Color Negative') {
    return 'C41';
  }
  
  if (film.type?.includes('Black & White')) {
    return 'B&W';
  }
  
  return 'C41'; // Default
}

export function calculateTotalCost(film: Film, quantity: number): {
  filmCost: number;
  developmentCost: number;
  totalCost: number;
} {
  const filmCost = 0; // Film cost is sunk cost - already paid when purchased
  const developmentCost = getDevelopmentCost(film) * quantity;
  const totalCost = developmentCost; // Only count ongoing development costs
  
  return {
    filmCost,
    developmentCost,
    totalCost
  };
}