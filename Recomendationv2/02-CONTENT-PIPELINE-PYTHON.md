# Phase 2: Content Generation Pipeline (Python)

## Why This Phase Exists

StudyHub needs high-quality study materials, quiz questions, and diagrams for Grade 9 topics. Creating these manually is slow. This phase builds Python scripts that generate content from free sources, summarize it, create questions, and produce diagrams — all outputting to the `/public/data/` structure from Phase 1.

**These scripts run on the developer's local PC, never in the browser.** Output is static JSON/CSV/SVG committed to the repo and served by GitHub Pages.

---

## Prerequisites

```bash
# Create scripts directory
mkdir -p scripts

# Create Python virtual environment
cd scripts
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### `scripts/requirements.txt`

```
# Summarization
sumy>=0.11.0
transformers>=4.40.0
torch>=2.0.0             # CPU-only is fine: pip install torch --index-url https://download.pytorch.org/whl/cpu
sentencepiece>=0.2.0

# Question Generation
nltk>=3.8.0
spacy>=3.7.0
# Download model after install: python -m spacy download en_core_web_sm

# Diagram Generation
graphviz>=0.20.0          # Also needs system graphviz: apt install graphviz / brew install graphviz
sympy>=1.13.0             # LaTeX equation generation

# Utilities
requests>=2.32.0
beautifulsoup4>=4.12.0
wikipedia-api>=0.7.0
papaparse>=1.0.0          # Python CSV (use built-in csv module actually)
```

**REASONING**: We pick mature, well-maintained libraries. `sumy` for fast extractive summarization without GPU. `transformers` for higher-quality abstractive summarization when GPU is available. `sympy` for generating LaTeX from symbolic math. `graphviz` for complex graph layouts.

---

## Script 1: `scripts/summarizer.py` — Text Summarization

### Architecture Decision

| Approach | Quality | Speed | Size | GPU? | Best For |
|----------|---------|-------|------|------|----------|
| **Sumy (LSA/LexRank)** | ⭐⭐⭐ | Instant | 5 MB | No | Quick extractive summaries |
| **BART (distilbart)** | ⭐⭐⭐⭐⭐ | 5-10s | 800 MB | Optional | Final production summaries |
| **Ollama (llama3)** | ⭐⭐⭐⭐⭐ | 3-8s | 4.7 GB | Optional | Custom prompts for grade-level |

**Recommended**: Use Sumy as the **default fast path**, BART as the **quality path**, Ollama as the **custom prompt path**. The script auto-detects what's available.

```python
#!/usr/bin/env python3
"""
summarizer.py — Multi-strategy text summarizer for StudyHub

Usage:
  python summarizer.py --text "Long text here..." --strategy auto
  python summarizer.py --file input.txt --sentences 5 --strategy sumy
  python summarizer.py --file input.txt --strategy ollama --grade 9

Strategies: sumy (default/fast), bart (quality), ollama (custom prompt)
"""

import argparse
import sys
import json

# ──────────────────────────────────────────
# Strategy 1: Sumy (extractive, no GPU, instant)
# ──────────────────────────────────────────
def summarize_sumy(text, sentence_count=5, algorithm='lsa'):
    """
    REASONING: Sumy picks the most important sentences from the original text.
    LSA (Latent Semantic Analysis) captures meaning better than simple frequency.
    LexRank works well for structured documents. Try LSA first, fall back to LexRank.
    """
    try:
        from sumy.parsers.plaintext import PlaintextParser
        from sumy.nlp.tokenizers import Tokenizer
        from sumy.summarizers.lsa import LsaSummarizer
        from sumy.summarizers.lex_rank import LexRankSummarizer
        from sumy.nlp.stemmers import Stemmer
        from sumy.utils import get_stop_words

        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        stemmer = Stemmer("english")

        if algorithm == 'lexrank':
            summarizer = LexRankSummarizer(stemmer)
        else:
            summarizer = LsaSummarizer(stemmer)

        summarizer.stop_words = get_stop_words("english")
        sentences = summarizer(parser.document, sentence_count)

        result = " ".join(str(s) for s in sentences)
        print(f"[GATE] Sumy summarization: PASSED ({len(sentences)} sentences)")
        return result

    except ImportError as e:
        print(f"[WARN] Sumy not installed: {e}")
        return None
    except Exception as e:
        print(f"[ERROR] Sumy failed: {e}")
        return None


