export type Film = {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  iso: number;
  format: string;
  type: string;
  expiration_date: string;
  created_at: string;
};

export const mockFilms: Film[] = [
  {
    id: "1a2b3c4d",
    barcode: "8024164003622",
    name: "Portra 400",
    brand: "Kodak",
    iso: 400,
    format: "35mm",
    type: "Color Negative",
    expiration_date: "2025-12-31",
    created_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "2b3c4d5e",
    barcode: "4547410432510",
    name: "HP5 Plus",
    brand: "Ilford",
    iso: 400,
    format: "120",
    type: "Black & White",
    expiration_date: "2026-06-30",
    created_at: "2024-01-20T09:15:00Z",
  },
  {
    id: "3c4d5e6f",
    barcode: "4960999047034",
    name: "Provia 100F",
    brand: "Fujifilm",
    iso: 100,
    format: "4x5",
    type: "Color Slide",
    expiration_date: "2024-09-15",
    created_at: "2024-02-01T14:30:00Z",
  },
  {
    id: "4d5e6f7g",
    barcode: "8024164003639",
    name: "Ektar 100",
    brand: "Kodak",
    iso: 100,
    format: "35mm",
    type: "Color Negative",
    expiration_date: "2025-03-20",
    created_at: "2024-02-10T11:45:00Z",
  },
];
