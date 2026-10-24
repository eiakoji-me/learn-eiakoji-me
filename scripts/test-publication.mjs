import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createClient } from '@sanity/client';
import {
  articleBySlugQuery,
  articlesQuery,
  articleSlugsQuery,
  latestContentQuery,
  projectBySlugQuery,
  projectsQuery,
  projectSlugsQuery,
  seriesBySlugQuery,
  seriesListQuery,
  seriesSlugsQuery,
  topicBySlugQuery,
  topicsListQuery,
  topicSlugsQuery,
  wikiNavQuery,
} from '../src/lib/sanity/queries.ts';
import { extractHeadings } from '../src/lib/slugify.ts';
import { buildTopicTree, getTopicBreadcrumbs, validateTopicHierarchy } from '../src/lib/topics.ts';

const origin = 'http://127.0.0.1:4322';
const expectedPages = [
  { path: '/', file: 'dist/index.html', emptyText: 'The notebook is ready' },
  { path: '/topics/', file: 'dist/topics/index.html', emptyText: 'No published topics yet' },
  { path: '/articles/', file: 'dist/articles/index.html', emptyText: 'No published articles yet' },
  { path: '/projects/', file: 'dist/projects/index.html', emptyText: 'No published projects yet' },
  { path: '/series/', file: 'dist/series/index.html', emptyText: 'No published series yet' },
  { path: '/404.html', file: 'dist/404.html', requiredText: 'That note isn’t here.' },
];

