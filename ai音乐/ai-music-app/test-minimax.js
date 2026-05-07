async function test() {
  const url = 'https://api.minimaxi.com/v1/music_generation';
  const apiKey = 'sk-api-4qqnPXptIWg4MJLtmty26ZiHhuTO88O_YI-yZL8MAqN04hdBuIi5oKHcdWSM-kfioF9t4071Kn0Hy0D5SuNCMZpucsYlTUZ5SiwBAqPbzMGKG__N1xzB96Q';

  const payload = {
    model: "music-2.6-free",
    prompt: "一首轻快的钢琴曲",
    lyrics_optimizer: true,
    output_format: "url"
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
