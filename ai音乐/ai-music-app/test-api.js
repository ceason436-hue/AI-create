async function test() {
  const url = 'https://api.minimaxi.com/v1/chat/completions';
  const apiKey = 'sk-api-SEHXU_1XIX45FXrgv6RYmZCfR1Q9NdS1_THJcfjqY1gxb51P1w7826058HeJEOWUlzerN487AOMkbHpPPKCErG7M9GB_TOQPNf4Y-FErAC9BHF1L3-AEuik';
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