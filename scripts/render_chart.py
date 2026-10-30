"""将标准季度数据映射到图表。仅使用 Python 标准库。"""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('input', type=Path)
parser.add_argument('--output', type=Path, default=Path('output/chart.html'))
args = parser.parse_args()
spec = json.loads(args.input.read_text())
for key in ('title', 'unit', 'source', 'snapshot'):
    if not isinstance(spec.get(key), str) or not spec[key].strip():
        raise ValueError(f'{key} 必须为非空字符串')
kind = spec.get('template', 'quarterly-stacked-bar')
if kind not in ('quarterly-stacked-bar', 'quarterly-line'):
    raise ValueError('模板仅支持 quarterly-stacked-bar、quarterly-line')
platforms = spec.get('series')
if not isinstance(platforms, list) or not 1 <= len(platforms) <= 4 or any(not isinstance(x, str) or not x for x in platforms) or len(set(platforms)) != len(platforms):
    raise ValueError('series 必须包含 1 至 4 个不重复的系列名')
rows = spec.get('rows')
if not isinstance(rows, list) or not rows:
    raise ValueError('rows 不能为空')
seen = set()
for row in rows:
    if not re.fullmatch(r'\d{2}Q[1-4]', str(row.get('period', ''))) or row['period'] in seen:
        raise ValueError('季度必须唯一且格式为 26Q2')
    seen.add(row['period'])
    for name in platforms:
        if name not in row:
            raise ValueError(f'缺少 {name}；未知值请明确填 null')
        v = row[name]
        if v is not None and (type(v) not in (int, float) or not 0 <= v < float('inf')):
            raise ValueError('数值必须为有限非负数或 null')
quarter = spec.get('quarter', 'all')
if quarter not in ('all', 'Q1', 'Q2', 'Q3', 'Q4'):
    raise ValueError('quarter 必须为 all 或 Q1 至 Q4')
def js(value):
    return json.dumps(value, ensure_ascii=False, allow_nan=False).replace('<', '\\u003c')
html = (ROOT / 'templates/revenue.html').read_text()
meta = {'custom': {'title': spec['title'], 'unit': spec['unit'], 'type': 'bar' if kind.endswith('bar') else 'line'}}
html = re.sub(r'const META=.*?;\n', lambda _: 'const META=' + js(meta) + ';\n', html, count=1)
html = re.sub(r'const ORDER=.*?;\n', lambda _: 'const ORDER=' + js(platforms) + ';\n', html, count=1)
html = re.sub(r'(<select id="metric">).*?(</select>)', r'\1<option value="custom">自定义指标</option>\2', html, count=1)
data = {'source': spec['source'], '_snapshot': spec['snapshot'], 'custom': rows}
html = re.sub(r'(<script id="ogv-data" type="application/json">).*?(</script>)', lambda m: m[1] + js(data) + m[2], html, flags=re.S)
html = html.replace('render();\n</script>', "$('quarter').value=" + js(quarter) + ';render();\n</script>')
html = html.replace('OGV 收入图表', '季度数据图表').replace('会员数口径因平台而异，详见数据字典。', '指标口径由数据提供者确认。')
vendor = (ROOT / 'vendor/echarts.min.js').read_text().replace('</script', '<\\/script')
html = html.replace('<script src="../vendor/echarts.min.js"></script>', '<script>' + vendor + '</script>')
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(html)
print(args.output.resolve())