function assertPageMarkup(html, { path, emptyText, requiredText }) {
  assert.match(html, /<!doctype html>/i, `${path} must be an HTML document`);
  assert.match(html, /<html lang="en">/, `${path} must declare its language`);
  assert.match(html, /<meta name="viewport"/, `${path} must set a responsive viewport`);
  assert.match(html, /<meta name="description" content="[^"]+"/, `${path} must have a description`);
  assert.match(html, /<link rel="canonical" href="https:\/\/wiki\.eiakoji\.me\//, `${path} must have a production canonical URL`);
  assert.match(html, /<meta property="og:title"/, `${path} must have social title metadata`);
  assert.match(html, /class="skip-link" href="#main-content"/, `${path} must have skip navigation`);
  assert.match(html, /<main id="main-content">/, `${path} must expose the main landmark`);
  assert.match(html, /<nav aria-label="Primary navigation">/, `${path} must label primary navigation`);
  for (const label of ['Topics', 'Articles', 'Projects', 'Series']) {
    assert.ok(html.includes(label), `${path} must include the ${label} navigation item`);
  }
  if (requiredText) {
    assert.ok(html.includes(requiredText), `${path} must render its expected recovery state`);
  } else {
    assert.ok(
      html.includes(emptyText) || html.includes('class="card-grid"') || html.includes('class="domains-container"'),
      `${path} must render either its empty state or published content`,
    );
  }
}

async function waitForServer(process, timeoutMs = 15_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (process.exitCode !== null) throw new Error(`preview server exited with ${process.exitCode}`);
    try {
      const response = await fetch(`${origin}/`);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('preview server did not start in time');
}

async function testBuiltSite() {
  const preview = spawn('./node_modules/.bin/astro', ['preview', '--host', '127.0.0.1', '--port', '4322'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  preview.stdout.on('data', (chunk) => { logs += chunk; });
  preview.stderr.on('data', (chunk) => { logs += chunk; });

  try {
    await waitForServer(preview);
    for (const page of expectedPages) {
      const builtHtml = await readFile(page.file, 'utf8');
      assertPageMarkup(builtHtml, page);
      const response = await fetch(`${origin}${page.path}`);
      assert.equal(response.status, 200, `${page.path} must return HTTP 200`);
      assertPageMarkup(await response.text(), page);
    }

    const unknownArticle = await fetch(`${origin}/articles/not-a-real-slug/`);
    assert.equal(unknownArticle.status, 404, 'an unknown article slug must return HTTP 404');
    assert.ok((await unknownArticle.text()).includes('That note isn’t here.'), 'unknown slugs must use the recovery page');

    const unknownTopic = await fetch(`${origin}/topics/not-a-real-topic/`);
    assert.equal(unknownTopic.status, 404, 'an unknown topic slug must return HTTP 404');
    assert.ok((await unknownTopic.text()).includes('That note isn’t here.'), 'unknown topic slugs must use the recovery page');
  } finally {
    if (preview.exitCode === null) {
      preview.kill('SIGTERM');
      const exitPromise = new Promise((resolve) => preview.once('exit', resolve));
      const timeout = new Promise((resolve) => setTimeout(() => {
        if (preview.exitCode === null) {
          try { preview.kill('SIGKILL'); } catch { /* ignore */ }
        }
        resolve();
      }, 3000));
      await Promise.race([exitPromise, timeout]);
    }
  }

  assert.ok(!logs.includes('[ERROR]'), `preview server logged an error:\n${logs}`);
}

async function testSanityQueries() {
  const requiredPublicFilter = '!(_id in path("drafts.**")) && defined(slug.current)';
  for (const query of [latestContentQuery, articlesQuery, projectsQuery, seriesListQuery, topicsListQuery]) {
    assert.ok(query.includes(requiredPublicFilter), 'public list queries must exclude drafts and require slugs');
  }
  for (const query of [latestContentQuery, articlesQuery, projectsQuery, articleBySlugQuery, projectBySlugQuery, seriesBySlugQuery]) {
    assert.ok(query.includes('publishedAt <= now()'), 'published article/project queries must exclude future content');
  }

  assert.ok(
    articleBySlugQuery.includes('"series": *[_type == "series" && ^._id in articles[]._ref'),
    'article detail query must resolve series via reverse lookup from series.articles',
  );

  const client = createClient({
    projectId: '7rp2puan',
    dataset: 'production',
    apiVersion: '2026-10-01',
    useCdn: false,
  });

  const listQueries = [
    latestContentQuery,
    articlesQuery,
    projectsQuery,
    seriesListQuery,
    articleSlugsQuery,
    projectSlugsQuery,
    seriesSlugsQuery,
    topicSlugsQuery,
    topicsListQuery,
  ];
  for (const query of listQueries) {
    const result = await client.fetch(query);
    assert.ok(Array.isArray(result), 'list and slug queries must return arrays');
  }

  for (const query of [articleBySlugQuery, projectBySlugQuery, seriesBySlugQuery, topicBySlugQuery]) {
    const result = await client.fetch(query, { slug: 'not-a-real-slug' });
    assert.equal(result, null, 'unknown detail queries must resolve to null');
  }

  assert.ok(
    seriesBySlugQuery.includes('"articles": coalesce(') && seriesBySlugQuery.includes('[]'),
    'series detail queries must return an empty article array when the field is missing',
  );

  const navResult = await client.fetch(wikiNavQuery);
  assert.ok(navResult && typeof navResult === 'object', 'wikiNavQuery must return an object');
  assert.ok(Array.isArray(navResult.topics), 'wikiNavQuery topics must be an array');
  assert.ok(Array.isArray(navResult.series), 'wikiNavQuery series must be an array');
  assert.ok(Array.isArray(navResult.articles), 'wikiNavQuery articles must be an array');
}

async function testUnitBehaviors() {
  // 1. Test Heading ID uniqueness and duplicate disambiguation
  const mockBody = [
    { _type: 'block', _key: 'k1', style: 'h2', children: [{ text: 'Overview' }] },
    { _type: 'block', _key: 'k2', style: 'h2', children: [{ text: 'Overview' }] },
    { _type: 'block', _key: 'k3', style: 'h3', children: [{ text: 'Next Steps & Actions!' }] },
  ];
  const headings = extractHeadings(mockBody);
  assert.equal(headings.length, 3, 'all headings must be extracted');
  assert.equal(headings[0].slug, 'overview', 'first heading slug must be overview');
  assert.equal(headings[1].slug, 'overview-1', 'duplicate heading slug must receive unique index suffix');
  assert.equal(headings[2].slug, 'next-steps-actions', 'symbols should be cleanly normalized');

  // 2. Test Multi-Document Cycle Detection and Validation Gate
  const multiHopCycleTopics = [
    { _id: 't-a', _type: 'topic', title: 'Topic A', slug: 'topic-a', parent: { _id: 't-b', title: 'Topic B', slug: 'topic-b' } },
    { _id: 't-b', _type: 'topic', title: 'Topic B', slug: 'topic-b', parent: { _id: 't-c', title: 'Topic C', slug: 'topic-c' } },
    { _id: 't-c', _type: 'topic', title: 'Topic C', slug: 'topic-c', parent: { _id: 't-a', title: 'Topic A', slug: 'topic-a' } },
  ];
  const validationResult = validateTopicHierarchy(multiHopCycleTopics);
  assert.equal(validationResult.valid, false, 'validateTopicHierarchy must reject multi-document circular references');
  assert.ok(
    validationResult.errors.some((err) => err.includes('Circular parent reference detected')),
    'validation errors must report circular reference',
  );

  // Verify runtime tree builder breaks cycles and strips invalid parent metadata
  const cycleTree = buildTopicTree(multiHopCycleTopics);
  for (const node of cycleTree.rootTopics) {
    assert.equal(node.topic.parent, undefined, 'cycle members promoted to root must have invalid parent stripped');
  }

  // 3. Test Rollup Deduplication (prevent double counting an article in primary + related topics)
  const hierarchyTopics = [
    { _id: 't-root', _type: 'topic', title: 'Architecture', slug: 'architecture', summary: 'Root domain' },
    { _id: 't-child', _type: 'topic', title: 'Distributed Systems', slug: 'distributed-systems', summary: 'Subtopic', parent: { _id: 't-root', title: 'Architecture', slug: 'architecture' } },
    { _id: 't-leaf', _type: 'topic', title: 'Consensus', slug: 'consensus', summary: 'Leaf topic', parent: { _id: 't-child', title: 'Distributed Systems', slug: 'distributed-systems' } },
  ];

  // Article assigned to Leaf as primary AND Parent as related
  const mockArticles = [
    {
      _id: 'a1',
      _type: 'article',
      title: 'Raft Consensus',
      slug: 'raft-consensus',
      summary: 'Summary',
      primaryTopic: { _id: 't-leaf', title: 'Consensus', slug: 'consensus' },
      relatedTopics: [{ _id: 't-child', title: 'Distributed Systems', slug: 'distributed-systems' }],
    },
  ];

  const tree = buildTopicTree(hierarchyTopics, mockArticles);
  const rootNode = tree.nodeMap.get('t-root');
  const childNode = tree.nodeMap.get('t-child');
  const leafNode = tree.nodeMap.get('t-leaf');

  assert.ok(rootNode && childNode && leafNode, 'all nodes must exist in tree');
  assert.equal(leafNode.directArticleCount, 1, 'leaf direct count must equal 1');
  assert.equal(childNode.directArticleCount, 1, 'child direct count must equal 1 via related topic');
  // Child rollup should be 1 (union of a1, NOT 2)
  assert.equal(childNode.rollupArticleCount, 1, 'child rollup must union article IDs without double counting');
  // Root rollup should be 1 (union of a1, NOT 2)
  assert.equal(rootNode.rollupArticleCount, 1, 'root rollup must union all descendant article IDs without double counting');

  // Verify article array filter matches rollupArticleCount exactly
  const matchedForRoot = mockArticles.filter((a) => rootNode.rollupArticleIds.has(a._id));
  assert.equal(matchedForRoot.length, rootNode.rollupArticleCount, 'topic hub listing and count must agree');

  // 4. Test Draft-prioritized cycle detection
  const publishedAndDraftTopics = [
    { _id: 't-1', _type: 'topic', title: 'Topic 1', slug: 't-1', parent: { _id: 't-2', title: 'Topic 2', slug: 't-2' } },
    { _id: 't-2', _type: 'topic', title: 'Topic 2', slug: 't-2', parent: { _id: 't-3', title: 'Topic 3', slug: 't-3' } },
    { _id: 't-3', _type: 'topic', title: 'Topic 3', slug: 't-3' }, // published doc is root, no cycle
    { _id: 'drafts.t-3', _type: 'topic', title: 'Topic 3 Draft', slug: 't-3', parent: { _id: 't-1', title: 'Topic 1', slug: 't-1' } }, // draft introduces cycle
  ];
  const draftValidation = validateTopicHierarchy(publishedAndDraftTopics);
  assert.equal(draftValidation.valid, false, 'validateTopicHierarchy must prioritize draft and detect circular parent cycle');
  assert.ok(
    draftValidation.errors.some((err) => err.includes('Circular parent reference detected')),
    'draft cycle must be flagged in validation errors',
  );

  // 5. Test 4-level deep hierarchy and breadcrumbs
  const fourLevelTopics = [
    { _id: 'l1', _type: 'topic', title: 'Engineering', slug: 'engineering' },
    { _id: 'l2', _type: 'topic', title: 'Distributed Systems', slug: 'distributed-systems', parent: { _id: 'l1', title: 'Engineering', slug: 'engineering' } },
    { _id: 'l3', _type: 'topic', title: 'Storage Engines', slug: 'storage-engines', parent: { _id: 'l2', title: 'Distributed Systems', slug: 'distributed-systems' } },
    { _id: 'l4', _type: 'topic', title: 'LSM Trees', slug: 'lsm-trees', parent: { _id: 'l3', title: 'Storage Engines', slug: 'storage-engines' } },
  ];
  const fourLevelTree = buildTopicTree(fourLevelTopics);
  const crumbs = getTopicBreadcrumbs('lsm-trees', fourLevelTree);
  assert.equal(crumbs.length, 5, 'breadcrumbs must trace Topics -> Engineering -> Distributed Systems -> Storage Engines -> LSM Trees');
  assert.equal(crumbs[0].label, 'Topics');
  assert.equal(crumbs[1].label, 'Engineering');
  assert.equal(crumbs[2].label, 'Distributed Systems');
  assert.equal(crumbs[3].label, 'Storage Engines');
  assert.equal(crumbs[4].label, 'LSM Trees');
}

async function testConfiguration() {
  const [styles, netlify, ignore, envExample, readme, articleSchema, projectSchema, seriesSchema, imageSchema, topicSchema, tocComponent, topicsIndexPage, leftNavComponent, wikiLayout] = await Promise.all([
    readFile('src/styles/global.css', 'utf8'),
    readFile('netlify.toml', 'utf8'),
    readFile('.gitignore', 'utf8'),
    readFile('.env.example', 'utf8'),
    readFile('README.md', 'utf8'),
    readFile('sanity/schemaTypes/article.ts', 'utf8'),
    readFile('sanity/schemaTypes/project.ts', 'utf8'),
    readFile('sanity/schemaTypes/series.ts', 'utf8'),
    readFile('sanity/schemaTypes/imageWithAlt.ts', 'utf8'),
    readFile('sanity/schemaTypes/topic.ts', 'utf8'),
    readFile('src/components/TableOfContents.astro', 'utf8'),
    readFile('src/pages/topics/index.astro', 'utf8'),
    readFile('src/components/LeftNav.astro', 'utf8'),
    readFile('src/layouts/WikiLayout.astro', 'utf8'),
  ]);

  assert.match(styles, /@media \(max-width: 720px\)/, 'styles must include a small-screen layout');
  assert.ok(!/outline\s*:\s*none/.test(styles), 'styles must not suppress keyboard focus outlines');
  assert.match(netlify, /command = "npm run build"/, 'Netlify must use the production build command');
  assert.match(netlify, /publish = "dist"/, 'Netlify must publish dist');
  for (const ignored of ['.env', '.netlify', 'dist/', '.sanity-dist/']) {
    assert.ok(ignore.includes(ignored), `${ignored} must be ignored`);
  }
  assert.ok(envExample.includes('PUBLIC_SANITY_PROJECT_ID=7rp2puan'), 'the public project ID must be documented');
  assert.ok(envExample.includes('PUBLIC_SANITY_DATASET=production'), 'the public dataset must be documented');
  for (const section of ['Local setup', 'Content authoring', 'Netlify preparation', 'Verification']) {
    assert.ok(readme.includes(section), `README must document ${section}`);
  }
  for (const field of ['slug', 'summary', 'publishedAt', 'featuredImage', 'body', 'series', 'format', 'primaryTopic']) {
    assert.ok(articleSchema.includes(`name: '${field}'`), `article schema must define ${field}`);
  }
  for (const field of ['slug', 'summary', 'parent', 'order']) {
    assert.ok(topicSchema.includes(`name: '${field}'`), `topic schema must define ${field}`);
  }
  assert.ok(
    topicSchema.includes('Circular parent reference detected in topic hierarchy'),
    'topic schema must implement ancestor cycle validation',
  );
  assert.ok(
    topicSchema.includes('coalesce(*[_id == "drafts." + $id][0], *[_id == $id][0])'),
    'topic schema must prioritize drafts over published documents during cycle check',
  );
  assert.ok(
    tocComponent.includes('display: flex') && tocComponent.includes('flex-direction: column'),
    'TableOfContents .toc-list must enforce vertical column display to override global nav ul',
  );
  assert.ok(
    topicsIndexPage.includes('buildTopicTree(topics, articles)'),
    'topics index must pass articles to buildTopicTree for deduplicated rollups',
  );
  assert.ok(
    leftNavComponent.includes('buildTopicTree(topics, articles)'),
    'LeftNav must pass articles to buildTopicTree for deduplicated rollups',
  );
  assert.ok(
    wikiLayout.includes('articles={navData?.articles}'),
    'WikiLayout must pass navData.articles to LeftNav',
  );
  for (const field of ['slug', 'summary', 'publishedAt', 'featuredImage', 'body', 'repositoryUrl', 'projectUrl']) {
    assert.ok(projectSchema.includes(`name: '${field}'`), `project schema must define ${field}`);
  }
  assert.ok(seriesSchema.includes("name: 'articles'"), 'series schema must define its ordered articles');
  assert.ok(seriesSchema.includes("type: 'reference'"), 'series articles must use references');
  assert.ok(imageSchema.includes("name: 'alt'"), 'images must define alternative text');
  assert.ok(imageSchema.includes('rule.required()'), 'image alternative text must be required');
}

await testUnitBehaviors();
await testConfiguration();
await testSanityQueries();
await testBuiltSite();
console.log('publication integration checks passed');
process.exit(0);
