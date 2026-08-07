const fs = require('fs');
const csv = require('csv-parser');

async function analyzeCSV(filePath) {
  const rows = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => {
        const rowCount = rows.length;
        const columns = Object.keys(rows[0] || {});
        
        // Linhas duplicadas
        const uniqueSet = new Set(rows.map(r => JSON.stringify(r)));
        const duplicateCount = rowCount - uniqueSet.size;

        let totalNulls = 0;

        // Perfil por coluna
        const colStats = columns.map(col => {
          const values = rows.map(r => r[col]).filter(v => v !== '' && v !== null && v !== undefined);
          const nulls = rowCount - values.length;
          totalNulls += nulls;
          
          const uniques = new Set(values).size;
          const isNumeric = values.length > 0 && values.every(v => !isNaN(Number(v)));
          const tipo = isNumeric ? 'numérico' : 'texto';

          let extra = {};
          
          if (isNumeric) {
            const nums = values.map(Number);
            const sum = nums.reduce((a, b) => a + b, 0);
            extra = {
              min: Math.min(...nums),
              max: Math.max(...nums),
              media: Number((sum / nums.length).toFixed(2))
              // Mediana e desvio padrão podem ser adicionados usando libs como 'simple-statistics'
            };
          } else {
            // Contagem para Top 5
            const freq = {};
            values.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
            extra.top5 = Object.entries(freq)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([val, count]) => ({ valor: val, percentual: ((count / rowCount) * 100).toFixed(1) + '%' }));
          }

          return { coluna: col, tipo, nulls, unicos: uniques, ...extra };
        });

        resolve({
          geral: { rowCount, columnCount: columns.length, totalValores: rowCount * columns.length, totalNulls, duplicateCount },
          colunas: colStats,
          preview: rows.slice(0, 20) // Retorna as 20 primeiras linhas
        });
      })
      .on('error', reject);
  });
}

module.exports = { analyzeCSV };