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
      html.includes(emptyText) || html.includes('class="card-grid"'),
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
}

async function testConfiguration() {
  const [styles, netlify, ignore, envExample, readme, articleSchema, projectSchema, seriesSchema, imageSchema, topicSchema] = await Promise.all([
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
  for (const field of ['slug', 'summary', 'publishedAt', 'featuredImage', 'body', 'series', 'kind', 'primaryTopic']) {
    assert.ok(articleSchema.includes(`name: '${field}'`), `article schema must define ${field}`);
  }
  for (const field of ['slug', 'summary', 'parent', 'domain', 'order']) {
    assert.ok(topicSchema.includes(`name: '${field}'`), `topic schema must define ${field}`);
  }
  for (const field of ['slug', 'summary', 'publishedAt', 'featuredImage', 'body', 'repositoryUrl', 'projectUrl']) {
    assert.ok(projectSchema.includes(`name: '${field}'`), `project schema must define ${field}`);
  }
  assert.ok(seriesSchema.includes("name: 'articles'"), 'series schema must define its ordered articles');
  assert.ok(seriesSchema.includes("type: 'reference'"), 'series articles must use references');
  assert.ok(imageSchema.includes("name: 'alt'"), 'images must define alternative text');
  assert.ok(imageSchema.includes('rule.required()'), 'image alternative text must be required');
}

await testConfiguration();
await testSanityQueries();
await testBuiltSite();
console.log('publication integration checks passed');
process.exit(0);
