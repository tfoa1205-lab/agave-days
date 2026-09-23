export interface Plant {
  id: string;
  name: string;
  species?: string;
  purchaseDate?: string;
  purchasePrice?: string;
  purchasePlace?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  plantId: string;
  takenAt: string;
  original: Blob;
  thumbnail: Blob;
  memo?: string;
  createdAt: string;
}

export interface Watering {
  id: string;
  plantId: string;
  wateredAt: string;
  memo?: string;
  createdAt: string;
}
