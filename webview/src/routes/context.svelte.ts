import { getContext, setContext } from 'svelte';
import type { Collection, Topic } from './topics';

export function setCollection(collection: Collection) {
    setContext('COLLECTION', collection);
}

export function getCollection(): Collection {
    return getContext<Collection>('COLLECTION');
}

