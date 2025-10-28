import { Course, Person, Company, Lesson } from '../types';

// Declaration for the html2pdf library loaded from CDN
declare const html2pdf: any;
// Declaration for the xlsx (SheetJS) library loaded from CDN
declare const XLSX: any;
// Declaration for the jszip library loaded from CDN
declare const JSZip: any;


const downloadFile = (filename: string, content: string | Blob, mimeType: string) => {
  const element = document.createElement('a');
  const file = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const generateMarkdown = (course: Course): string => {
  let md = `# ${course.title}\n\n`;
  md += `## Description\n${course.description}\n\n`;

  md += `## Learning Outcomes\n`;
  course.learningOutcomes.forEach(o => md += `* ${o}\n`);
  md += '\n';
  
  md += `## Key Assignment\n${course.keyAssignment}\n\n`;

  md += `## Curriculum\n`;
  course.curriculum.forEach(day => {
    md += `### Day ${day.day}: ${day.title}\n`;
    day.modules.forEach(module => {
      md += `#### ${module.title}\n`;
      module.lessons.forEach(lesson => {
        md += `* **${lesson.title}**: ${lesson.description}\n`;
      });
    });
    md += '\n';
  });

  md += `## Potential Instructors\n`;
  course.potentialInstructors.forEach(p => md += `* [${p.name}](${p.linkedin}) - ${p.title}\n`);
  md += '\n';

  md += `## Potential Client Leads\n`;
  course.potentialLeads.forEach(c => {
    if ('expertiseSummary' in c) {
        md += `* [${c.name}](${c.linkedin}) - ${c.title}\n`
    } else {
        md += `* [${c.name}](${c.linkedin}) - ${c.reason}\n`
    }
  });
  md += '\n';

  md += `## FAQ\n`;
  course.faq.forEach(f => {
    md += `### ${f.question}\n`;
    md += `${f.answer}\n\n`;
  });

  return md;
};

export const exportToMarkdown = (course: Course) => {
  const markdown = generateMarkdown(course);
  downloadFile(`${course.title}.md`, markdown, 'text/markdown');
};

export const exportToTxt = (course: Course) => {
  const markdown = generateMarkdown(course);
  const text = markdown.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // Remove links for plain text
  downloadFile(`${course.title}.txt`, text, 'text/plain');
};

export const exportToJson = (course: Course) => {
  const json = JSON.stringify(course, null, 2);
  downloadFile(`${course.title}.json`, json, 'application/json');
};

export const exportToPdf = (course: Course) => {
  const contentElement = document.getElementById('course-content');
  if (contentElement) {
    const opt = {
      margin: 0.5,
      filename: `${course.title.replace(/ /g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };
    html2pdf().set(opt).from(contentElement).save();
  } else {
    console.error("Could not find element with id 'course-content' to export.");
  }
};

export const exportInstructorsToXlsx = (instructors: Person[], courseTitle: string) => {
    const wb = XLSX.utils.book_new();

    const instructorsData = [["Name", "Title", "LinkedIn", "Location", "Score", "Summary"]];
    instructors.forEach(p => {
        instructorsData.push([p.name, p.title || '', p.linkedin, p.location || '', p.relevancyScore.toString(), p.expertiseSummary]);
    });
    const wsInstructors = XLSX.utils.aoa_to_sheet(instructorsData);
    XLSX.utils.book_append_sheet(wb, wsInstructors, "Potential Instructors");

    XLSX.writeFile(wb, `${courseTitle.replace(/ /g, '_')}_Instructors.xlsx`);
};

export const exportLeadsToXlsx = (leads: (Person | Company)[], courseTitle: string) => {
    const wb = XLSX.utils.book_new();
    
    const leadsData = [["Name", "Role/Title", "Reason/Summary", "LinkedIn", "Location", "Score"]];
    leads.forEach(lead => {
        if ('expertiseSummary' in lead) { // Person
            const p = lead as Person;
            leadsData.push([p.name, p.title || '', p.expertiseSummary, p.linkedin, p.location || '', p.relevancyScore.toString()]);
        } else { // Company
            const c = lead as Company;
            leadsData.push([c.name, 'Company', c.relevancyReason || c.reason || '', c.linkedin, c.location || '', (c.relevancyScore ?? '').toString()]);
        }
    });
    const wsLeads = XLSX.utils.aoa_to_sheet(leadsData);
    XLSX.utils.book_append_sheet(wb, wsLeads, "Potential Leads");
    
    XLSX.writeFile(wb, `${courseTitle.replace(/ /g, '_')}_Leads.xlsx`);
};

// --- SCORM Export ---

const escapeXml = (unsafe: string): string => 
    unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });

const generateLessonHtml = (lesson: Lesson, courseTitle: string): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeXml(lesson.title)}</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; padding: 2em; }
        h1 { color: #333; }
        h2 { color: #555; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        pre { background-color: #f4f4f4; padding: 1em; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }
    </style>
</head>
<body>
    <h1>${escapeXml(courseTitle)}</h1>
    <h2>${escapeXml(lesson.title)}</h2>
    <p>${escapeXml(lesson.description)}</p>
    ${lesson.lectureNotes ? `
    <h2>Lecture Notes</h2>
    <pre>${escapeXml(lesson.lectureNotes)}</pre>
    ` : ''}
    ${lesson.keyTalkingPoints ? `
    <h2>Key Talking Points</h2>
    <pre>${escapeXml(lesson.keyTalkingPoints)}</pre>
    ` : ''}
    ${lesson.quizQuestions ? `
    <h2>Quiz Questions</h2>
    <pre>${escapeXml(lesson.quizQuestions)}</pre>
    ` : ''}
</body>
</html>`;
};

const generateImsManifest = (course: Course): string => {
    const courseIdentifier = `com.ai.course.${Date.now()}`;
    let itemsXml = '';
    let resourcesXml = '';
    let lessonCounter = 0;

    course.curriculum.forEach((day, dayIndex) => {
        itemsXml += `<item identifier="DAY_${day.day}" identifierref="" isvisible="true"><title>${escapeXml(day.title)}</title>\n`;
        day.modules.forEach((module, modIndex) => {
            itemsXml += `<item identifier="MOD_${day.day}_${modIndex}" identifierref="" isvisible="true"><title>${escapeXml(module.title)}</title>\n`;
            module.lessons.forEach((lesson) => {
                lessonCounter++;
                const lessonIdentifier = `LESSON_${lessonCounter}`;
                const lessonHref = `lessons/lesson_${lessonCounter}.html`;
                itemsXml += `<item identifier="${lessonIdentifier}" identifierref="RES_${lessonIdentifier}" isvisible="true"><title>${escapeXml(lesson.title)}</title></item>\n`;
                resourcesXml += `<resource identifier="RES_${lessonIdentifier}" type="webcontent" adlcp:scormtype="sco" href="${lessonHref}">\n<file href="${lessonHref}"/>\n</resource>\n`;
            });
            itemsXml += `</item>\n`;
        });
        itemsXml += `</item>\n`;
    });

    return `<?xml version="1.0" standalone="no" ?>
<manifest identifier="${courseIdentifier}" version="1.1"
    xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
    xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
    <metadata>
        <schema>ADL SCORM</schema>
        <schemaversion>1.2</schemaversion>
        <lom xmlns="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1">
            <general>
                <title>
                    <langstring xml:lang="en-US">${escapeXml(course.title)}</langstring>
                </title>
                <description>
                    <langstring xml:lang="en-US">${escapeXml(course.description)}</langstring>
                </description>
            </general>
        </lom>
    </metadata>
    <organizations default="ORG-1">
        <organization identifier="ORG-1">
            <title>${escapeXml(course.title)}</title>
            ${itemsXml}
        </organization>
    </organizations>
    <resources>
        ${resourcesXml}
    </resources>
</manifest>`;
};


export const exportToScorm = async (course: Course) => {
    try {
        const zip = new JSZip();
        
        const manifestXml = generateImsManifest(course);
        zip.file('imsmanifest.xml', manifestXml);

        let lessonCounter = 0;
        course.curriculum.forEach(day => {
            day.modules.forEach(module => {
                module.lessons.forEach(lesson => {
                    lessonCounter++;
                    const lessonHtml = generateLessonHtml(lesson, course.title);
                    zip.file(`lessons/lesson_${lessonCounter}.html`, lessonHtml);
                });
            });
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadFile(`${course.title.replace(/ /g, '_')}_SCORM.zip`, zipBlob, 'application/zip');
    } catch (error) {
        console.error("Failed to generate SCORM package:", error);
        alert("An error occurred while creating the SCORM package. See the console for details.");
    }
};