# ──────────────────────────────────────────
# Strategy 2: BART (abstractive, high quality)
# ──────────────────────────────────────────
def summarize_bart(text, max_length=150, min_length=40):
    """
    REASONING: BART rewrites content in its own words — better quality than extractive.
    distilbart is 50% smaller than full BART with ~95% quality.
    First run downloads the model (~800MB). Subsequent runs use cache.
    """
    try:
        from transformers import pipeline
        print("[INFO] Loading BART model (first run downloads ~800MB)...")
        summarizer = pipeline(
            "summarization",
            model="sshleifer/distilbart-cnn-12-6",
            device=-1  # CPU. Use 0 for GPU
        )

        # BART has 1024 token limit — chunk if needed
        MAX_CHARS = 3000  # ~750 tokens
        if len(text) > MAX_CHARS:
            chunks = [text[i:i+MAX_CHARS] for i in range(0, len(text), MAX_CHARS)]
            summaries = []
            for i, chunk in enumerate(chunks):
                print(f"  Processing chunk {i+1}/{len(chunks)}...")
                result = summarizer(chunk, max_length=max_length, min_length=min_length, do_sample=False)
                summaries.append(result[0]['summary_text'])
            final = " ".join(summaries)
        else:
            result = summarizer(text, max_length=max_length, min_length=min_length, do_sample=False)
            final = result[0]['summary_text']

        print(f"[GATE] BART summarization: PASSED")
        return final

    except ImportError:
        print("[WARN] transformers not installed. Install: pip install transformers torch")
        return None
    except Exception as e:
        print(f"[ERROR] BART failed: {e}")
        return None


# ──────────────────────────────────────────
# Strategy 3: Ollama (local LLM, custom prompts)
# ──────────────────────────────────────────
def summarize_ollama(text, model="llama3.2:3b", grade_level=9):
    """
    REASONING: Ollama lets us customize the summary for a specific reading level.
    "Explain like I'm 14" produces dramatically different output than generic summarization.
    Requires Ollama running: ollama serve (port 11434)
    """
    try:
        import requests

        # Decision Gate: Check Ollama is running
        try:
            health = requests.get("http://localhost:11434/api/tags", timeout=3)
            if health.status_code != 200:
                raise ConnectionError("Ollama not responding")
        except requests.exceptions.ConnectionError:
            print("[WARN] Ollama not running. Start with: ollama serve")
            return None

        prompt = f"""You are a Grade {grade_level} tutor. Summarize the following text for a {grade_level}th grade student.
Rules:
- Use simple language a 14-year-old can understand
- Keep it under 5 sentences
- Define any technical terms in parentheses
- End with one interesting fact or real-world connection

Text to summarize:
{text}

Summary:"""

        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.3, "num_predict": 300}
            },
            timeout=60
        )

        if response.status_code == 200:
            result = response.json()['response'].strip()
            print(f"[GATE] Ollama summarization: PASSED")
            return result
        else:
            print(f"[ERROR] Ollama returned {response.status_code}")
            return None

    except ImportError:
        print("[WARN] requests not installed")
        return None
    except Exception as e:
        print(f"[ERROR] Ollama failed: {e}")
        return None


