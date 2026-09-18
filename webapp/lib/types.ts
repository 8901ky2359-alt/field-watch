export type Shot = {
  dataUrl: string;
};

export type Item = {
  before: Shot | null;
  after: Shot | null;
};

export type Project = {
  id: string | null; // set once shared to the cloud; null means local-only
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
    id: null,
    name: '',
    count,
    items: Array.from({ length: count }, emptyItem),
    updatedAt: Date.now(),
  };
}
