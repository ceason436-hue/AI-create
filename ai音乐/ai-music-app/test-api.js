async function test() {
  const url = 'https://api.minimaxi.com/v1/chat/completions';
  const apiKey = 'sk-api-BwkioMIw9ejuI7XECpDCwyPr3G5oSuiEbDm98ZzylwS4bOqnFWkIDkWg-Q598HryOeqcUUT8kbp-zbRQB994w3Bwydi9KfB9jPnL9VW329BiaeIxyCccLW0';
  const payload = {
    model: "MiniMax-M2.7",
    messages: [
      { role: "system", content: "hello" },
      { role: "user", content: "test" }
    ]
  };
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Response text:", text);
}

test();