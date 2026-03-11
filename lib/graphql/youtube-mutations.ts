import { gql } from '@apollo/client';

export const CREATE_YOUTUBE_VIDEO = gql`
  mutation CreateYoutubeVideo(
    $videoId: String!
    $category: String!
    $isFeatured: Boolean!
  ) {
    createYoutubeVideo(
      videoId: $videoId
      category: $category
      isFeatured: $isFeatured
    ) {
      success
      message
      video {
        id
        title
        videoId
        description
        category
        isFeatured
        embedUrl
        watchUrl
        thumbnailUrl
        viewCount
        likeCount
        duration
        publishDate
      }
    }
  }
`;

export const UPDATE_YOUTUBE_VIDEO = gql`
  mutation UpdateYoutubeVideo(
    $videoId: ID!
    $title: String
    $description: String
    $category: String
    $isFeatured: Boolean
  ) {
    updateYoutubeVideo(
      videoId: $videoId
      title: $title
      description: $description
      category: $category
      isFeatured: $isFeatured
    ) {
      success
      message
      video {
        id
        title
        videoId
        description
        category
        isFeatured
        embedUrl
        watchUrl
        thumbnailUrl
        viewCount
        likeCount
        duration
        publishDate
      }
    }
  }
`;

export const DELETE_YOUTUBE_VIDEO = gql`
  mutation DeleteYoutubeVideo($videoId: ID!) {
    deleteYoutubeVideo(videoId: $videoId) {
      success
      message
    }
  }
`;

export const TOGGLE_VIDEO_FEATURED = gql`
  mutation ToggleVideoFeatured($videoId: ID!) {
    toggleVideoFeatured(videoId: $videoId) {
      success
      message
      video {
        id
        isFeatured
      }
    }
  }
`;

export const SYNC_YOUTUBE_CHANNEL = gql`
  mutation SyncYoutubeChannel(
    $channelId: String
    $maxResults: Int!
    $category: String!
  ) {
    syncYoutubeChannel(
      channelId: $channelId
      maxResults: $maxResults
      category: $category
    ) {
      success
      message
      videosCreated
      videosUpdated
      videosFailed
    }
  }
`;

export const SYNC_YOUTUBE_PLAYLIST = gql`
  mutation SyncYoutubePlaylist(
    $playlistId: String!
    $maxResults: Int!
    $category: String!
  ) {
    syncYoutubePlaylist(
      playlistId: $playlistId
      maxResults: $maxResults
      category: $category
    ) {
      success
      message
      videosCreated
      videosUpdated
      videosFailed
    }
  }
`;
