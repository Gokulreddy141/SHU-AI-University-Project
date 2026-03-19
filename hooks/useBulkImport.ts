"use client";

import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { IBulkQuestionInput } from "@/types/question";

export const useBulkImport = (examId: string) => {
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parseCSV = (file: File): Promise<Record<string, unknown>[]> => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data as Record<string, unknown>[]),
                error: (error) => reject(error),
            });
        });
    };

    const parseExcel = (file: File): Promise<Record<string, unknown>[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
                resolve(json);
            };
            reader.onerror = (error) => reject(error);
            reader.readAsBinaryString(file);
        });
    };

    const mapToQuestionInput = (rawData: Record<string, unknown>[]): IBulkQuestionInput[] => {
        return rawData.map((row) => {
            const type = (row.Type as string)?.toString().toUpperCase() === "CODING" ? "CODING" : "MCQ";

            const base: IBulkQuestionInput = {
                type,
                text: (row.Text as string) || (row.Question as string) || "",
                points: Number(row.Points) || 1,
            };

            if (type === "MCQ") {
                // Split options by semicolon
                const optionsStr = (row.Options as string) || "";
                base.options = optionsStr.split(";").map((o: string) => o.trim()).filter((o: string) => o !== "");
                base.correctOptionIndex = Number(row.CorrectIndex) || 0;
            } else {
                const languagesStr = (row.Languages as string) || "";
                base.allowedLanguages = languagesStr.split(";").map((l: string) => l.trim()).filter((l: string) => l !== "");
                base.starterCode = (row.StarterCode as string) || "";
                base.expectedOutput = (row.ExpectedOutput as string)?.toString() || "";
            }

            return base;
        });
    };

    const importFile = async (file: File): Promise<IBulkQuestionInput[]> => {
        setIsParsing(true);
        setError(null);
        try {
            let data: Record<string, unknown>[] = [];
            if (file.name.endsWith(".csv")) {
                data = await parseCSV(file);
            } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
                data = await parseExcel(file);
            } else {
                throw new Error("Unsupported file format. Please use .csv or .xlsx");
            }

            if (data.length === 0) {
                throw new Error("The file appears to be empty.");
            }

            return mapToQuestionInput(data);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setIsParsing(false);
        }
    };

    const saveBulkQuestions = async (questions: IBulkQuestionInput[]) => {
        setIsImporting(true);
        setError(null);
        try {
            const res = await fetch(`/api/exam/${examId}/questions/bulk`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questions }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to import questions");
            }

            return await res.json();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setIsImporting(false);
        }
    };

    return {
        importFile,
        saveBulkQuestions,
        isParsing,
        isImporting,
        error,
    };
};
