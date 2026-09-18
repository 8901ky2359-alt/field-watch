export type Shot = {
  dataUrl: string;
};

export type Item = {
  before: Shot | null;
  after: Shot | null;
};

export type Project = {
  name: string;
  count: number;
  items: Item[];
  updatedAt: number;
};

export type Quality = 'standard' | 'high';

export function emptyItem(): Item {
  return { before: null, after: null };
}

export function makeProject(count: number): Project {
  return {
    name: '',
    count,
    items: Array.from({ length: count }, emptyItem),
    updatedAt: Date.now(),
  };
}
