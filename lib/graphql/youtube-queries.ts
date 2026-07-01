import { gql } from '@apollo/client';

export const GET_ALL_YOUTUBE_VIDEOS = gql`
  query GetAllYoutubeVideos(
    $limit: Int
    $featured: Boolean
    $category: String
  ) {
    youtubeVideos(limit: $limit, featured: $featured, category: $category) {
      id
      title
      videoId
      description
      category
      isFeatured
      source
      channelId
      playlistId
      publishDate
      duration
      viewCount
      likeCount
      embedUrl
      watchUrl
      thumbnailUrl
      createdAt
      lastSyncedAt
      youtubePublishedAt
    }
  }
`;

export const GET_YOUTUBE_VIDEO = gql`
  query GetYoutubeVideo($id: ID!) {
    youtubeVideo(id: $id) {
      id
      title
      videoId
      description
      category
      isFeatured
      source
      channelId
      playlistId
      publishDate
      duration
      viewCount
      likeCount
      embedUrl
      watchUrl
      thumbnailUrl
      createdAt
      lastSyncedAt
      youtubePublishedAt
    }
  }
`;