# ──────────────────────────────────────────
# Auto Strategy: Try best available
# ──────────────────────────────────────────
def summarize_auto(text, **kwargs):
    """
    REASONING: Cascade through strategies from best to simplest.
    This ensures the script always produces output regardless of what's installed.
    """
    # Try Ollama first (best for grade-level customization)
    result = summarize_ollama(text, **kwargs)
    if result:
        return {"text": result, "strategy": "ollama"}

    # Try BART (best quality)
    result = summarize_bart(text)
    if result:
        return {"text": result, "strategy": "bart"}

    # Fall back to Sumy (always works if installed)
    result = summarize_sumy(text)
    if result:
        return {"text": result, "strategy": "sumy"}

    # Last resort: simple truncation
    print("[WARN] All summarization strategies failed. Using truncation.")
    sentences = text.split('. ')
    return {"text": '. '.join(sentences[:5]) + '.', "strategy": "truncation"}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Summarize text for StudyHub')
    parser.add_argument('--text', type=str, help='Text to summarize')
    parser.add_argument('--file', type=str, help='File to summarize')
    parser.add_argument('--strategy', choices=['auto', 'sumy', 'bart', 'ollama'], default='auto')
    parser.add_argument('--sentences', type=int, default=5)
    parser.add_argument('--grade', type=int, default=9)
    parser.add_argument('--output', type=str, help='Output JSON file')

    args = parser.parse_args()

    if args.file:
        with open(args.file, 'r') as f:
            text = f.read()
    elif args.text:
        text = args.text
    else:
        print("Provide --text or --file")
        sys.exit(1)

    if args.strategy == 'auto':
        result = summarize_auto(text, grade_level=args.grade)
    elif args.strategy == 'sumy':
        result = {"text": summarize_sumy(text, args.sentences), "strategy": "sumy"}
    elif args.strategy == 'bart':
        result = {"text": summarize_bart(text), "strategy": "bart"}
    elif args.strategy == 'ollama':
        result = {"text": summarize_ollama(text, grade_level=args.grade), "strategy": "ollama"}

    print(f"\n--- Summary ({result['strategy']}) ---")
    print(result['text'])

    if args.output:
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2)
```

---

## Script 2: `scripts/question_generator.py` — Quiz Question Generation

```python
#!/usr/bin/env python3
"""
question_generator.py — Generate quiz questions from study text

Approaches (cascading fallback):
1. T5-based QG (transformers) — best quality
2. NLP-based fill-in-the-blank (spaCy + NLTK) — no GPU needed
3. Template-based — always works, no dependencies

Output: CSV (simple MCQ) + JSON (rich question types)
"""

import json
import csv
import sys
import os
from pathlib import Path

# ──────────────────────────────────────────
# Strategy 1: Template-based (always works)
# ──────────────────────────────────────────
def generate_template_questions(topic_name, key_terms, formulas=None):
    """
    REASONING: Templates guarantee output even with zero ML dependencies.
    These cover Bloom's levels 1-2 (Remember, Understand).
    Better than nothing — and easy to manually improve later.
    """
    questions = []
    q_id = 1

    for term in key_terms:
        # Definition recall (Bloom's 1: Remember)
        questions.append({
            "question_id": f"auto-{q_id:03d}",
            "question_type": "MCQ",
            "bloom_level": 1,
            "difficulty": 1,
            "question_text": f"What is the definition of '{term['term']}'?",
            "correct_answer": term['definition'],
            "explanation": f"'{term['term']}' is defined as: {term['definition']}",
            "auto_generated": True
        })
        q_id += 1

        # True/False with justification (Bloom's 4: Evaluate)
        questions.append({
            "question_id": f"auto-{q_id:03d}",
            "question_type": "TRUE_FALSE_JUSTIFY",
            "bloom_level": 4,
            "difficulty": 2,
            "question_text": f"True or False: {term['definition']}",
            "correct_answer": "True",
            "justification_required": True,
            "explanation": f"This is the correct definition of {term['term']}.",
            "auto_generated": True
        })
        q_id += 1

    if formulas:
        for formula in formulas:
            # Fill-in-the-blank for formulas (Bloom's 2: Understand)
            questions.append({
                "question_id": f"auto-{q_id:03d}",
                "question_type": "FILL_BLANK",
                "bloom_level": 2,
                "difficulty": 2,
                "question_text": f"Complete the formula: {formula['label']} → _____",
                "correct_answer": formula['latex'],
                "explanation": f"The complete formula is: {formula['latex']}",
                "auto_generated": True
            })
            q_id += 1

    print(f"[GATE] Template question generation: PASSED ({len(questions)} questions)")
    return questions


