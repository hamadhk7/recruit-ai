import OpenAI from 'openai';

// Fallback parsing when OpenAI API is unavailable
function createFallbackParseResult(resumeText: string) {
  console.log('🔄 Creating fallback parse result...');
  
  // Extract name from filename or text patterns
  let nameFromFile = "Unknown Candidate";
  
  // Try to find name patterns in the text
  const namePatterns = [
    /^([A-Z][a-z]+ [A-Z][a-z]+)/m, // First line name pattern
    /Name:\s*([A-Z][a-z]+ [A-Z][a-z]+)/i,
    /([A-Z][a-z]+ [A-Z][a-z]+)\s*\n/m // Name followed by newline
  ];
  
  for (const pattern of namePatterns) {
    const match = resumeText.match(pattern);
    if (match && match[1]) {
      nameFromFile = match[1].trim();
      break;
    }
  }
  
  // Extract email
  const emailMatch = resumeText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const email = emailMatch ? emailMatch[1] : null;
  
  // Extract phone
  const phoneMatch = resumeText.match(/(\+?[\d\s\-\(\)]{10,})/);
  const phone = phoneMatch ? phoneMatch[1].trim() : null;
  
  // Extract basic skills (common tech keywords)
  const skillKeywords = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'HTML', 'CSS', 
    'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Git', 'TypeScript',
    'Angular', 'Vue', 'PHP', 'C++', 'C#', '.NET', 'Ruby', 'Go', 'Rust'
  ];
  
  const foundSkills = skillKeywords.filter(skill => 
    resumeText.toLowerCase().includes(skill.toLowerCase())
  );
  
  // Basic experience extraction
  const experienceYears = extractExperienceYears(resumeText);
  
  return {
    name: nameFromFile,
    email,
    phone,
    skills: foundSkills.length > 0 ? foundSkills : ['General'],
    experience: [{
      company: "Experience details available in resume",
      position: "See full resume text",
      duration: experienceYears > 0 ? `${experienceYears} years` : "See resume",
      description: "Full experience details extracted from resume text"
    }],
    education: [{
      institution: "Education details in resume",
      degree: "See full resume text",
      year: "See resume"
    }],
    summary: `Professional with ${experienceYears > 0 ? experienceYears + ' years of' : ''} experience. Skills include: ${foundSkills.slice(0, 3).join(', ')}. Full details available in resume text.`,
    processingNote: "Parsed using fallback method due to AI service unavailability"
  };
}

