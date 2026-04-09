export const HASHTAG_REGEX = /(^|\s)#([a-z0-9_]{2,50})/gi;

export const normalizeHashtag = (value = '') =>
  String(value || '')
    .trim()
    .replace(/^#/, '')
    .toLowerCase();

export const extractHashtags = (input = '') => {
  const text = String(input || '');
  const tags = new Set();
  let match;

  while ((match = HASHTAG_REGEX.exec(text)) !== null) {
    tags.add(match[2].toLowerCase());
  }

  return [...tags];
};

export const collectPostHashtags = (post = {}) =>
  Array.isArray(post?.hashtags) && post.hashtags.length > 0
    ? post.hashtags.map(normalizeHashtag).filter(Boolean)
    : extractHashtags(
        [post?.content, post?.articleTitle, post?.eventTitle, post?.codeTitle]
          .filter(Boolean)
          .join(' ')
      );

export const formatHashtagLabel = (tag = '') => `#${normalizeHashtag(tag)}`;
