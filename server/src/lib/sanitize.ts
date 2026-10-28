import sanitizeHtml from 'sanitize-html';

const options: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'a',
    'ul',
    'ol',
    'li',
    'h2',
    'h3',
    'h4',
    'blockquote',
    'hr',
    'code',
    'pre',
  ],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
  },
};

export const cleanHtml = (html: string | undefined) => sanitizeHtml(html ?? '', options);

export const cleanLocalizedHtml = (v?: { en?: string; es?: string }) => ({
  en: cleanHtml(v?.en),
  es: cleanHtml(v?.es),
});
