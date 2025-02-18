import pandas as pd
import json

# Ask user for Excel file
file_path = input("Enter the full path to the Excel file: ")

# Load Excel file
xls = pd.ExcelFile(file_path)

# Split into sheets based on 'KELAS'
split_file_path = "split_by_class.xlsx"
df = pd.read_excel(file_path, sheet_name=None, dtype=str)

with pd.ExcelWriter(split_file_path, engine='xlsxwriter') as writer:
    for sheet, data in df.items():
        if 'KELAS' in data.columns and 'NAMA' in data.columns:
            for kelas, group in data.groupby('KELAS'):
                group.to_excel(writer, sheet_name=str(kelas), index=False)

print(f"✅ Excel split by 'KELAS' → {split_file_path}")

# Ask user to choose a class (sheet name)
print("\nAvailable Classes:", list(pd.ExcelFile(split_file_path).sheet_names))
selected_class = input("Enter the class name to process (from sheet name): ")

# Load the selected sheet
df_selected = pd.read_excel(split_file_path, sheet_name=selected_class, dtype=str)

# Extract student names
students = df_selected['NAMA'].dropna().tolist()

# Save to JSON for Puppeteer
data = {
    "class": selected_class,  # Class name is the sheet name
    "students": students
}

with open('students.json', 'w') as json_file:
    json.dump(data, json_file, indent=4)

print(f"✅ Extracted {len(students)} students from '{selected_class}' → Saved to 'students.json'")