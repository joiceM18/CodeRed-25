import os
import re
import httpx
from typing import List, Dict

# Simple subject keyword map for fallback classification
SUBJECT_KEYWORDS = {
    'mathematics': ['math', 'algebra', 'geometry', 'calculus', 'equation', 'numbers'],
    'physics': ['physics', 'force', 'energy', 'quantum', 'relativity'],
    'chemistry': ['chemistry', 'molecule', 'reaction', 'chemical', 'atom'],
    'biology': ['biology', 'cell', 'evolution', 'organism', 'genetics'],
    'history': ['history', 'ancient', 'war', 'revolution', 'empire'],
    'literature': ['novel', 'poem', 'literature', 'author', 'story'],
    'computer science': ['computer', 'algorithm', 'programming', 'data', 'machine learning'],
    'economics': ['economics', 'market', 'economy', 'supply', 'demand'],
}


def _local_extract_keywords(text: str, top_n: int = 10) -> List[str]:
    # extractor: count unigrams and bigrams (to capture multi-word keywords)
    stopwords = set([
        'the','and','of','to','a','in','is','for','on','that','this','with','as','are','it','an','be','by','or','from','at','also','but','not','into','than','then','so','such','these','those','their','there','here','very','more','most'
    ])
    tokens = re.findall(r"\b[\w']+\b", text.lower())
    unigrams = []
    for t in tokens:
        if t in stopwords or len(t) < 3:
            continue
        unigrams.append(t)

    freqs = {}
    # unigrams
    for u in unigrams:
        if not u.isalpha():
            continue
        freqs[u] = freqs.get(u, 0) + 1

    # bigrams (consecutive tokens that are not stopwords)
    for i in range(len(tokens) - 1):
        a = tokens[i]
        b = tokens[i + 1]
        if a in stopwords or b in stopwords:
            continue
        if len(a) < 2 or len(b) < 2:
            continue
        bigram = f"{a} {b}"
        freqs[bigram] = freqs.get(bigram, 0) + 1

    # sort by frequency then lexicographically
    sorted_items = sorted(freqs.items(), key=lambda x: (-x[1], x[0]))
    # prefer bigrams first when frequencies tie; ensure uniqueness
    results = []
    for k, _ in sorted_items:
        # filter out stopwords-only or low-signal terms
        parts = k.split()
        if any(p in stopwords for p in parts):
            # don't skip if multi-word has strong term + stopword (e.g., 'law of') — simple heuristic: must contain >=1 non-stopword >=3 chars
            if not any((p not in stopwords and len(p) >= 3) for p in parts):
                continue
        if k not in results:
            results.append(k)
        if len(results) >= top_n:
            break
    return results[:top_n]


def _local_classify_subject(text: str) -> str:
    text_low = text.lower()
    scores = {k: 0 for k in SUBJECT_KEYWORDS}
    for subj, keys in SUBJECT_KEYWORDS.items():
        for k in keys:
            if k in text_low:
                scores[subj] += 1
    best = max(scores.items(), key=lambda x: x[1])
    return best[0] if best[1] > 0 else 'general'


def analyze_text(text: str, top_n: int = 10) -> Dict:
    """Analyze text using Google Gemini API if configured, otherwise fallback.

    Returns: { 'subject': str, 'keywords': [str,...] }
    """
    api_key = os.getenv('GEMINI_API_KEY')
    api_url = os.getenv('GEMINI_API_URL')

    if api_key and api_url:
        # Attempt a simple call to the configured Gemini endpoint.
        # The exact request/response shape depends on the API; this is a best-effort
        # wrapper. If it fails, fall back to local extraction.
        try:
            headers = {'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}
            prompt = (
                f"Classify the subject of the following educational text (one word or phrase)"
                f" and list the top {top_n} keywords. Return JSON like: {{\"subject\":...,\"keywords\":[...]}}\n\nTEXT:\n" + text
            )
            payload = {"prompt": prompt}
            with httpx.Client(timeout=30.0) as client:
                r = client.post(api_url, headers=headers, json=payload)
                r.raise_for_status()
                data = r.json()
                # try to extract JSON from response; support different shapes
                if isinstance(data, dict) and 'subject' in data and 'keywords' in data:
                    return {'subject': data['subject'], 'keywords': data['keywords']}
                # fallback: try parse text content
                text_out = data.get('output') or data.get('text') or ''
                m = re.search(r'\{.*\}', text_out, re.S)
                if m:
                    try:
                        import json

                        j = json.loads(m.group(0))
                        return {'subject': j.get('subject', 'general'), 'keywords': j.get('keywords', [])}
                    except Exception:
                        pass
        except Exception:
            # fall through to local fallback
            pass

    # local fallback
    subject = _local_classify_subject(text)
    keywords = _local_extract_keywords(text, top_n=top_n)
    return {'subject': subject, 'keywords': keywords}
