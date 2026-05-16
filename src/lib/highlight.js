const KEYWORDS = [
  'SELECT','FROM','WHERE','JOIN','LEFT','RIGHT','INNER','OUTER','CROSS','FULL',
  'ON','GROUP BY','ORDER BY','HAVING','LIMIT','OFFSET','WITH','AS','DISTINCT',
  'INSERT INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','INDEX',
  'DROP','ALTER','ADD','COLUMN','PRIMARY KEY','FOREIGN KEY','REFERENCES',
  'UNION','ALL','EXCEPT','INTERSECT','CASE','WHEN','THEN','ELSE','END',
  'AND','OR','NOT','IN','IS','NULL','LIKE','ILIKE','BETWEEN','EXISTS',
  'COUNT','SUM','AVG','MAX','MIN','COALESCE','NULLIF','CAST','CONVERT',
  'DATE_TRUNC','DATE_ADD','DATE_SUB','DATEDIFF','NOW','CURRENT_DATE',
  'CURRENT_TIMESTAMP','INTERVAL','EXTRACT','ROW_NUMBER','RANK','DENSE_RANK',
  'LAG','LEAD','OVER','PARTITION BY','WINDOW','RETURNING','EXPLAIN','ANALYZE',
  'ASC','DESC','TRUE','FALSE','BY','INTO','USING',
  'ARRAY_AGG','STRING_AGG','GROUP_CONCAT','CONCAT','TRIM','UPPER','LOWER',
  'SUBSTRING','REPLACE','ROUND','FLOOR','CEIL','ABS',
]

const KW_RE = new RegExp(
  '\\b(' + KEYWORDS.sort((a,b)=>b.length-a.length).map(k=>k.replace(/\s+/g,'\\s+')).join('|') + ')\\b',
  'gi'
)

export function highlightSQL(sql) {
  let s = sql.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  s = s.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="hl-str">$1</span>')
  s = s.replace(/(--[^\n]*)/g, '<span class="hl-comment">$1</span>')
  s = s.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')
  s = s.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hl-num">$1</span>')
  s = s.replace(KW_RE, m => `<span class="hl-kw">${m.toUpperCase()}</span>`)
  return s
}
