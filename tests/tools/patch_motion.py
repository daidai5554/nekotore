# お手本の定義行を key 単位で差し替える調整用スクリプト
# 使い方: python tests/tools/patch_motion.py index.html patches.txt
#   patches.txt は「key<TAB>{ ...定義... }」を1行ずつ
import sys, re
p, patch = sys.argv[1], sys.argv[2]
s = open(p, encoding='utf-8').read()
for raw in open(patch, encoding='utf-8'):
    raw = raw.rstrip('\n')
    if not raw.strip() or raw.startswith('#'):
        continue
    key, body = raw.split('\t', 1)
    if key.startswith('MOT.'):
        pat = re.compile(r'^' + re.escape(key) + r' = .*;$', re.M)
        m = pat.search(s); assert m, key
        s = s[:m.start()] + key + ' = ' + body + ';' + s[m.end():]
        continue
    pat = re.compile(r'^  ' + key + r': \{.*\},?$', re.M)
    m = pat.search(s); assert m, key
    comma = ',' if m.group(0).endswith(',') else ''
    s = s[:m.start()] + '  ' + key + ': ' + body + comma + s[m.end():]
open(p, 'w', encoding='utf-8').write(s)
print('patched')
