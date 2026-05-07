async function test() {
  const url = 'https://api.minimaxi.com/v1/text/chatcompletion_v2';
  const apiKey = 'sk-api-4qqnPXptIWg4MJLtmty26ZiHhuTO88O_YI-yZL8MAqN04hdBuIi5oKHcdWSM-kfioF9t4071Kn0Hy0D5SuNCMZpucsYlTUZ5SiwBAqPbzMGKG__N1xzB96Q';

  const payload = {
    model: "abab6.5s-chat",
    messages: [
      { role: "user", content: "Hello" }
    ]
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
