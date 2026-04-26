"use client";

import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { IBulkCandidateInput } from "@/types/candidate";

export const useBulkCandidateImport = () => {
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parseCSV = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data),
                error: (error) => reject(error),
            });
        });
    };

    const parseExcel = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                resolve(json);
            };
            reader.onerror = (error) => reject(error);
            reader.readAsBinaryString(file);
        });
    };

    const validateEmail = (email: string) => {
        return email.match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    };

    const mapToCandidateInput = (rawData: any[]): IBulkCandidateInput[] => {
        return rawData.map((row) => ({
            name: (row.Name || row.name || "").trim(),
            email: (row.Email || row.email || "").trim(),
            phone: (row.Phone || row.phone || "").trim(),
            department: (row.Department || row.department || "").trim(),
        })).filter(c => c.name && c.email && validateEmail(c.email));
    };

    const importFile = async (file: File): Promise<IBulkCandidateInput[]> => {
        setIsParsing(true);
        setError(null);
        try {
            let data: any[] = [];
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

            const mapped = mapToCandidateInput(data);
            if (mapped.length === 0) {
                throw new Error("No valid candidates found. Ensure 'Name' and 'Email' columns exist and contain valid data.");
            }

            return mapped;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsParsing(false);
        }
    };

    const saveBulkCandidates = async (examId: string, recruiterId: string, candidates: IBulkCandidateInput[]) => {
        setIsImporting(true);
        setError(null);
        try {
            const res = await fetch(`/api/candidates/bulk`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ examId, recruiterId, candidates }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to import candidates");
            }

            return await res.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsImporting(false);
        }
    };

    return {
        importFile,
        saveBulkCandidates,
        isParsing,
        isImporting,
        error,
    };
};
