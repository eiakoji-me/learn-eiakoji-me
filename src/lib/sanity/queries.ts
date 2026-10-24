const publicDocument = '!(_id in path("drafts.**")) && defined(slug.current)';
const publishedDocument = `${publicDocument} && defined(publishedAt) && publishedAt <= now()`;

const summaryFields = `
  _id,
  _type,
  title,
  "slug": slug.current,
  summary,
  publishedAt,
  featuredImage,
  featured,
  format,
  "kind": coalesce(format, kind),
  primaryTopic->{_id, title, "slug": slug.current},
  "relatedTopics": relatedTopics[]->{_id, title, "slug": slug.current}
`;

export const latestContentQuery = `*[
  ((_type in ["article", "project"]) && ${publishedDocument}) ||
  (_type == "series" && ${publicDocument})
] | order(coalesce(publishedAt, _updatedAt) desc)[0...6] {${summaryFields}}`;

export const workshopsQuery = `*[_type == "article" && (format == "workshop" || kind == "workshop") && ${publishedDocument}] | order(publishedAt desc) {${summaryFields}}`;

export const featuredArticlesQuery = `*[_type == "article" && ${publishedDocument}] | order(coalesce(featured, false) desc, publishedAt desc)[0...3] {${summaryFields}}`;

export const homepageQuery = `{
  "featured": *[_type == "article" && ${publishedDocument}] | order(coalesce(featured, false) desc, publishedAt desc)[0...3] {${summaryFields}},
  "latest": *[
    ((_type in ["article", "project"]) && ${publishedDocument}) ||
    (_type == "series" && ${publicDocument})
  ] | order(coalesce(publishedAt, _updatedAt) desc)[0...6] {${summaryFields}},
  "workshops": *[_type == "article" && (format == "workshop" || kind == "workshop") && ${publishedDocument}] | order(publishedAt desc)[0...3] {${summaryFields}},
  "systemDesignTopic": *[_type == "topic" && (slug.current in ["system-design", "systems-design"]) && ${publicDocument}][0] {
    _id, title, "slug": slug.current, summary,
    "archetypesTopic": *[_type == "topic" && parent._ref == ^._id && (slug.current == "archetypes" || title match "Archetype*") && ${publicDocument}][0] {
      _id, title, "slug": slug.current, summary
    }
  },
  "archetypesArticles": *[_type == "article" && ${publishedDocument} && (primaryTopic->slug.current == "archetypes" || "archetypes" in relatedTopics[]->slug.current)] | order(publishedAt desc)[0...3] {${summaryFields}},
  "systemDesignArticles": *[_type == "article" && ${publishedDocument} && (primaryTopic->slug.current in ["system-design", "systems-design", "distributed-systems", "design-patterns", "reliability-and-scale", "data-systems"] || "system-design" in relatedTopics[]->slug.current)] | order(publishedAt desc)[0...3] {${summaryFields}},
  "platformTopic": *[_type == "topic" && (slug.current in ["platform-engineering", "cloud-platform", "cloud"]) && ${publicDocument}][0] {
    _id, title, "slug": slug.current, summary
  },
  "aiTopic": *[_type == "topic" && (slug.current in ["ai-engineering", "ai-systems", "ai", "multi-agent-systems"]) && ${publicDocument}][0] {
    _id, title, "slug": slug.current, summary
  }
}`;

export const articlesQuery = `*[_type == "article" && ${publishedDocument}] | order(publishedAt desc) {${summaryFields}}`;
export const projectsQuery = `*[_type == "project" && ${publishedDocument}] | order(publishedAt desc) {${summaryFields}}`;

export const seriesListQuery = `*[_type == "series" && ${publicDocument}] | order(title asc) {
  ${summaryFields},
  "publishedArticleCount": count(articles[]->[_type == "article" && ${publishedDocument}])
}`;

export const articleSlugsQuery = `*[_type == "article" && ${publishedDocument}].slug.current`;
export const projectSlugsQuery = `*[_type == "project" && ${publishedDocument}].slug.current`;
export const seriesSlugsQuery = `*[_type == "series" && ${publicDocument}].slug.current`;
export const topicSlugsQuery = `*[_type == "topic" && ${publicDocument}].slug.current`;

export const topicsListQuery = `*[_type == "topic" && ${publicDocument}] | order(coalesce(order, 999) asc, title asc) {
  _id,
  _type,
  title,
  "slug": slug.current,
  summary,
  icon,
  order,
  featured,
  parent->{_id, title, "slug": slug.current},
  "articleCount": count(*[_type == "article" && ${publishedDocument} && (primaryTopic._ref == ^._id || ^._id in relatedTopics[]._ref)])
}`;

export const topicBySlugQuery = `*[_type == "topic" && slug.current == $slug && ${publicDocument}][0] {
  _id,
  _type,
  title,
  "slug": slug.current,
  summary,
  description,
  icon,
  order,
  featured,
  parent->{_id, title, "slug": slug.current},
  "subtopics": *[_type == "topic" && parent._ref == ^._id && ${publicDocument}] | order(coalesce(order, 999) asc, title asc) {
    _id,
    _type,
    title,
    "slug": slug.current,
    summary,
    icon
  },
  "articles": *[_type == "article" && ${publishedDocument} && (primaryTopic._ref == ^._id || ^._id in relatedTopics[]._ref)] | order(publishedAt desc) {
    ${summaryFields}
  }
}`;

export const articleBySlugQuery = `*[_type == "article" && slug.current == $slug && ${publishedDocument}][0] {
  ${summaryFields},
  body,
  format,
  "kind": coalesce(format, kind),
  primaryTopic->{_id, title, "slug": slug.current},
  relatedTopics[]->{_id, title, "slug": slug.current},
  difficulty,
  topics,
  repositoryUrl,
  demoUrl,
  technologies,
  bookAuthor,
  referenceUrl,
  seo,
  "series": *[_type == "series" && ^._id in articles[]._ref && ${publicDocument}][0] {
    _id,
    title,
    "slug": slug.current,
    "articles": coalesce(
      articles[]->[_type == "article" && ${publishedDocument}] {
        _id,
        title,
        "slug": slug.current,
        summary
      },
      []
    )
  }
}`;

export const projectBySlugQuery = `*[_type == "project" && slug.current == $slug && ${publishedDocument}][0] {
  ${summaryFields}, body, technologies, repositoryUrl, projectUrl, seo
}`;

export const seriesBySlugQuery = `*[_type == "series" && slug.current == $slug && ${publicDocument}][0] {
  ${summaryFields}, seo,
  "articles": coalesce(
    articles[]->[_type == "article" && ${publishedDocument}] {${summaryFields}},
    []
  )
}`;

export const wikiNavQuery = `{
  "topics": *[_type == "topic" && ${publicDocument}] | order(coalesce(order, 999) asc, title asc) {
    _id,
    _type,
    title,
    "slug": slug.current,
    icon,
    order,
    featured,
    parent->{_id, title, "slug": slug.current}
  },
  "articles": *[_type == "article" && ${publishedDocument}] {
    _id,
    primaryTopic->{_id, title, "slug": slug.current},
    "relatedTopics": relatedTopics[]->{_id, title, "slug": slug.current}
  },
  "series": *[_type == "series" && ${publicDocument}] | order(title asc) {
    _id,
    _type,
    title,
    "slug": slug.current
  }
}`;
