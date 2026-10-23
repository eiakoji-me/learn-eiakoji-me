const publicDocument = '!(_id in path("drafts.**")) && defined(slug.current)';
const publishedDocument = `${publicDocument} && defined(publishedAt) && publishedAt <= now()`;

const summaryFields = `
  _id,
  _type,
  title,
  "slug": slug.current,
  summary,
  publishedAt,
  featuredImage
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

export const articleBySlugQuery = `*[_type == "article" && slug.current == $slug && ${publishedDocument}][0] {
  ${summaryFields}, body, topics, seo,
  series->{_id, title, "slug": slug.current}
}`;

export const projectBySlugQuery = `*[_type == "project" && slug.current == $slug && ${publishedDocument}][0] {
  ${summaryFields}, body, technologies, repositoryUrl, projectUrl, seo
}`;

export const seriesBySlugQuery = `*[_type == "series" && slug.current == $slug && ${publicDocument}][0] {
  ${summaryFields}, seo,
  "articles": articles[]->[_type == "article" && ${publishedDocument}] {
    ${summaryFields}
  }
}`;
