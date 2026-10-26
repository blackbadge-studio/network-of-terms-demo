import type {BrowseNode} from '../../browse';

/** Fetch state of a node's children; the root (top concepts) uses the key ''. */
export interface ChildrenState {
  status: 'loading' | 'ok' | 'error' | 'timeout';
  nodes: BrowseNode[];
  message?: string;
}

export const ROOT = '';