function extractExperienceYears(text: string): number {
  const yearPatterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?experience/i,
    /experience.*?(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*years?\s*in/i
  ];
  
  for (const pattern of yearPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const years = parseInt(match[1]);
      if (years > 0 && years < 50) { // Reasonable range
        return years;
      }
    }
  }
  
  return 0;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseResumeWithAI(resumeText: string) {
  try {
    const prompt = `
You are an expert resume parser. Extract ALL relevant information from this resume text. 

SPECIAL INSTRUCTIONS: If you see "PDF Document:" at the start, this means PDF text extraction is not yet implemented. 
Try to extract the candidate's name from the filename if possible, otherwise use a generic name based on the filename.

Be thorough and accurate. Return ONLY valid JSON with this exact structure:

{
  "name": "Full Name (extract from header/top of resume)",
  "email": "email@example.com",
  "phone": "phone number or null",
  "location": "city, country or null",
  "summary": "Professional summary highlighting key qualifications and experience",
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "experience": [
    {
      "company": "Company Name",
      "role": "Position Title",
      "duration": "Start - End dates",
      "description": "Brief description of role and key achievements"
    }
  ],
  "education": [
    {
      "institution": "University/School Name",
      "degree": "Degree Type",
      "field": "Field of Study",
      "year": "Year or duration"
    }
  ],
  "linkedin": "LinkedIn URL or null",
  "github": "GitHub URL or null",
  "portfolio": "Portfolio URL or null"
}

EXTRACTION GUIDELINES:

NAME EXTRACTION:
- Look for the candidate's full name at the very beginning of the resume
- Names are typically the first line, often in larger text or bold
- Skip headers like "Resume", "CV", "Curriculum Vitae"
- Look for patterns: "FirstName LastName" or "FirstName MiddleName LastName"
- The name should be a proper noun, not a title or description

CONTACT INFORMATION:
- Extract email addresses (look for @ symbol)
- Extract phone numbers (various formats: +country code, parentheses, dashes)
- Extract location (city, state/province, country)
- Extract LinkedIn, GitHub, portfolio URLs

SKILLS EXTRACTION:
- Look for "Skills", "Technical Skills", "Core Competencies" sections
- Extract programming languages, frameworks, tools, technologies
- Include both technical and soft skills
- Look for skills mentioned in experience descriptions
- Be comprehensive - extract ALL skills mentioned

EXPERIENCE EXTRACTION:
- Look for "Experience", "Work Experience", "Professional Experience" sections
- Extract company names, job titles, employment dates
- Include internships, part-time work, research positions
- Summarize key responsibilities and achievements
- Look for quantifiable results and accomplishments

EDUCATION EXTRACTION:
- Look for "Education", "Academic Background" sections
- Extract university/college names, degree types, fields of study
- Include graduation dates, GPAs if mentioned
- Include relevant coursework if highlighted

SUMMARY CREATION:
- Create a 2-3 sentence professional summary
- Highlight years of experience, key skills, and specializations
- Focus on the candidate's strongest qualifications
- Make it compelling and professional

Resume text to parse:
${resumeText}
`;

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are a professional resume parser. Extract information accurately and return ONLY valid JSON. No explanations or additional text." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });
    } catch (apiError: any) {
      console.error('OpenAI API error:', apiError);
      
      // Handle quota exceeded or other API errors gracefully
      if (apiError.status === 429 || apiError.code === 'insufficient_quota') {
        console.warn('⚠️ OpenAI quota exceeded, using fallback parsing...');
        return createFallbackParseResult(resumeText);
      } else if (apiError.status >= 500) {
        console.warn('⚠️ OpenAI service error, using fallback parsing...');
        return createFallbackParseResult(resumeText);
      } else {
        throw apiError; // Re-throw other errors
      }
    }

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Clean the response in case there's extra text
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('OpenAI parsing error:', error);
    
    // Try to extract name manually from the resume text as fallback
    let fallbackName = "Unknown Candidate";
    let fallbackEmail = null;
    let fallbackPhone = null;
    let fallbackSkills = [];
    
    if (resumeText) {
      // Check if this is a PDF placeholder and try to extract name from filename
      if (resumeText.includes("PDF Document:")) {
        const filenameMatch = resumeText.match(/PDF Document: (.+)/);
        if (filenameMatch) {
          const filename = filenameMatch[1];
          // Try to extract name from filename (remove extensions and common words)
          let nameFromFile = filename
            .replace(/\.(pdf|doc|docx|txt)$/i, '') // Remove extension
            .replace(/[_-]/g, ' ') // Replace underscores and dashes with spaces
            .replace(/\b(cv|resume|curriculum|vitae)\b/gi, '') // Remove common resume words
            .replace(/\d+/g, '') // Remove numbers
            .trim();
          
          // Capitalize each word
          if (nameFromFile && nameFromFile.length > 2) {
            fallbackName = nameFromFile
              .split(' ')
              .filter(word => word.length > 0)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
          }
        }
      }
      const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Look for name patterns in the first few lines
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i];
        
        // Skip common resume headers and contact info lines
        if (line.toLowerCase().includes('resume') || 
            line.toLowerCase().includes('curriculum vitae') || 
            line.toLowerCase().includes('cv') ||
            line.toLowerCase().includes('email:') ||
            line.toLowerCase().includes('phone:') ||
            line.toLowerCase().includes('mobile:') ||
            line.toLowerCase().includes('address:') ||
            line.toLowerCase().includes('linkedin:') ||
            line.includes('@') || 
            line.match(/^\+?\d/) ||
            line.match(/^\(\d/)) {
          continue;
        }
        
        // Look for name patterns (2-4 words, each starting with capital letter)
        const namePattern = /^[A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?(?:\s[A-Z][a-z]+)?$/;
        if (namePattern.test(line) && line.length < 50 && line.length > 5) {
          fallbackName = line;
          break;
        }
      }
      
      // Extract email as fallback
      const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        fallbackEmail = emailMatch[0];
      }
      
      // Extract phone as fallback
      const phoneMatch = resumeText.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch) {
        fallbackPhone = phoneMatch[0];
      }
      
      // Extract some basic skills as fallback
      const commonSkills = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS', 'Git', 'Docker', 'AWS', 'MongoDB', 'PostgreSQL', 'TypeScript', 'Angular', 'Vue', 'PHP', 'C++', 'C#', '.NET', 'Spring', 'Django', 'Flask', 'Express', 'Redux', 'GraphQL', 'REST', 'API', 'Microservices', 'Kubernetes', 'Jenkins', 'CI/CD', 'Agile', 'Scrum'];
      
      for (const skill of commonSkills) {
        if (resumeText.toLowerCase().includes(skill.toLowerCase())) {
          fallbackSkills.push(skill);
        }
      }
    }
    
    // Return a basic structure with extracted fallback data if AI fails
    return {
      name: fallbackName,
      email: fallbackEmail,
      phone: fallbackPhone,
      location: null,
      summary: `Resume uploaded as ${fallbackName}. PDF text extraction not yet implemented - manual review recommended.`,
      skills: fallbackSkills.slice(0, 5), // Limit to first 5 skills found from common keywords
      experience: [],
      education: [],
      linkedin: null,
      github: null,
      portfolio: null
    };
  }
}

