export type Collection = {
    // main languages that are always present
    en: Topic[];
    ru: Topic[];

    // other optional languages
    [key: string]: Topic[];
}

export interface Topic {
    title: string;
    description: string;
    slug: string;
    tutorials: Tutorial[];
}

export interface TocItem {
    title: string;
    level: number;
    id: string;
}

export interface Tutorial {
    tags: string[];
    slug: string;
    title: string;
    description?: string;
    cover?: string;
    content: string;
    updatedAt: Date;
    markdown: string;
    toc: TocItem[];
}

export function findTopic(topics: Topic[], topicSlug: string) {
    return topics.find(topic => topic.slug === topicSlug);
}

export function findTutorial(topics: Topic[], topicSlug: string, tutorialSlug: string) {
    const topic = findTopic(topics, topicSlug);
    if (!topic) {
        return;
    }

    return topic.tutorials.find(tutorial => tutorial.slug === tutorialSlug);
}
