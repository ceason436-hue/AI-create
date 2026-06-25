const prompt = `请联网搜索上海沪教版二到六年级语文课本中的课文《小红帽》的原文内容。`;
fetch('http://localhost:3000/api/minimax/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: "user", name: "User", content: prompt }],
    model: "abab6.5s-chat",
    tools: [{ type: "web_search" }]
  })
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2))).catch(err => console.error(err));