export async function calculateJobMatch(jobData: any, candidateData: any) {
  try {
    const prompt = `
Analyze how well this candidate matches the job requirements. Be generous but realistic in scoring. Return ONLY valid JSON:

{
  "score": 85,
  "explanation": "Brief explanation of why this score was given",
  "strengths": ["specific strength 1", "specific strength 2"],
  "concerns": ["specific concern 1", "specific concern 2"],
  "recommendation": "strong_fit"
}

Job Details:
Title: ${jobData.title}
Description: ${jobData.description}
Required Skills: ${jobData.requirements?.skills?.join(', ') || 'Not specified'}
Experience Required: ${jobData.requirements?.experience || 'Not specified'}
Location: ${jobData.requirements?.location || 'Not specified'}

Candidate Profile:
Name: ${candidateData.name}
Skills: ${candidateData.aiData?.skills?.join(', ') || 'Not specified'}
Summary: ${candidateData.aiData?.summary || 'Not available'}
Experience: ${candidateData.aiData?.experience?.length || 0} positions listed

Scoring Guidelines (be generous but fair):
- If candidate has relevant skills or experience, give at least 60-70%
- If candidate has some transferable skills, give 50-65%
- Only give very low scores (0-30%) if completely unrelated
- Consider potential and learning ability
- Look for any relevant experience, even if not exact match

Use this scoring guide:
90-100: Perfect match - all requirements met
80-89: Strong fit - most requirements met
70-79: Good fit - many requirements met
60-69: Potential fit - some requirements met
50-59: Weak fit - few requirements met
30-49: Poor fit - minimal relevance
0-29: Not recommended - no relevance

Recommendation options: "strong_fit", "good_fit", "potential_fit", "weak_fit", "not_recommended"
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an expert recruiter. Analyze job-candidate fit objectively and return ONLY valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('OpenAI matching error:', error);
    return {
      score: 50,
      explanation: "AI analysis failed",
      strengths: ["Unable to analyze"],
      concerns: ["AI processing error"],
      recommendation: "weak_fit"
    };
  }
}

export default openai;
