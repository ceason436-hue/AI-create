const prompt = `你好`;
fetch('http://localhost:3000/api/minimax/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: "user", name: "User", content: prompt }],
    model: "abab6.5s-chat"
  })
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2))).catch(err => console.error(err));
