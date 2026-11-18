from docx import Document
from pathlib import Path
for name,path in [('template',r'C:\Users\MPAY\Downloads\Template_Content_Internship Report.docx'),('report',r'C:\Users\MPAY\Downloads\Files\Internship_Report_ncus2445617.docx')]:
 d=Document(path)
 out=[]
 for s in d.sections: out.append('SECTION '+str({x:round(getattr(s,x).inches,3) for x in ['page_width','page_height','top_margin','bottom_margin','left_margin','right_margin']}))
 for i,p in enumerate(d.paragraphs):
  out.append(f'{i} [{p.style.name}] {p.text} || '+str([(r.font.name,r.font.size.pt if r.font.size else None,r.bold) for r in p.runs if r.text][:4])+ ' '+str(p.paragraph_format.line_spacing))
 for i,t in enumerate(d.tables):
  out.append('TABLE '+str(i))
  out.extend(' | '.join(c.text for c in row.cells) for row in t.rows)
 Path('.report_revision/'+name+'.txt').write_text('\n'.join(out),encoding='utf-8')
 print(name, len(d.paragraphs),len(d.tables))
