import type { LayoutServerLoad } from './$types';
import { fetchCollection, } from '../../helpers';

export const prerender = true;

export const load: LayoutServerLoad = async ({ params }) => {
    const collection = await fetchCollection();

    return {
        collection,
    };
};
