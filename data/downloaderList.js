module.exports = [
  {
    no: 1,
    name: 'Facebook Downloader',
    method: 'GET',
    description: 'Download video from Facebook',
    path: '/downloader/fbdl',
    query: 'url'
  },
  {
    no: 2,
    name: 'TikTok Downloader',
    method: 'GET',
    description: 'Download video from TikTok',
    path: '/downloader/tiktok',
    query: 'url'
  },
  {
    no: 3,
    name: 'YouTube MP3',
    method: 'GET',
    description: 'Download MP3 from YouTube',
    path: '/downloader/ytmp3',
    query: 'url'
  },
  {
    no: 4,
    name: 'YouTube MP4',
    method: 'GET',
    description: 'Download MP4 from YouTube',
    path: '/downloader/ytmp4',
    query: 'url'
  },
  {
    no: 5,
    name: 'YouTube Play',
    method: 'GET',
    description: 'Search and play YouTube video',
    path: '/downloader/ytplay',
    query: 'q'
  },
  {
    no: 6,
    name: 'YouTube Search',
    method: 'GET',
    description: 'Search YouTube videos',
    path: '/downloader/ytsearch',
    query: 'q'
  }
];