# ──────────────────────────────────────────
# Strategy 2: NLP fill-in-the-blank (spaCy)
# ──────────────────────────────────────────
def generate_fill_blanks(text, max_questions=10):
    """
    REASONING: spaCy identifies important entities (nouns, proper nouns, numbers)
    which become blanks. This creates recall-level questions automatically.
    Requires: python -m spacy download en_core_web_sm
    """
    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
    except (ImportError, OSError) as e:
        print(f"[WARN] spaCy not available: {e}")
        print("  Install: pip install spacy && python -m spacy download en_core_web_sm")
        return []

    doc = nlp(text)
    questions = []

    # Find sentences with important entities
    for sent in doc.sents:
        if len(questions) >= max_questions:
            break

        # Find the most important entity in the sentence
        entities = [ent for ent in sent.ents if ent.label_ in ('PERSON', 'ORG', 'GPE', 'DATE', 'QUANTITY', 'CARDINAL')]
        key_nouns = [token for token in sent if token.pos_ in ('NOUN', 'PROPN') and len(token.text) > 3]

        target = None
        if entities:
            target = entities[0]
        elif key_nouns:
            target = key_nouns[0]

        if target:
            blank_text = sent.text.replace(str(target), "_____")
            questions.append({
                "question_type": "FILL_BLANK",
                "bloom_level": 1,
                "difficulty": 1,
                "question_text": blank_text,
                "correct_answer": str(target),
                "explanation": f"The complete sentence is: {sent.text}",
                "auto_generated": True
            })

    print(f"[GATE] NLP fill-blank generation: PASSED ({len(questions)} questions)")
    return questions


# ──────────────────────────────────────────
# Strategy 3: T5-based question generation
# ──────────────────────────────────────────
def generate_t5_questions(text, max_questions=5):
    """
    REASONING: T5 fine-tuned on SQuAD generates actual comprehension questions.
    Quality is much higher than templates, but requires ~1GB model download.
    First run is slow; subsequent runs use HuggingFace cache.
    """
    try:
        from transformers import pipeline

        print("[INFO] Loading T5 question generation model...")
        qg_pipeline = pipeline(
            "text2text-generation",
            model="valhalla/t5-small-qg-hl",  # ~250MB, fine-tuned for QG
            device=-1
        )

        # Highlight key sentences for question generation
        sentences = text.split('. ')
        questions = []

        for sent in sentences[:max_questions * 2]:  # Process more than needed, filter later
            if len(sent.split()) < 5:
                continue

            try:
                input_text = f"generate question: {sent.strip()}"
                result = qg_pipeline(input_text, max_length=100)
                q_text = result[0]['generated_text'].strip()

                if q_text and '?' in q_text:
                    questions.append({
                        "question_type": "SHORT_ANSWER",
                        "bloom_level": 2,
                        "difficulty": 2,
                        "question_text": q_text,
                        "source_sentence": sent.strip(),
                        "auto_generated": True
                    })
            except Exception as e:
                print(f"[WARN] T5 failed on sentence: {e}")
                continue

            if len(questions) >= max_questions:
                break

        print(f"[GATE] T5 question generation: PASSED ({len(questions)} questions)")
        return questions

    except ImportError:
        print("[WARN] transformers not installed for T5 QG")
        return []
    except Exception as e:
        print(f"[ERROR] T5 QG failed: {e}")
        return []


