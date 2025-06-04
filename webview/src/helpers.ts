import path from 'path';
import fs from 'fs/promises';
import * as mdvs from 'mdsvex';
import { error } from '@sveltejs/kit';
import { parse as htmlParse } from 'node-html-parser';
import type { Collection, ContentsItem, Topic, Tutorial } from './routes/topics';
import { parse, stringify } from 'yaml'
import slug from 'rehype-slug';


import rehypeExternalLinks from 'rehype-external-links';

// @ts-ignore
import rehypeAddClasses from 'rehype-add-classes';

const LANGUAGES = ['en', 'ru'] as const;

interface TopicIndex {
    related_topics?: string[],
    title: {
        [key: string]: string;
    },
    description: {
        [key: string]: string;
    },
}

interface TutorialIndex {
    tags: string[];
    description?: {
        [key: string]: string;
    };
    cover?: string;
}

export async function fetchCollection(): Promise<Collection> {
    const collection: Collection = {
        en: [],
        ru: [],
        zh: [],
    };

    // cleanup
    const STATIC_TOPICS_DIR = "./static/topics";
    const ROOT_TOPIC_DIR = "../topics";

    // await fs.rm(STATIC_TOPICS_DIR, { recursive: true, force: true }).catch(() => { });
    // // recursively copy every file and folder
    // await fs.cp(ROOT_TOPIC_DIR, STATIC_TOPICS_DIR, { recursive: true, force: true });

    for (const lang of Object.keys(collection)) {

        // const TOPICS_DIR = "../topics";
        const topics = await fs.readdir(STATIC_TOPICS_DIR, 'utf-8');

        function isValidTopic(index: TopicIndex) {
            return index.title && index.description;
        }

        function isValidTutorial(index: TutorialIndex) {
            return index.tags && index.tags.length > 0;
        }


        async function parseTopic(topicPath: string): Promise<Topic> {
            const indexPath = path.resolve(topicPath, 'index.yaml');
            const topicIndex = await fs.readFile(indexPath, 'utf-8');
            const index: TopicIndex = parse(topicIndex);
            if (!isValidTopic(index)) {
                throw new Error(`topic ${topicPath} is malformed:\n${stringify(topicIndex)}`);
            }

            if (!index.title[lang]) {
                throw new Error(`topic ${topicPath} is missing title`);
            }

            if (!index.description[lang]) {
                throw new Error(`topic ${topicPath} is missing description`);
            }

            const topic: Topic = {
                slug: path.basename(topicPath),
                title: index.title[lang],
                description: index.description[lang],
                tutorials: [],
            };

            return topic;
        };

        async function parseTutorial(tutorial: string, topic: string): Promise<Tutorial> {
            const tutorialPath = path.resolve(STATIC_TOPICS_DIR, topic, tutorial);
            const tutorialIndex = await fs.readFile(path.resolve(tutorialPath, 'index.yaml'), 'utf-8');
            const index: TutorialIndex = parse(tutorialIndex);
            if (!isValidTutorial(index)) {
                throw new Error(`tutorial ${tutorialPath} is malformed:\n${stringify(tutorialIndex)}`);
            }

            const basename = path.basename(tutorialPath);
            const content = await fs.readFile(path.resolve(tutorialPath, lang + '.md'), 'utf-8');
            // get last modification time
            const stat = await fs.stat(path.resolve(tutorialPath, lang + '.md'));
            const updatedAt = new Date(stat.mtime.toISOString());

            const contentFmt = content
                .replaceAll('https://github.com/HostVDS-com/tutorials/blob/main/topics/', '/')
                .replace(/\/..\.md/, '')


            const options: mdvs.MdsvexOptions = {
                rehypePlugins: [
                    [
                        rehypeAddClasses,
                        {
                            h1: 'text-4xl font-bold mt-10 mb-10 tracking-[-0.01em]',
                            h2: 'text-2xl font-bold mt-10 mb-2 tracking-[-0.01em]',
                            h3: 'text-xl font-bold mt-10 mb-2 tracking-[-0.01em]',
                            h4: 'text-lg font-bold mt-5 mb-2',
                            table: 'my-5',
                            td: 'text-sm',
                            th: 'text-md',
                            a: 'text-sky-700 transition-opacity duration-75 hover:opacity-70',
                            p: 'mt-2 mb-2 text-md'
                        } as any
                    ],
                    [rehypeExternalLinks, { target: ['_blank'] }],
                    [slug, {}]
                ],
                highlight: {
                    optimise: false
                }
            };
            const md = await mdvs.compile(content, options);
            if (!md) {
                throw new Error(`tutorial ${tutorialPath} is malformed:\n${stringify(tutorialIndex)}`);
            }

            const html = md.code;
            const dom = htmlParse(html)
            const contents: ContentsItem[] = []
            for (const el of dom.querySelectorAll('img')) {
                const src = el.getAttribute("src");
                if (!src) continue;

                el.parentNode.innerHTML = `
                    <div class="w-full flex flex-col items-center">
                        <img
                            alt=${el.getAttribute("alt")}
                            src=${src.replace(/\.png$/, ".webp")}
                            loading="lazy"
                            class="aspect-ratio-16/9 object-contain max-w-96"
                            decoding="async"
                        >
                    </div>
                `;
            }

            const h1 = dom.querySelector('h1');
            if (!h1) {
                throw new Error(`tutorial ${tutorialPath} is missing title`);
            }

            const title = h1.textContent;
            h1.remove();

            dom.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
                const title = el.textContent;
                const level = parseInt(el.tagName.toLowerCase()?.replace('h', '') ?? "1");
                const id = el.id
                contents.push({
                    title,
                    level,
                    id,
                });
            });

            const cover = index.cover?.replace(/\.png$/, ".webp");
            const description = index.description?.[lang];

            return {
                slug: path.basename(tutorialPath),
                tags: index.tags,
                title,
                content: contentFmt,
                updatedAt: updatedAt,
                markdown: dom.outerHTML,
                description,
                cover,
                tableOfContents: contents,
            } as Tutorial;
        };

        for (const topicName of topics) {
            const topicPath = path.resolve(STATIC_TOPICS_DIR, topicName);
            const topic = await parseTopic(topicPath);
            if (!topic.title) {
                continue;
            }

            const tutorials = await fs.readdir(topicPath, 'utf-8');

            for (const tutorialName of tutorials) {
                if (tutorialName.startsWith('_')) {
                    continue;
                }
                const tutorialPath = path.resolve(topicPath, tutorialName);
                try {
                    const tutorial = await parseTutorial(tutorialName, topicName);
                    topic.tutorials.push(tutorial);
                } catch (e) {
                    if (e instanceof Error && e.message.includes('ENOENT') && e.message.includes('.md')) {
                        continue;
                    }
                    throw e;
                }
            }

            collection[lang].push(topic);
            topic.tutorials.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        }

        // sort by date

    }


    return collection;
}

export const topicLangs = (topicSlug: string, collection: Collection) => {
    const languages: [string, Topic][] = [];

    for (const lang of Object.keys(collection)) {
        const topic = collection[lang].find((t) => t.slug === topicSlug);
        if (topic) {
            languages.push([lang, topic]);
        }
    }

    return languages;
};

export const tutorialLangs = (tutorialSlug: string, topicSlug: string, collection: Collection) => {
    const languages: [string, Tutorial][] = [];

    for (const lang of Object.keys(collection)) {
        const tut = collection[lang]
            .find((t) => t.slug === topicSlug)
            ?.tutorials.find((t) => t.slug === tutorialSlug);
        if (tut) {
            languages.push([lang, tut]);
        }
    }

    return languages;
};
