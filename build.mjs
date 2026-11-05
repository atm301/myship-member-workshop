import fs from 'fs';

const parts = ['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11'];
let out = '';
for (const p of parts) {
  let s = fs.readFileSync(p + '.html', 'utf8');
  if (p === 'p8' || p === 'p9') {
    const i = s.lastIndexOf('</script>');
    if (i < 0) { console.error('找不到 </script>：' + p); process.exit(1); }
    s = s.slice(0, i) + s.slice(i + '</script>'.length);
  }
  out += s;
}
fs.writeFileSync('index.html', out, 'utf8');

// 驗證每個 <script> 區塊的語法
const blocks = [...out.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
let bad = 0;
blocks.forEach((m, i) => {
  const tag = m[0].slice(0, m[0].indexOf('>'));
  if (/\bsrc=/.test(tag)) return;
  if (/ld\+json/.test(tag)) {
    try { JSON.parse(m[1]); } catch (e) { bad++; console.error('JSON-LD 格式錯誤：' + e.message); }
    return;
  }
  try { new Function(m[1]); }
  catch (e) { bad++; console.error('script#' + i + ' 語法錯誤：' + e.message); fs.writeFileSync('_bad' + i + '.js', m[1], 'utf8'); }
});

const kb = (Buffer.byteLength(out, 'utf8') / 1024).toFixed(0);
console.log('已合併 index.html　' + kb + ' KB　script 區塊 ' + blocks.length + ' 個　語法錯誤 ' + bad + ' 個');
if (/�/.test(out)) console.error('⚠️ 檔案裡有亂碼字元 U+FFFD');
const dashes = (out.match(/—|--/g) || []).length;
console.log('破折號出現次數：' + dashes);
if (bad) process.exit(1);
