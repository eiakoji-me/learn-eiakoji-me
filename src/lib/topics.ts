import type { Topic, ContentSummary } from './sanity/types';

export interface TopicNode {
  topic: Topic;
  parent?: TopicNode;
  children: TopicNode[];
  ancestors: Array<{ title: string; slug: string }>;
  descendantIds: Set<string>;
  directArticleCount: number;
  rollupArticleCount: number;
}

export interface TopicTree {
  rootTopics: TopicNode[];
  nodeMap: Map<string, TopicNode>;
  slugMap: Map<string, TopicNode>;
}

export function buildTopicTree(
  topics: Topic[],
  articles: ContentSummary[] = [],
  maxDepth = 4
): TopicTree {
  const nodeMap = new Map<string, TopicNode>();
  const slugMap = new Map<string, TopicNode>();

  // Count direct articles per topic
  const directCounts = new Map<string, number>();
  for (const article of articles) {
    if (article.primaryTopic?._id) {
      const id = article.primaryTopic._id;
      directCounts.set(id, (directCounts.get(id) ?? 0) + 1);
    }
  }

  // Initialize nodes
  for (const t of topics) {
    const directCount = directCounts.get(t._id) ?? t.articleCount ?? 0;
    const node: TopicNode = {
      topic: t,
      children: [],
      ancestors: [],
      descendantIds: new Set(),
      directArticleCount: directCount,
      rollupArticleCount: directCount,
    };
    nodeMap.set(t._id, node);
    slugMap.set(t.slug, node);
  }

  // Build parent-child relationships with cycle detection
  const rootTopics: TopicNode[] = [];

  for (const t of topics) {
    const node = nodeMap.get(t._id)!;
    if (t.parent?._id && nodeMap.has(t.parent._id)) {
      // Cycle detection
      let ancestorId: string | undefined = t.parent._id;
      let depth = 0;
      let hasCycle = false;

      while (ancestorId && depth < maxDepth + 2) {
        if (ancestorId === t._id) {
          hasCycle = true;
          break;
        }
        const ancestorNode = nodeMap.get(ancestorId);
        ancestorId = ancestorNode?.topic.parent?._id;
        depth++;
      }

      if (!hasCycle && depth <= maxDepth) {
        const parentNode = nodeMap.get(t.parent._id)!;
        node.parent = parentNode;
        parentNode.children.push(node);
      } else {
        // Fallback to root if cycle or excess depth detected
        rootTopics.push(node);
      }
    } else {
      rootTopics.push(node);
    }
  }

  // Compute ancestors, descendant sets, and rollup article counts
  function populateNode(node: TopicNode, currentAncestors: Array<{ title: string; slug: string }>) {
    node.ancestors = currentAncestors;
    const nextAncestors = [...currentAncestors, { title: node.topic.title, slug: node.topic.slug }];

    for (const child of node.children) {
      populateNode(child, nextAncestors);
      // Add child and child's descendants to this node's descendant set
      node.descendantIds.add(child.topic._id);
      for (const descId of child.descendantIds) {
        node.descendantIds.add(descId);
      }
      node.rollupArticleCount += child.rollupArticleCount;
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
