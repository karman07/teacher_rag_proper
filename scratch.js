const apiKey = "0fc07f68244dbc29ea18c73d3ae19ab6cea43916";

fetch('https://api.deepgram.com/v1/speak?model=aura-asteria-en', {
  method: 'POST',
  headers: {
    'Authorization': `Token ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ text: "Hello there" }),
})
  .then(async res => {
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  })
  .catch(console.error);
