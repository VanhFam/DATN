import * as XLSX from 'xlsx';

/**
 * Phân tích file Excel và trả về danh sách JSON
 * @param {File} file 
 * @param {Object} mapping - Ánh xạ tên cột Excel sang Key của DTO
 * @returns {Promise<Array>}
 */
export const parseExcel = (file, mapping) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { 
                    type: 'array',
                    cellDates: true,
                    dateNF: 'yyyy-mm-dd'
                });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { raw: false });

                // Ánh xạ dữ liệu
                const mappedData = json.map(row => {
                    const obj = {};
                    Object.keys(mapping).forEach(excelCol => {
                        let val = row[excelCol];
                        // Xử lý nếu giá trị là null/undefined
                        if (val === undefined || val === null) {
                            val = "";
                        }
                        obj[mapping[excelCol]] = val;
                    });
                    return obj;
                });

                resolve(mappedData);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
};
