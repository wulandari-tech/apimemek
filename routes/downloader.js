router.get('/downloader', (req, res) => {
  const endpoints = [
    {
      no: 1,
      name: 'Facebook Downloader',
      path: '/downloader/fbdl',
      method: 'GET',
      query: 'url',
      description: 'Download video dari Facebook'
    },
    {
      no: 2,
      name: 'TikTok Downloader',
      path: '/downloader/tiktok',
      method: 'GET',
      query: 'url',
      description: 'Download video dari TikTok'
    },
    {
      no: 3,
      name: 'Youtube Play',
      path: '/downloader/ytplay',
      method: 'GET',
      query: 'q',
      description: 'Cari & play video dari YouTube'
    },
    {
      no: 4,
      name: 'Youtube Search',
      path: '/downloader/ytsearch',
      method: 'GET',
      query: 'q',
      description: 'Cari video dari YouTube'
    },
    {
      no: 5,
      name: 'YouTube MP3',
      path: '/downloader/ytmp3',
      method: 'GET',
      query: 'url',
      description: 'Download video YouTube ke format MP3'
    },
    {
      no: 6,
      name: 'YouTube MP4',
      path: '/downloader/ytmp4',
      method: 'GET',
      query: 'url',
      description: 'Download video YouTube ke format MP4'
    }
  ];

  res.render('downloader', { endpoints });
});