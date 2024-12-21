function calculateMetrics(ratings) {
  const upvotes = ratings.filter(r => r.value === 1).length;
  const downvotes = ratings.filter(r => r.value === -1).length;
  const totalVotes = upvotes + downvotes;
  const totalScore = upvotes - downvotes;
  
  let controversyScore = 0;
  if (totalVotes > 0) {
    const upvoteRatio = upvotes / totalVotes;
    controversyScore = (1 - Math.abs(0.5 - upvoteRatio)) * Math.log10(Math.max(totalVotes, 1));
  }

  return {
    upvotes,
    downvotes,
    totalVotes,
    totalScore,
    controversyScore,
    upvoteRatio: totalVotes > 0 ? (upvotes / totalVotes) : 0
  };
}

export function itemRatingsToMetrics(item) {
  const { ratings, ...cleanItem } = item;
  return {
    ...cleanItem,
    metrics: calculateMetrics(ratings)
  };
}

export function itemsRatingsToMetrics(items) {
  return items.map(itemRatingsToMetrics);
}