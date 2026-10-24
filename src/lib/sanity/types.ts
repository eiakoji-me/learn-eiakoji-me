import type { PortableTextBlock } from '@portabletext/types';
import type { SanityImageSource } from '@sanity/image-url';

export interface SanityImage {
  asset: SanityImageSource;
  alt: string;
  caption?: string;
}

export interface SeoFields {
  title?: string;
  description?: string;
  image?: SanityImage;
}

export type ContentFormat =
  | 'article'
  | 'tutorial'
  | 'workshop'
  | 'case-study'
  | 'showcase'
  | 'reading-note'
  | 'reference';

export interface ContentSummary {
  _id: string;
  _type: 'article' | 'project' | 'series' | 'topic';
  title: string;
  slug: string;
  summary: string;
  publishedAt?: string;
  featuredImage?: SanityImage;
  format?: ContentFormat;
  kind?: string;
  primaryTopic?: {
    _id: string;
    title: string;
    slug: string;
  };
  relatedTopics?: Array<{
    _id: string;
    title: string;
    slug: string;
  }>;
}

export interface CodeBlock {
  _key: string;
  _type: 'codeBlock';
  code: string;
  language?: string;
  filename?: string;
}

export type BodyBlock = PortableTextBlock | SanityImage | CodeBlock;

export interface Topic {
  _id: string;
  _type: 'topic';
  title: string;
  slug: string;
  domain?: string;
  summary: string;
  description?: BodyBlock[];
  icon?: string;
  order?: number;
  featured?: boolean;
  parent?: {
    _id: string;
    title: string;
    slug: string;
  };
  articleCount?: number;
}

export interface Article extends ContentSummary {
  _type: 'article';
  body: BodyBlock[];
  format?: ContentFormat;
  kind?: string;
  primaryTopic?: {
    _id: string;
    title: string;
    slug: string;
  };
  relatedTopics?: Array<{
    _id: string;
    title: string;
    slug: string;
  }>;
  difficulty?: 'Fundamentals' | 'Intermediate' | 'Advanced';
  topics?: string[];
  series?: {
    _id: string;
    title: string;
    slug: string;
    articles?: ContentSummary[];
  };
  repositoryUrl?: string;
  demoUrl?: string;
  technologies?: string[];
  bookAuthor?: string;
  referenceUrl?: string;
  seo?: SeoFields;
}

export interface Project extends ContentSummary {
  _type: 'project';
  body: BodyBlock[];
  technologies?: string[];
  repositoryUrl?: string;
  projectUrl?: string;
  seo?: SeoFields;
}

export interface Series extends ContentSummary {
  _type: 'series';
  articles: ContentSummary[];
  primaryTopic?: {
    _id: string;
    title: string;
    slug: string;
  };
  seo?: SeoFields;
}
