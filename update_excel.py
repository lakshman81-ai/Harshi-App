import pandas as pd
import json
import os
import shutil

def update_excel():
    # File paths
    json_path = 'content_update_v3.json'
    excel_path = 'StudyHub_Complete_Data.xlsx'
    backup_path = excel_path.replace('.xlsx', '_backup_v3.xlsx')
    
    # ... (skipping load logic which is same) ...
    # Load JSON data
    print("Loading JSON data...")
    with open(json_path, 'r') as f:
        data = json.load(f)
        
    # (Backup logic same) ...
    if os.path.exists(excel_path):
        shutil.copy2(excel_path, backup_path)
    
    # Load Excel ...
    try:
        xls = pd.read_excel(excel_path, sheet_name=None)
    except:
        xls = {} # Basic fallback

    # Prepare lists for new rows
    sections_rows = []
    content_rows = []
    questions_rows = []
    
    for subject_data in data:
        topic_id = subject_data.get('topicId')
        
        # ... (sections logic same) ...
        # Process Sections
        if 'sections' in subject_data:
            for section in subject_data['sections']:
                sections_rows.append({
                    'topic_id': topic_id,
                    'section_id': section.get('id'),
                    'title': section.get('title'),
                    'icon': section.get('icon', 'BookOpen'),
                    'section_type': section.get('type', 'content'),
                    'order_index': section.get('order', 1)
                })

        # Process Content
        if 'content' in subject_data:
            for idx, item in enumerate(subject_data['content']):
                content_rows.append({
                    'content_id': f"cont-{topic_id}-{idx+200}", # Changed offset for v3
                    'section_id': item.get('sectionId'),
                    'content_type': item.get('type', 'text'),
                    'content_title': item.get('title', 'Info'),
                    'content_text': item.get('text', ''),
                    'video_url': item.get('videoUrl', ''),
                    'image_url': item.get('imageUrl', ''),
                    'description': item.get('description', ''),
                    'order_index': idx + 1
                })

        # Process Questions
        if 'questions' in subject_data:
            for idx, q in enumerate(subject_data['questions']):
                questions_rows.append({
                    'question_id': f"quiz-{topic_id}-{idx+100}",
                    'topic_id': topic_id,
                    'question_text': q.get('question'),
                    'option_a': q['options'][0],
                    'option_b': q['options'][1],
                    'option_c': q['options'][2],
                    'option_d': q['options'][3],
                    'correct_answer': q.get('correctAnswer'),
                    'explanation': q.get('explanation'),
                    'difficulty': q.get('difficulty'),
                    'hint': q.get('hint'),
                    'xp_reward': 10,
                    'image_url': ''
                })

    # Update Topic_Sections Sheet
    if sections_rows:
        print(f"Updating Topic_Sections with {len(sections_rows)} new items...")
        df_new_sections = pd.DataFrame(sections_rows)
        if 'Topic_Sections' in xls:
            # Remove existing sections for these topics to avoid duplicates
            target_topics = set(row['topic_id'] for row in sections_rows)
            xls['Topic_Sections'] = xls['Topic_Sections'][~xls['Topic_Sections']['topic_id'].isin(target_topics)]
            xls['Topic_Sections'] = pd.concat([xls['Topic_Sections'], df_new_sections], ignore_index=True)
        else:
             xls['Topic_Sections'] = df_new_sections

    # Update Study_Content Sheet
    if content_rows:
        print(f"Updating Study_Content with {len(content_rows)} new items...")
        df_new_content = pd.DataFrame(content_rows)
        # Extract topic_id from content_id or section_id to filter? 
        # Easier to filter by checking if section_id belongs to target topics. 
        # But section_id is 'phys-t001-s001'. Starts with topic_id.
        if 'Study_Content' in xls:
            target_topics = set(row['topic_id'] for row in sections_rows) # Use sections_rows to get updated topic IDs
            # Filter: Check if 'topic_id' column exists? No, Study_Content has section_id.
            # We filter rows where section_id starts with any target_topic
            mask = xls['Study_Content']['section_id'].apply(lambda x: any(str(x).startswith(t) for t in target_topics))
            xls['Study_Content'] = xls['Study_Content'][~mask]
            
            xls['Study_Content'] = pd.concat([xls['Study_Content'], df_new_content], ignore_index=True)
        else:
            xls['Study_Content'] = df_new_content

    # Update Quiz_Questions Sheet
    if questions_rows:
        print(f"Updating Quiz_Questions with {len(questions_rows)} new items...")
        df_new_questions = pd.DataFrame(questions_rows)
        if 'Quiz_Questions' in xls:
            target_topics = set(row['topic_id'] for row in questions_rows)
            xls['Quiz_Questions'] = xls['Quiz_Questions'][~xls['Quiz_Questions']['topic_id'].isin(target_topics)]
            xls['Quiz_Questions'] = pd.concat([xls['Quiz_Questions'], df_new_questions], ignore_index=True)
        else:
            xls['Quiz_Questions'] = df_new_questions

    # Save
    print("Saving updated Excel file...")
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        for sheet_name, df in xls.items():
            df.to_excel(writer, sheet_name=sheet_name, index=False)
            
    print("Update complete successfully!")

if __name__ == "__main__":
    update_excel()
