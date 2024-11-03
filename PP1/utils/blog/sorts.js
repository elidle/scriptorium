// Util functions for implementing sorting by new, old, top, and controversial

export function sortItems(items, sortBy) {
  return items.sort((a, b) => {
    switch (sortBy) {
      case 'new':
        return b.createdAt.getTime() - a.createdAt.getTime();
      
      case 'old':
        return a.createdAt.getTime() - b.createdAt.getTime();
      
      case 'top':
        if (b.metrics.totalScore !== a.metrics.totalScore) {
          return b.metrics.totalScore - a.metrics.totalScore;
        }
        if (b.metrics.totalVotes !== a.metrics.totalVotes) {
          return b.metrics.totalVotes - a.metrics.totalVotes;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      
      case 'controversial':
        if (b.metrics.controversyScore !== a.metrics.controversyScore) {
          return b.metrics.controversyScore - a.metrics.controversyScore;
        }
        if (b.metrics.totalVotes !== a.metrics.totalVotes) {
          return b.metrics.totalVotes - a.metrics.totalVotes;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  })
};