async function test() {
  const url = 'https://api.minimaxi.com/v1/chat/completions';
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    throw new Error('Set MINIMAX_API_KEY in the environment before running this diagnostic script.');
  }
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
