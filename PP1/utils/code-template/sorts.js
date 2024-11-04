export function calculateRelevance(template, q) {
  if (!q) return 0;
  if(!template) return 0;
  let relevance = 0;
  console.log(template);
  console.log(q);
  if (template.title && template.title.toLowerCase().includes(q.toLowerCase())) relevance += 10;
  template.tags.forEach(tag => {
    if (tag.name.includes(q)) relevance += 5;
  });
  if (template.explanation && template.explanation.toLowerCase().includes(q.toLowerCase())) relevance += 3;
  if (template.code && template.code.includes(q)) relevance += 1;
  return relevance;
}

export function sortMostRelevantFirst(templates, q) {
  if (!q) return templates;
  const templatesWithRelevance = templates.map(template => ({
    ...template,
    relevance: calculateRelevance(template, q),
  }));
  return templatesWithRelevance.sort((a, b) => b.relevance - a.relevance);
}