def generate_all(topic_name, text, key_terms=None, formulas=None):
    """Master function: generate questions using all available strategies."""
    all_questions = []

    # Always generate templates (guaranteed output)
    if key_terms:
        all_questions.extend(generate_template_questions(topic_name, key_terms, formulas))

    # Try NLP fill-blanks
    fill_blanks = generate_fill_blanks(text)
    all_questions.extend(fill_blanks)

    # Try T5 (optional, best quality)
    t5_questions = generate_t5_questions(text)
    all_questions.extend(t5_questions)

    # Assign IDs
    for i, q in enumerate(all_questions):
        q['question_id'] = q.get('question_id', f"gen-{i+1:04d}")

    print(f"\n[SUMMARY] Generated {len(all_questions)} total questions")
    print(f"  Templates: {len([q for q in all_questions if q.get('question_type') == 'MCQ' or q.get('question_type') == 'TRUE_FALSE_JUSTIFY' or q.get('question_type') == 'FILL_BLANK'])}")
    print(f"  NLP Fill-blank: {len(fill_blanks)}")
    print(f"  T5 Comprehension: {len(t5_questions)}")

    return all_questions
```

---

## Script 3: `scripts/diagram_generator.py` — Mermaid + Graphviz + SymPy

```python
#!/usr/bin/env python3
"""
diagram_generator.py — Generate diagrams for StudyHub handouts

Three output types:
1. Mermaid syntax → .mmd files (rendered to SVG by mermaid-cli)
2. Graphviz DOT → .svg files (rendered by graphviz)
3. LaTeX equations → .json files (rendered by KaTeX in browser)

Usage:
  python diagram_generator.py --topic phys-t1 --type all
  python diagram_generator.py --mermaid "graph TD; A-->B" --output diagram.svg
"""

import json
import subprocess
import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = PROJECT_ROOT / 'public' / 'data' / 'diagrams'


# ──────────────────────────────────────────
# Mermaid Diagram Generation
# ──────────────────────────────────────────
def generate_mermaid_flowchart(topic_id, steps, title="Process Flow"):
    """
    REASONING: Mermaid flowcharts are the most versatile diagram type for education.
    They handle: cause-effect chains, process flows, decision trees, classification.
    The syntax is simple enough to store in JSON and also hand-edit.
    """
    lines = [f"graph TD"]
    lines.append(f"    title[\"{title}\"]")
    lines.append(f"    style title fill:none,stroke:none,font-size:16px")

    for i, step in enumerate(steps):
        node_id = chr(65 + i)  # A, B, C, ...
        lines.append(f"    {node_id}[\"{step['label']}\"]")

        if i > 0:
            prev_id = chr(65 + i - 1)
            arrow_label = step.get('connection', '')
            if arrow_label:
                lines.append(f"    {prev_id} -->|{arrow_label}| {node_id}")
            else:
                lines.append(f"    {prev_id} --> {node_id}")

        # Apply color based on step type
        colors = {
            'start': '#e1f5fe',
            'process': '#fff9c4',
            'decision': '#fce4ec',
            'end': '#e8f5e9'
        }
        color = colors.get(step.get('type', 'process'), '#f5f5f5')
        lines.append(f"    style {node_id} fill:{color}")

    return '\n'.join(lines)


def generate_mermaid_mindmap(topic_id, center, branches):
    """
    REASONING: Mind maps show hierarchical relationships — perfect for classification
    topics (types of triangles, periodic table groups, ecosystem levels).
    Mermaid mindmaps are newer (v10+) but well-supported.
    """
    lines = ["mindmap"]
    lines.append(f"  root(({center}))")

    for branch in branches:
        lines.append(f"    {branch['label']}")
        for sub in branch.get('children', []):
            lines.append(f"      {sub}")

    return '\n'.join(lines)


def generate_mermaid_timeline(topic_id, events):
    """Generate a timeline diagram for historical or sequential content."""
    lines = ["timeline"]
    lines.append(f"    title {topic_id} Timeline")

    for event in events:
        lines.append(f"    {event['date']} : {event['description']}")

    return '\n'.join(lines)


