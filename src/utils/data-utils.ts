import { type CollectionEntry } from 'astro:content';
import { slugify } from './common-utils';

export function sortItemsByDateDesc(itemA: CollectionEntry<'publications' | 'projects'>, itemB: CollectionEntry<'publications' | 'projects'>) {
    return new Date(itemB.data.publishDate).getTime() - new Date(itemA.data.publishDate).getTime();
}

export function getAllTags(posts: CollectionEntry<'publications'>[]) {
    const tags: string[] = [...new Set(posts.flatMap((post) => post.data.tags || []).filter(Boolean))];
    return tags
        .map((tag) => {
            return {
                name: tag,
                id: slugify(tag)
            };
        })
        .filter((obj, pos, arr) => {
            return arr.map((mapObj) => mapObj.id).indexOf(obj.id) === pos;
        });
}

export function getPostsByTag(posts: CollectionEntry<'publications'>[], tagId: string) {
    const filteredPosts: CollectionEntry<'publications'>[] = posts.filter((post) => (post.data.tags || []).map((tag) => slugify(tag)).includes(tagId));
    return filteredPosts;
}
