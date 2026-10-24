import type { Topic, ContentSummary } from './sanity/types';

export interface TopicNode {
  topic: Topic;
  parent?: TopicNode;
  children: TopicNode[];
  ancestors: Array<{ title: string; slug: string }>;
  descendantIds: Set<string>;
  directArticleIds: Set<string>;
  rollupArticleIds: Set<string>;
  directArticleCount: number;
  rollupArticleCount: number;
}

export interface TopicTree {
  rootTopics: TopicNode[];
  nodeMap: Map<string, TopicNode>;
  slugMap: Map<string, TopicNode>;
}

export interface TopicHierarchyValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a list of topics for self-references, multi-hop circular dependencies,
 * orphaned parent references, and maximum hierarchy depth.
 */
export function validateTopicHierarchy(topics: Topic[], maxDepth = 4): TopicHierarchyValidation {
  const errors: string[] = [];
  const topicMap = new Map<string, Topic>(topics.map((t) => [t._id, t]));

  for (const topic of topics) {
    if (!topic.parent?._id) continue;

    // Check for orphaned parent
    if (!topicMap.has(topic.parent._id)) {
      errors.push(`Topic "${topic.title}" (${topic._id}) references non-existent parent ID "${topic.parent._id}".`);
      continue;
    }

    // Check for direct self-reference
    if (topic.parent._id === topic._id) {
      errors.push(`Topic "${topic.title}" (${topic._id}) directly references itself as parent.`);
      continue;
    }

    // Traverse ancestors to check for multi-document cycles and depth limits
    const visited = new Set<string>([topic._id]);
    let currentParentId: string | undefined = topic.parent._id;
    let depth = 0;

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        errors.push(`Circular parent reference detected involving topic "${topic.title}" (${topic._id}) and ancestor ID "${currentParentId}".`);
        break;
      }
      visited.add(currentParentId);
      depth++;

      if (depth > maxDepth) {
        errors.push(`Topic "${topic.title}" (${topic._id}) exceeds maximum supported hierarchy depth of ${maxDepth} levels.`);
        break;
      }

      const parentDoc = topicMap.get(currentParentId);
      currentParentId = parentDoc?.parent?._id;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function buildTopicTree(
  topics: Topic[],
  articles: ContentSummary[] = [],
  maxDepth = 4
): TopicTree {
  const nodeMap = new Map<string, TopicNode>();
  const slugMap = new Map<string, TopicNode>();

  // Map article IDs by topic ID to avoid double-counting articles assigned via primary or related topics
  const topicArticleIdMap = new Map<string, Set<string>>();

  for (const article of articles) {
    const assignedTopicIds = new Set<string>();
    if (article.primaryTopic?._id) {
      assignedTopicIds.add(article.primaryTopic._id);
    }
    if (Array.isArray(article.relatedTopics)) {
      for (const rel of article.relatedTopics) {
        if (rel?._id) {
          assignedTopicIds.add(rel._id);
        }
      }
    }

    for (const topicId of assignedTopicIds) {
      let set = topicArticleIdMap.get(topicId);
      if (!set) {
        set = new Set<string>();
        topicArticleIdMap.set(topicId, set);
      }
      set.add(article._id);
    }
  }

  // Initialize nodes
  for (const t of topics) {
    const directSet = new Set<string>(topicArticleIdMap.get(t._id) ?? []);
    const directCount = directSet.size > 0 ? directSet.size : (t.articleCount ?? 0);
    const node: TopicNode = {
      topic: { ...t },
      children: [],
      ancestors: [],
      descendantIds: new Set(),
      directArticleIds: directSet,
      rollupArticleIds: new Set(directSet),
      directArticleCount: directCount,
      rollupArticleCount: directCount,
    };
    nodeMap.set(t._id, node);
    slugMap.set(t.slug, node);
  }

  // Build parent-child relationships with robust multi-document cycle detection
  const rootTopics: TopicNode[] = [];

  for (const t of topics) {
    const node = nodeMap.get(t._id)!;
    if (t.parent?._id && nodeMap.has(t.parent._id)) {
      const visited = new Set<string>([t._id]);
      let ancestorId: string | undefined = t.parent._id;
      let depth = 0;
      let hasCycle = false;

      while (ancestorId && depth <= maxDepth + 1) {
        if (visited.has(ancestorId)) {
          hasCycle = true;
          break;
        }
        visited.add(ancestorId);
        const ancestorNode = nodeMap.get(ancestorId);
        ancestorId = ancestorNode?.topic.parent?._id;
        depth++;
      }

      if (!hasCycle && depth <= maxDepth) {
        const parentNode = nodeMap.get(t.parent._id)!;
        node.parent = parentNode;
        parentNode.children.push(node);
      } else {
        // Strip invalid/cyclic parent reference so the document does not present contradictory metadata
        node.topic.parent = undefined;
        rootTopics.push(node);
      }
    } else {
      // Ensure root node has no dangling parent metadata
      if (node.topic.parent) {
        node.topic.parent = undefined;
      }
      rootTopics.push(node);
    }
  }

  // Compute ancestors, descendant ID sets, and union article rollups (no double-counting)
  function populateNode(node: TopicNode, currentAncestors: Array<{ title: string; slug: string }>) {
    node.ancestors = currentAncestors;
    const nextAncestors = [...currentAncestors, { title: node.topic.title, slug: node.topic.slug }];

    for (const child of node.children) {
      populateNode(child, nextAncestors);
      // Union descendant topic IDs
      node.descendantIds.add(child.topic._id);
      for (const descId of child.descendantIds) {
        node.descendantIds.add(descId);
      }

      // Union article IDs into parent rollup to guarantee no duplicate counts
      for (const articleId of child.rollupArticleIds) {
        node.rollupArticleIds.add(articleId);
      }
    }

    if (articles.length > 0) {
      node.directArticleCount = node.directArticleIds.size;
      node.rollupArticleCount = node.rollupArticleIds.size;
    } else {
      // If articles array was not supplied, aggregate static articleCount if available
      let sum = node.directArticleCount;
      for (const child of node.children) {
        sum += child.rollupArticleCount;
      }
      node.rollupArticleCount = sum;
    }
  }

  for (const root of rootTopics) {
    populateNode(root, []);
  }

  return { rootTopics, nodeMap, slugMap };
}

export function getTopicBreadcrumbs(
  topicSlug: string,
  tree: TopicTree
): Array<{ label: string; href?: string }> {
  const node = tree.slugMap.get(topicSlug);
  if (!node) {
    return [{ label: 'Topics', href: '/topics/' }];
  }

  const items: Array<{ label: string; href?: string }> = [
    { label: 'Topics', href: '/topics/' },
  ];

  for (const ancestor of node.ancestors) {
    items.push({
      label: ancestor.title,
      href: `/topics/${ancestor.slug}/`,
    });
  }

  items.push({ label: node.topic.title });
  return items;
}