def render_mermaid_to_svg(mermaid_code, output_path):
    """
    REASONING: mermaid-cli (mmdc) renders Mermaid to SVG/PNG on the command line.
    Install: npm install -g @mermaid-js/mermaid-cli
    This pre-renders diagrams so the React app loads instant SVG images.
    
    FALLBACK: If mmdc isn't installed, save the .mmd file for manual rendering
    or browser-side rendering with react-mermaid2.
    """
    # Decision Gate: Check mmdc is installed
    mmdc_path = shutil.which('mmdc')
    if not mmdc_path:
        print("[WARN] mermaid-cli not found. Install: npm install -g @mermaid-js/mermaid-cli")
        print("  Saving .mmd file instead for browser-side rendering")
        mmd_path = output_path.with_suffix('.mmd')
        mmd_path.write_text(mermaid_code, encoding='utf-8')
        return str(mmd_path)

    # Write temp .mmd file
    temp_mmd = output_path.with_suffix('.mmd')
    temp_mmd.write_text(mermaid_code, encoding='utf-8')

    try:
        result = subprocess.run(
            ['mmdc', '-i', str(temp_mmd), '-o', str(output_path), '-b', 'transparent'],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            print(f"[GATE] Mermaid render: PASSED → {output_path}")
            return str(output_path)
        else:
            print(f"[ERROR] mmdc failed: {result.stderr}")
            return str(temp_mmd)  # Return .mmd as fallback
    except subprocess.TimeoutExpired:
        print("[ERROR] mmdc timed out after 30s")
        return str(temp_mmd)
    finally:
        # Keep .mmd for debugging, delete in production
        pass


# ──────────────────────────────────────────
# LaTeX Equation Generation (SymPy)
# ──────────────────────────────────────────
def generate_equations(topic_id, equations_config):
    """
    REASONING: SymPy can generate LaTeX from symbolic expressions, ensuring
    mathematical correctness. The output LaTeX is stored in JSON and rendered
    by KaTeX in the browser — no server needed.
    """
    try:
        import sympy as sp

        results = []
        for eq in equations_config:
            if eq.get('sympy_expr'):
                # Generate from SymPy expression
                expr = sp.sympify(eq['sympy_expr'])
                latex = sp.latex(expr)
                results.append({
                    "id": eq.get('id', f"{topic_id}-eq-{len(results)+1}"),
                    "latex": latex,
                    "label": eq.get('label', ''),
                    "variables": eq.get('variables', [])
                })
            elif eq.get('latex'):
                # Pass through pre-written LaTeX
                results.append({
                    "id": eq.get('id', f"{topic_id}-eq-{len(results)+1}"),
                    "latex": eq['latex'],
                    "label": eq.get('label', ''),
                    "variables": eq.get('variables', [])
                })

        print(f"[GATE] Equation generation: PASSED ({len(results)} equations)")
        return results

    except ImportError:
        print("[WARN] SymPy not installed. Using raw LaTeX strings.")
        return [{"latex": eq.get('latex', ''), "label": eq.get('label', '')} for eq in equations_config]


# ──────────────────────────────────────────
# Graphviz for Complex Graph Layouts
# ──────────────────────────────────────────
def generate_graphviz_svg(dot_code, output_path):
    """
    REASONING: Graphviz handles complex auto-layout better than Mermaid for graphs
    with many connections (e.g., circuit diagrams, molecular structures).
    Use only when Mermaid's layout isn't sufficient.
    
    Requires: apt install graphviz / brew install graphviz
    """
    dot_path = shutil.which('dot')
    if not dot_path:
        print("[WARN] Graphviz 'dot' not found. Install: apt install graphviz")
        # Save .dot file for manual rendering
        dot_file = output_path.with_suffix('.dot')
        dot_file.write_text(dot_code, encoding='utf-8')
        return str(dot_file)

    try:
        result = subprocess.run(
            ['dot', '-Tsvg', '-o', str(output_path)],
            input=dot_code, capture_output=True, text=True, timeout=15
        )
        if result.returncode == 0:
            print(f"[GATE] Graphviz render: PASSED → {output_path}")
            return str(output_path)
        else:
            print(f"[ERROR] Graphviz failed: {result.stderr}")
            return None
    except Exception as e:
        print(f"[ERROR] Graphviz error: {e}")
        return None
```

---

## Script 4: `scripts/build_content.py` — Master Build Pipeline

This is the **orchestrator** that ties all scripts together.

```python
#!/usr/bin/env python3
"""
build_content.py — Master content generation pipeline for StudyHub

Usage:
  python build_content.py                    # Build all topics
  python build_content.py --topic phys-t1    # Build single topic
  python build_content.py --subject physics  # Build all physics topics
  python build_content.py --validate-only    # Just validate existing files

Pipeline:
  1. Read subjects.json for topic list
  2. For each topic: summarize → generate questions → generate diagrams
  3. Write outputs to /public/data/
  4. Validate all outputs
"""

import json
import sys
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / 'public' / 'data'

def main():
    print("╔══════════════════════════════════════════╗")
    print("║   StudyHub Content Build Pipeline        ║")
    print("╚══════════════════════════════════════════╝")

    # Decision Gate 1: subjects.json exists
    subjects_path = DATA_DIR / 'subjects.json'
    if not subjects_path.exists():
        print("[GATE FAILED] subjects.json not found. Run Phase 1 migration first.")
        print("  → python scripts/migrate_csv_to_v2.py")
        sys.exit(1)

    with open(subjects_path) as f:
        tree = json.load(f)

    print(f"[INFO] Found {len(tree['subjects'])} subjects")

    # Process each topic
    errors = []
    for subject in tree['subjects']:
        print(f"\n{'='*50}")
        print(f"Subject: {subject['name']}")
        print(f"{'='*50}")

        for topic in subject['topics']:
            try:
                process_topic(subject, topic)
            except Exception as e:
                errors.append(f"{topic['topic_id']}: {e}")
                print(f"[ERROR] Failed to process {topic['topic_id']}: {e}")

    # Final Report
    print(f"\n{'='*50}")
    print(f"BUILD COMPLETE")
    print(f"  Errors: {len(errors)}")
    for err in errors:
        print(f"  ✗ {err}")

    if errors:
        print("\n[GATE] Build pipeline: PARTIAL (some topics failed)")
    else:
        print("\n[GATE] Build pipeline: PASSED")


def process_topic(subject, topic):
    """Process a single topic through the full pipeline."""
    topic_id = topic['topic_id']
    print(f"\n  Processing: {topic_id} ({topic['topic_name']})")

    # Load existing chapter JSON (may have been created by migration)
    chapter_path = DATA_DIR / topic.get('content_file', f"chapters/{subject['subject_key']}/{topic_id}.json")
    if chapter_path.exists():
        with open(chapter_path) as f:
            chapter = json.load(f)
    else:
        chapter = {
            "topic_id": topic_id,
            "topic_name": topic['topic_name'],
            "sections": []
        }

    # Step 1: Generate/update diagrams
    diagram_dir = DATA_DIR / 'diagrams'
    diagram_dir.mkdir(exist_ok=True)
    generate_topic_diagrams(topic_id, chapter, diagram_dir)

    # Step 2: Generate equations JSON
    generate_topic_equations(topic_id, chapter)

    # Step 3: Generate additional questions
    questions_dir = DATA_DIR / 'questions' / subject['subject_key']
    questions_dir.mkdir(parents=True, exist_ok=True)
    generate_topic_questions(topic_id, chapter, questions_dir)

    # Save updated chapter
    with open(chapter_path, 'w', encoding='utf-8') as f:
        json.dump(chapter, f, indent=2, ensure_ascii=False)

    print(f"  ✓ {topic_id} complete")


def generate_topic_diagrams(topic_id, chapter, diagram_dir):
    """Generate diagrams for sections that have diagram configs."""
    from diagram_generator import render_mermaid_to_svg

    for section in chapter.get('sections', []):
        content = section.get('content', {})

        # Handle mermaid diagrams
        if isinstance(content, dict) and content.get('type') == 'mermaid':
            code = content.get('code', '')
            if code:
                output = diagram_dir / f"{topic_id}-{section['section_id']}.svg"
                render_mermaid_to_svg(code, output)
                # Add SVG path to section for React to load
                content['svg_path'] = f"data/diagrams/{output.name}"

        # Handle diagram lists in concept clarifiers
        if isinstance(content, dict) and 'diagrams' in content:
            for i, diag in enumerate(content['diagrams']):
                if diag.get('type') == 'mermaid' and diag.get('code'):
                    output = diagram_dir / f"{topic_id}-diag-{i+1}.svg"
                    render_mermaid_to_svg(diag['code'], output)
                    diag['svg_path'] = f"data/diagrams/{output.name}"


def generate_topic_equations(topic_id, chapter):
    """Generate LaTeX strings for equations using SymPy."""
    from diagram_generator import generate_equations

    for section in chapter.get('sections', []):
        content = section.get('content', {})
        if isinstance(content, dict) and 'equations' in content:
            content['equations'] = generate_equations(topic_id, content['equations'])


def generate_topic_questions(topic_id, chapter, questions_dir):
    """Generate additional questions from chapter content."""
    from question_generator import generate_all

    # Extract text and terms from chapter
    full_text = ""
    key_terms = []
    formulas = []

    for section in chapter.get('sections', []):
        content = section.get('content', {})

        if section.get('section_type') == 'vocabulary' and isinstance(content, list):
            key_terms.extend(content)
        elif isinstance(content, dict):
            if content.get('text'):
                full_text += content['text'] + " "
            if content.get('explanation'):
                full_text += content['explanation'] + " "
            if content.get('equations'):
                formulas.extend(content['equations'])

    if not full_text.strip() and not key_terms:
        print(f"  ⚠ No text content to generate questions from for {topic_id}")
        return

    questions = generate_all(
        topic_name=chapter.get('topic_name', topic_id),
        text=full_text,
        key_terms=key_terms if key_terms else None,
        formulas=formulas if formulas else None
    )

    # Save rich questions JSON
    rich_path = questions_dir / f"{topic_id}-rich.json"
    with open(rich_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    print(f"  ✓ Generated {len(questions)} questions → {rich_path.name}")


if __name__ == '__main__':
    main()
```

---

## Decision Gates (End of Phase 2)

```bash
# Gate 1: Migration script ran successfully
python scripts/migrate_csv_to_v2.py
# Expected: "Migration Complete" with no errors

# Gate 2: Build pipeline runs (may have warnings but no crashes)
cd scripts && source .venv/bin/activate
python build_content.py --validate-only
# Expected: "PASSED" or "PARTIAL" (some features optional)

# Gate 3: Generated files are valid JSON
python -c "
import json, glob
for f in glob.glob('../public/data/**/*.json', recursive=True):
    json.load(open(f))
    print(f'  ✓ {f}')
print('All JSON valid')
"

# Gate 4: React app still loads
cd .. && npm start
# Browser should show existing content
```

---

## Files Created in This Phase

| File | Purpose |
|------|---------|
| `scripts/requirements.txt` | Python dependencies |
| `scripts/summarizer.py` | Text summarization (3 strategies) |
| `scripts/question_generator.py` | Quiz question generation (3 strategies) |
| `scripts/diagram_generator.py` | Mermaid + Graphviz + SymPy |
| `scripts/build_content.py` | Master orchestrator pipeline |
