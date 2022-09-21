document.getElementById('queryToday').addEventListener('click', async () => {

  const passcode = document.getElementById('passcode').value

  const response = await fetch('/stream/', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + passcode
    }
  })

  if (!response.ok) {
    console.log(response)
    alert("잘못된 PASSCODE 입니다.")
    return;
  }

  const reader = response.body.getReader();
  const container = document.getElementById('log-container');
  for await (let line of makeTextFileLineIterator(reader)) {
    let p = document.createElement('p');
    p.append(line);
    container.appendChild(p);
  }
});

async function* makeTextFileLineIterator(reader) {
  const utf8Decoder = new TextDecoder('utf-8');
  let { value: chunk, done: readerDone } = await reader.read();
  chunk = chunk ? utf8Decoder.decode(chunk) : '';

  const re = /\n|\r|\r\n/gm;
  let startIndex = 0;
  let result;

  for (;;) {
    let result = re.exec(chunk);
    if (!result) {
      if (readerDone) {
        break;
      }
      let remainder = chunk.substr(startIndex);
      ({ value: chunk, done: readerDone } = await reader.read());
      chunk = remainder + (chunk ? utf8Decoder.decode(chunk) : '');
      startIndex = re.lastIndex = 0;
      continue;
    }
    yield chunk.substring(startIndex, result.index);
    startIndex = re.lastIndex;
  }
  if (startIndex < chunk.length) {
    // 마지막 줄이 개행 문자로 끝나지 않았을 때
    yield chunk.substr(startIndex);
  }
}