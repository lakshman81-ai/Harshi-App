import * as XLSX from 'xlsx';
import { log } from '../utils';

/**
 * Excel Exporter Service
 * Creates and downloads Excel files with generated content
 */
export class ExcelExporter {
    /**
     * Create and download an Excel file from generated content
     */
    static exportToExcel(data, filename = 'StudyHub_Generated_Data.xlsx') {
        log('Creating Excel workbook...');

        const workbook = XLSX.utils.book_new();

        // Add Subjects sheet
        if (data.subjects && data.subjects.length > 0) {
            const subjectsSheet = XLSX.utils.json_to_sheet(data.subjects);
            XLSX.utils.book_append_sheet(workbook, subjectsSheet, 'Subjects');
        }

        // Add Topics sheet
        if (data.topics && data.topics.length > 0) {
            const topicsSheet = XLSX.utils.json_to_sheet(data.topics);
            XLSX.utils.book_append_sheet(workbook, topicsSheet, 'Topics');
        }

        // Add Topic_Sections sheet
        if (data.sections && data.sections.length > 0) {
            const sectionsSheet = XLSX.utils.json_to_sheet(data.sections);
            XLSX.utils.book_append_sheet(workbook, sectionsSheet, 'Topic_Sections');
        }

        // Add Learning_Objectives sheet
        if (data.objectives && data.objectives.length > 0) {
            const objectivesSheet = XLSX.utils.json_to_sheet(data.objectives);
            XLSX.utils.book_append_sheet(workbook, objectivesSheet, 'Learning_Objectives');
        }

        // Add Key_Terms sheet
        if (data.keyTerms && data.keyTerms.length > 0) {
            const termsSheet = XLSX.utils.json_to_sheet(data.keyTerms);
            XLSX.utils.book_append_sheet(workbook, termsSheet, 'Key_Terms');
        }

        // Add Study_Content sheet
        if (data.content && data.content.length > 0) {
            const contentSheet = XLSX.utils.json_to_sheet(data.content);
            XLSX.utils.book_append_sheet(workbook, contentSheet, 'Study_Content');
        }

        // Add Formulas sheet
        if (data.formulas && data.formulas.length > 0) {
            const formulasSheet = XLSX.utils.json_to_sheet(data.formulas);
            XLSX.utils.book_append_sheet(workbook, formulasSheet, 'Formulas');
        }

        // Add Quiz_Questions sheet
        if (data.quizzes && data.quizzes.length > 0) {
            const quizzesSheet = XLSX.utils.json_to_sheet(data.quizzes);
            XLSX.utils.book_append_sheet(workbook, quizzesSheet, 'Quiz_Questions');
        }

        // Add Achievements sheet
        if (data.achievements && data.achievements.length > 0) {
            const achievementsSheet = XLSX.utils.json_to_sheet(data.achievements);
            XLSX.utils.book_append_sheet(workbook, achievementsSheet, 'Achievements');
        }

        // Generate the file and trigger download
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        log('Excel file downloaded:', filename);
        return true;
    }

    /**
     * Update existing Excel data with new content (merges data)
     */
    static mergeAndExport(existingData, newData, filename = 'StudyHub_Updated_Data.xlsx') {
        const mergedData = {
            subjects: [...(existingData.subjects || []), ...(newData.subjects || [])],
            topics: [...(existingData.topics || []), ...(newData.topics || [])],
            sections: [...(existingData.sections || []), ...(newData.sections || [])],
            objectives: [...(existingData.objectives || []), ...(newData.objectives || [])],
            keyTerms: [...(existingData.keyTerms || []), ...(newData.keyTerms || [])],
            content: [...(existingData.content || []), ...(newData.content || [])],
            formulas: [...(existingData.formulas || []), ...(newData.formulas || [])],
            quizzes: [...(existingData.quizzes || []), ...(newData.quizzes || [])],
            achievements: newData.achievements || existingData.achievements || []
        };

        return this.exportToExcel(mergedData, filename);
    }
}
