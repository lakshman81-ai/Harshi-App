import os
import json
import sys
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).parent.parent
PUBLIC_DIR = BASE_DIR / "public"

# Config
REQUIRED_SUBJECTS = ["Physics", "Chemistry", "Biology", "Math", "English", "Social"]
REQUIRED_TOPIC_STRUCTURE = ["studyguide", "questionnaire", "Handout"]

# Error collection
report = {
    "status": "success",
    "errors": [],
    "warnings": [],
    "stats": {
        "files_checked": 0,
        "valid_files": 0,
        "invalid_files": 0
    }
}

def log_error(msg, path=None):
    entry = f"[ERROR] {msg}"
    if path: entry += f" ({path})"
    report["errors"].append(entry)
    report["status"] = "failed"

def log_warn(msg, path=None):
    entry = f"[WARN] {msg}"
    if path: entry += f" ({path})"
    report["warnings"].append(entry)

def validate_structure():
    """Main validation logic"""

    # 1. Check Root Subject Folders
    for subject in REQUIRED_SUBJECTS:
        subject_path = PUBLIC_DIR / subject
        if not subject_path.exists():
            # Only warn if it's missing, maybe not all subjects are ready
            log_warn(f"Missing subject folder: {subject}")
            continue

        # 2. Check Topic Folders inside Subject
        # Expecting folders like 'phy-t1', 'math-t2' etc.
        topics = [t for t in subject_path.iterdir() if t.is_dir()]
        if not topics:
            log_warn(f"No topics found for subject {subject}", str(subject_path))
            continue

        for topic in topics:
            validate_topic(topic)

def validate_topic(topic_path):
    """Validate a single topic folder structure"""

    # Check for required subfolders: studyguide, questionnaire, Handout
    for sub in REQUIRED_TOPIC_STRUCTURE:
        sub_path = topic_path / sub
        if not sub_path.exists():
            log_error(f"Missing required subfolder '{sub}' in topic", str(topic_path))
            continue

        # Validate specific subfolder contents
        if sub == "studyguide":
            validate_studyguide(sub_path)
        elif sub == "questionnaire":
            validate_questionnaire(sub_path)
        elif sub == "Handout":
            validate_handout(sub_path)

def validate_studyguide(path):
    """Expects a 'Pages' folder with content"""
    pages_dir = path / "Pages"
    if not pages_dir.exists():
        log_error("Missing 'Pages' directory in studyguide", str(path))
        return

    # Check for index.csv (Master manifest for pages)
    index_file = path / "index.csv"
    if not index_file.exists():
        # Fallback: Check if it's inside Pages/
        if (pages_dir / "index.csv").exists():
            index_file = pages_dir / "index.csv"
        else:
             log_error("Missing 'index.csv' map for studyguide pages", str(path))

    # Check file nomenclature in Pages/
    # Should be PageX.csv, PageX.pdf, PageX.docx etc.
    files = list(pages_dir.glob("*"))
    report["stats"]["files_checked"] += len(files)

    valid_count = 0
    for f in files:
        if f.name == "index.csv": continue

        # Allow any name, but warn if it doesn't look like a page file
        if f.suffix not in ['.csv', '.pdf', '.docx', '.doc', '.jpg', '.png']:
            log_warn(f"Stray or unknown file type: {f.name}", str(f))
        else:
            valid_count += 1

    report["stats"]["valid_files"] += valid_count

def validate_questionnaire(path):
    """Expects 'Quiz' folder"""
    quiz_dir = path / "Quiz"
    if not quiz_dir.exists():
        log_error("Missing 'Quiz' directory", str(path))
        return

    # Expect CSV files
    csvs = list(quiz_dir.glob("*.csv"))
    if not csvs:
        log_warn("No quiz CSV files found", str(quiz_dir))

def validate_handout(path):
    """Expects 'Pages' folder (similar to studyguide)"""
    pages_dir = path / "Pages"
    # Handout might act as a simple container, so lenient check
    if not pages_dir.exists():
         # Maybe it's directly in Handout root?
         pass

if __name__ == "__main__":
    try:
        validate_structure()
    except Exception as e:
        log_error(f"Validation script crashed: {str(e)}")

    # Print JSON output for the server to consume
    print(json.dumps(report, indent=2))
