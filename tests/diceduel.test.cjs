const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {resolve}=require('node:path');
const root=resolve(__dirname,'..'),game=resolve(root,'DiceDuel');
const read=path=>readFileSync(resolve(root,path),'utf8');
test('old Dice Duel URLs reach the new game without loading the retired online edition',()=>{
  for(const path of ['diceduel-index.html','diceduel-index-backup.html']) {
    const html=read(path);
    assert.match(html,/http-equiv="refresh" content="0; url=\.\/DiceDuel\/"/);
    assert.match(html,/<a href="\.\/DiceDuel\/">Play Dice Duel<\/a>/);
    assert.doesNotMatch(html,/firebase|gstatic|roomRef|cdn\.jsdelivr/);
  }
  const hub=read('hub.js');
  assert.match(hub,/id: "diceduel",[\s\S]*?href: "DiceDuel\/"/);
});
test('the published web bundle has local assets, valid offline files and scoped installation metadata',()=>{
  const html=read('DiceDuel/index.html');
  assert.match(html,/data-edition="web"/);
  assert.doesNotMatch(html,/(?:src|href)=["']https?:|firebase|fonts\.googleapis/);
  for(const match of html.matchAll(/(?:src|href)="(\.\/[^\"]+)"/g)) assert.ok(existsSync(resolve(game,match[1])),match[1]);
  const manifest=JSON.parse(read('DiceDuel/manifest.webmanifest'));
  assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');assert.equal(manifest.display,'standalone');
  for(const icon of manifest.icons) {
    const bytes=readFileSync(resolve(game,icon.src));
    assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`,icon.sizes);
  }
  const sw=read('DiceDuel/sw.js');
  const files=JSON.parse(sw.match(/const FILES=(\[[^\n]+\]);/)[1]);
  assert.ok(files.some(f=>f.startsWith('assets/ai.worker-')));
  assert.ok(files.some(f=>f==='audio/roll-0.ogg'));
  assert.ok(files.some(f=>f.startsWith('fonts/')));
  for(const file of files) {
    assert.ok(!file.includes('..')&&!/^https?:/.test(file));
    assert.ok(existsSync(resolve(game,file)),file);
    assert.doesNotMatch(file,/desktop\.ini|test|\.apk|\.keystore/);
  }
});
