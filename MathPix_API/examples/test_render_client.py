"""Example test client for the /api/render/image endpoint.

Sends a sample text payload to the server running at http://localhost:8000 and
saves the returned PNG (or JSON with base64 image + analysis) to a file.

Usage:
    python examples/test_render_client.py

Adjust SERVER_URL below if your server runs on a different host/port.
"""
import requests
import base64
import os

SERVER_URL = os.environ.get('RENDER_SERVER', 'http://localhost:8000')
ENDPOINT = f"{SERVER_URL}/api/render/image"

PAYLOAD = {
    "text": """Chemical Reactions and Energy

In a chemical reaction, reactants are transformed into products through the breaking and forming of chemical bonds. This process often involves changes in energy. Exothermic reactions release energy to the surroundings, while endothermic reactions absorb energy.

For example, the combustion of methane (CH4) with oxygen is a highly exothermic reaction that produces carbon dioxide, water, and releases heat energy. This reaction is commonly used in gas stoves and heating systems.

The rate of chemical reactions can be influenced by several factors:
1. Temperature - Higher temperatures typically increase reaction rates
2. Concentration - More concentrated reactants react faster
3. Surface Area - Larger surface area speeds up reactions
4. Catalysts - These substances increase reaction rates without being consumed""",
    "simple": True,
    "use_gemini": True,
    "top_n_keywords": 6,
    "return_analysis": True,
    "font_size": 18,
    "bg_color": "white",
    "text_color": "black",
    "max_width": 800
}

OUT_DIR = os.path.join(os.path.dirname(__file__), 'out')
os.makedirs(OUT_DIR, exist_ok=True)

print(f"Posting to {ENDPOINT} ...")
resp = requests.post(ENDPOINT, json=PAYLOAD, timeout=30)
resp.raise_for_status()

ct = resp.headers.get('content-type', '')
if 'application/json' in ct:
    j = resp.json()
    img_b64 = j.get('image_base64')
    analysis = j.get('analysis')
    if img_b64:
        out_path = os.path.join(OUT_DIR, 'rendered_image.png')
        with open(out_path, 'wb') as f:
            f.write(base64.b64decode(img_b64))
        print(f"Saved image to {out_path}")
    print('Analysis metadata:')
    print(analysis)
else:
    # raw PNG bytes
    out_path = os.path.join(OUT_DIR, 'rendered_image.png')
    with open(out_path, 'wb') as f:
        f.write(resp.content)
    print(f"Saved image to {out_path}")

print('Done.')
