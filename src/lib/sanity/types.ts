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

export interface ContentSummary {
  _id: string;
  _type: 'article' | 'project' | 'series';
  title: string;
  slug: string;
  summary: string;
  publishedAt?: string;
  featuredImage?: SanityImage;
}

export interface CodeBlock {
  _key: string;
  _type: 'codeBlock';
  code: string;
  language?: string;
  filename?: string;
}

export type BodyBlock = PortableTextBlock | SanityImage | CodeBlock;

export interface Article extends ContentSummary {
  _type: 'article';
  body: BodyBlock[];
  topics?: string[];
  series?: Pick<ContentSummary, '_id' | 'title' | 'slug'>;
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
  seo?: SeoFields;
}
