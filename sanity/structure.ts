import type { StructureResolver } from 'sanity/structure';

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Knowledge Base')
    .items([
      S.listItem()
        .title('Topics & Domains')
        .child(
          S.list()
            .title('Topic Taxonomy')
            .items([
              S.listItem()
                .title('All Topics')
                .child(S.documentTypeList('topic').title('All Topics')),
              S.listItem()
                .title('Root Topics / Domains')
                .child(
                  S.documentList()
                    .title('Root Topics & Domains')
                    .filter('_type == "topic" && !defined(parent)')
                ),
            ])
        ),
      S.listItem()
        .title('Content Entries')
        .child(
          S.list()
            .title('Content Entries')
            .items([
              S.listItem()
                .title('All Entries')
                .child(S.documentTypeList('article').title('All Entries')),
              S.listItem()
                .title('By Format')
                .child(
                  S.list()
                    .title('Formats')
                    .items([
                      S.listItem()
                        .title('Deep Dives (Architecture & Patterns)')
                        .child(
                          S.documentList()
                            .title('Deep Dives')
                            .filter('_type == "article" && (format == "article" || kind == "deep-dive")')
                        ),
                      S.listItem()
                        .title('Tutorials (Step-by-step Guides)')
                        .child(
                          S.documentList()
                            .title('Tutorials')
                            .filter('_type == "article" && format == "tutorial"')
                        ),
                      S.listItem()
                        .title('Workshops (Hands-on Labs)')
                        .child(
                          S.documentList()
                            .title('Workshops')
                            .filter('_type == "article" && format == "workshop"')
                        ),
                      S.listItem()
                        .title('Case Studies')
                        .child(
                          S.documentList()
                            .title('Case Studies')
                            .filter('_type == "article" && format == "case-study"')
                        ),
                      S.listItem()
                        .title('Showcases (Works Portfolio)')
                        .child(
                          S.documentList()
                            .title('Showcases')
                            .filter('_type == "article" && format == "showcase"')
                        ),
                      S.listItem()
                        .title('Reading Notes (Books & Literature)')
                        .child(
                          S.documentList()
                            .title('Reading Notes')
                            .filter('_type == "article" && (format == "reading-note" || kind == "reading-notes")')
                        ),
                      S.listItem()
                        .title('References & Cheatsheets')
                        .child(
                          S.documentList()
                            .title('References')
                            .filter('_type == "article" && format == "reference"')
                        ),
                    ])
                ),
              S.divider(),
              S.listItem()
                .title('Editorial Queues')
                .child(
                  S.list()
                    .title('Editorial Queues')
                    .items([
                      S.listItem()
                        .title('Draft Entries')
                        .child(
                          S.documentList()
                            .title('Drafts')
                            .filter('_type == "article" && _id in path("drafts.**")')
                        ),
                      S.listItem()
                        .title('Published Entries')
                        .child(
                          S.documentList()
                            .title('Published')
                            .filter('_type == "article" && !(_id in path("drafts.**")) && defined(publishedAt) && publishedAt <= now()')
                        ),
                      S.listItem()
                        .title('Missing Primary Topic')
                        .child(
                          S.documentList()
                            .title('Entries Missing Primary Topic')
                            .filter('_type == "article" && !defined(primaryTopic)')
                        ),
                    ])
                ),
            ])
        ),
      S.listItem()
        .title('Series / Learning Paths')
        .child(S.documentTypeList('series').title('Series / Learning Paths')),
      S.listItem()
        .title('Legacy Projects')
        .child(S.documentTypeList('project').title('Legacy Projects')),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => !['topic', 'article', 'series', 'project'].includes(item.getId() ?? '')
      ),
    ]);
