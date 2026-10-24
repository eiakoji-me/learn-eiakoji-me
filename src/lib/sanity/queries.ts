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
  kind,
  primaryTopic->{_id, title, "slug": slug.current}
`;

export const latestContentQuery = `*[
  ((_type in ["article", "project"]) && ${publishedDocument}) ||
  (_type == "series" && ${publicDocument})
] | order(coalesce(publishedAt, _updatedAt) desc)[0...6] {${summaryFields}}`;

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
  domain,
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
  domain,
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
  kind,
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
  series->{
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
    domain,
    icon,
    order,
    featured,
    parent->{_id, title, "slug": slug.current}
  },
  "series": *[_type == "series" && ${publicDocument}] | order(title asc) {
    _id,
    _type,
    title,
    "slug": slug.current
  }
}`;
