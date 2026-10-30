"""生成可单独分享的离线 HTML。运行：python3 scripts/build_example.py"""
from pathlib import Path
import json, re
root = Path(__file__).resolve().parents[1]
data = json.loads((root / 'data/longVideoRevenue.json').read_text())
html = (root / 'templates/revenue.html').read_text()
encoded = json.dumps(data, ensure_ascii=False).replace('</', '<\\/')
html = re.sub(r'(<script id="ogv-data" type="application/json">).*?(</script>)', lambda m: m[1] + encoded + m[2], html, flags=re.S)
vendor = (root / 'vendor/echarts.min.js').read_text()
html = html.replace('<script src="../vendor/echarts.min.js"></script>', '<script>' + vendor.replace('</script', '<\\/script') + '</script>')
out = root / 'examples/revenue-standalone.html'
out.write_text(html)
print(out)
