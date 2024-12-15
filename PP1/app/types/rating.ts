export interface Rating {
  id: number;
  userId: number;
  value: number;
}

interface BaseRating {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentRating extends BaseRating {
  commentId: number;
}

export interface PostRating extends BaseRating {
  postId: number;
}

interface RatingRequest {
  value: number;
  userId: number;
}

export interface CommentRatingRequest extends RatingRequest {
  commentId: number;
}

export interface PostRatingRequest extends RatingRequest {
  postId: number;
}