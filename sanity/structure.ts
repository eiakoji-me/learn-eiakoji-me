import type { StructureResolver } from 'sanity/structure';

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Knowledge Base')
    .items([
      S.listItem()
        .title('Topics')
        .child(
          S.list()
            .title('Topic Taxonomy')
            .items([
              S.listItem()
                .title('All Topics')
                .child(S.documentTypeList('topic').title('All Topics')),
              S.listItem()
                .title('Top-Level Topics')
                .child(
                  S.documentList()
                    .title('Top-Level Topics')
                    .filter('_type == "topic" && !defined(parent)')
                ),
            ])
        ),
      S.listItem()
        .title('Entries & Articles')
        .child(
          S.list()
            .title('Content Entries')
            .items([
              S.listItem()
                .title('All Entries')
                .child(S.documentTypeList('article').title('All Entries')),
              S.listItem()
                .title('By Format / Kind')
                .child(
                  S.list()
                    .title('Formats')
                    .items([
                      S.listItem()
                        .title('Deep Dives (Architecture & Patterns)')
                        .child(S.documentList().title('Deep Dives').filter('_type == "article" && kind == "deep-dive"')),
                      S.listItem()
                        .title('Workshops & Showcases')
                        .child(S.documentList().title('Workshops & Showcases').filter('_type == "article" && kind == "workshop"')),
                      S.listItem()
                        .title('Guides (Walkthroughs)')
                        .child(S.documentList().title('Guides').filter('_type == "article" && kind == "guide"')),
                      S.listItem()
                        .title('Reading Notes (Books & Literature)')
                        .child(S.documentList().title('Reading Notes').filter('_type == "article" && kind == "reading-notes"')),
                      S.listItem()
                        .title('References & Cheatsheets')
                        .child(S.documentList().title('References').filter('_type == "article" && kind == "reference"')),
                    ])
                ),
              S.listItem()
                .title('Drafts')
                .child(
                  S.documentList()
                    .title('Draft Entries')
                    .filter('_type == "article" && _id in path("drafts.**")')
                ),
            ])
        ),
      S.listItem()
        .title('Series / Learning Paths')
        .child(S.documentTypeList('series').title('Series / Learning Paths')),
      S.listItem()
        .title('Projects (Works Portfolio)')
        .child(S.documentTypeList('project').title('Projects')),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => !['topic', 'article', 'series', 'project'].includes(item.getId() ?? '')
      ),
    ]);
