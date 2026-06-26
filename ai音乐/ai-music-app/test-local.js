async function test() {
  const url = 'http://localhost:3000/api/minimax/code';
  const payload = {
    model: "MiniMax-M2.7",
    messages: [
      { role: "user", name: "user", content: "写一个待办事项应用" }
    ]
  };
  const headers = {
    'Content-Type': 'application/json',
  };
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Response text:", text.substring(0, 500));
}

test();