#!/usr/bin/env python3
# Remove o fundo de imagens em lote (carrega o modelo UMA vez).
# Entrada: linhas "origem|destino" via stdin. Saída PNG transparente.
#   /tmp/rembg-venv/bin/python scripts/rembg_batch.py < lista.txt
import sys
from rembg import remove, new_session
from PIL import Image

session = new_session("u2net")
print("modelo carregado", flush=True)

for line in sys.stdin:
    line = line.strip()
    if not line or "|" not in line:
        continue
    src, dst = line.split("|", 1)
    try:
        img = Image.open(src).convert("RGBA")
        out = remove(img, session=session)
        out.save(dst)
        print(f"OK {dst}", flush=True)
    except Exception as e:
        print(f"ERR {src}: {e}", flush=True)
