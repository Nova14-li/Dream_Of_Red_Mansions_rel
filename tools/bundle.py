# -*- coding: utf-8 -*-
"""把模块化源码打包成单文件 HTML（便于分发/离线传阅）。

用法：  python tools/bundle.py
输出：  dist/single-file.html
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


html = read("index.html")

# <link rel="stylesheet" href="./assets/css/x.css"> → <style>
def inline_css(m):
    href = m.group(1)
    return "<style>\n" + read(href.lstrip("./")) + "</style>"


html = re.sub(r'<link rel="stylesheet" href="\./([^"]+)">', inline_css, html)

# <script defer src="./assets/js/x.js"></script> → <script>
def inline_js(m):
    src = m.group(1)
    return "<script>\n" + read(src.lstrip("./")) + "\n</script>"


html = re.sub(r'<script defer src="\./([^"]+)"></script>', inline_js, html)

out_dir = os.path.join(ROOT, "dist")
os.makedirs(out_dir, exist_ok=True)
out = os.path.join(out_dir, "single-file.html")
with open(out, "w", encoding="utf-8") as f:
    f.write(html)

print("wrote %s  (%d KB)" % (out, len(html) // 1024))
