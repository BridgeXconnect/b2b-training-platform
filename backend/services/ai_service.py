"""
AI Service for Course Generation and CEFR Validation
Integrates with OpenAI GPT-4 for intelligent content creation
"""

import os
import json
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from openai import AsyncOpenAI
from pydantic import BaseModel
import logging
from datetime import datetime
import sentry_sdk
from config.sentry_config import SentryConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CourseGenerationRequest(BaseModel):
    company_name: str
    industry: str
    target_cefr_level: str
    current_cefr_level: str
    course_duration: int  # in hours
    participant_count: int
    focus_areas: List[str]
    sop_content: Optional[str] = None
    sop_analysis: Optional[Dict[str, Any]] = None
    specific_goals: List[str] = []
    delivery_method: str = "hybrid"

class CEFRValidationResult(BaseModel):
    score: float  # 0-100
    level_appropriate: bool
    recommendations: List[str]
    vocabulary_complexity: str
    grammar_complexity: str
    content_complexity: str

class CourseModule(BaseModel):
    id: str
    title: str
    description: str
    duration: int  # in minutes
    learning_objectives: List[str]
    lessons: List[Dict[str, Any]]
    assessments: List[Dict[str, Any]]
    sop_references: List[str]

class AIService:
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            logger.warning("OPENAI_API_KEY not set. AI features will be disabled.")
            self.client = None
        else:
            self.client = AsyncOpenAI(api_key=api_key)
        
        self.model = "gpt-4-turbo-preview"
        self.max_retries = 3
        
    def _check_client_available(self):
        """Check if OpenAI client is available"""
        if self.client is None:
            raise Exception("OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.")
        
    async def generate_course(self, request: CourseGenerationRequest) -> Dict[str, Any]:
        """Generate a complete course structure using AI with Sentry monitoring"""
        self._check_client_available()
        
        with sentry_sdk.start_transaction(op="ai_service", name="generate_course") as transaction:
            try:
                # Set transaction context
                transaction.set_tag("company", request.company_name)
                transaction.set_tag("cefr_level", request.target_cefr_level)
                transaction.set_tag("industry", request.industry)
                transaction.set_tag("duration", request.course_duration)
                
                logger.info(f"Generating course for {request.company_name} - CEFR {request.target_cefr_level}")
                
                # Add breadcrumb for course generation start
                sentry_sdk.add_breadcrumb(
                    message=f"Starting course generation for {request.company_name}",
                    category="ai_service",
                    level="info",
                    data={
                        "company_name": request.company_name,
                        "cefr_level": request.target_cefr_level,
                        "duration": request.course_duration
                    }
                )
                
                # Generate course outline
                course_outline = await self._generate_course_outline(request)
                
                # Generate detailed modules
                modules = await self._generate_course_modules(request, course_outline)
                
                # Validate CEFR alignment
                cefr_validation = await self._validate_cefr_alignment(modules, request.target_cefr_level)
                
                # Create complete course structure
                course = {
                    "title": f"Business English Training for {request.company_name}",
                    "description": f"CEFR {request.target_cefr_level} aligned English training incorporating company-specific terminology and procedures",
                    "cefr_level": request.target_cefr_level,
                    "total_duration": request.course_duration,
                    "modules": modules,
                    "cefr_validation": cefr_validation.dict(),
                    "generation_metadata": {
                        "generated_at": datetime.utcnow().isoformat(),
                        "model_used": self.model,
                        "sop_integrated": bool(request.sop_content),
                        "focus_areas": request.focus_areas
                    }
                }
                
                # Add success breadcrumb
                sentry_sdk.add_breadcrumb(
                    message=f"Course generated successfully with {len(modules)} modules",
                    category="ai_service",
                    level="info",
                    data={"modules_count": len(modules)}
                )
                
                logger.info(f"Course generated successfully with {len(modules)} modules")
                return course
                
            except Exception as e:
                logger.error(f"Error generating course: {str(e)}")
                
                # Capture AI service error with context
                SentryConfig.capture_ai_service_error(e, {
                    "company_name": request.company_name,
                    "cefr_level": request.target_cefr_level,
                    "operation": "generate_course",
                    "model": self.model
                })
                raise
    
    async def _generate_course_outline(self, request: CourseGenerationRequest) -> Dict[str, Any]:
        """Generate high-level course structure"""
        
        sop_context = ""
        if request.sop_content:
            sop_context = f"""
            
SOP INTEGRATION CONTEXT:
The course must integrate the following company-specific content:
{request.sop_content[:2000]}  # Limit context length

Key areas from SOP analysis:
- Focus Areas: {', '.join(request.focus_areas)}
- Industry: {request.industry}
"""

        prompt = f"""You are an expert English language course designer specializing in CEFR-aligned business English training.

Create a comprehensive course outline for the following requirements:

COMPANY: {request.company_name}
INDUSTRY: {request.industry}
CURRENT LEVEL: {request.current_cefr_level}
TARGET LEVEL: {request.target_cefr_level}
DURATION: {request.course_duration} hours
PARTICIPANTS: {request.participant_count}
DELIVERY: {request.delivery_method}
GOALS: {', '.join(request.specific_goals)}

{sop_context}

CEFR {request.target_cefr_level} REQUIREMENTS:
- A1: Basic phrases, simple interactions, familiar topics
- A2: Simple sentences, routine tasks, direct information exchange
- B1: Clear standard input, work/leisure topics, produce simple connected text
- B2: Complex text, interact fluently, clear detailed text on wide subjects
- C1: Wide range of texts, recognize implicit meaning, fluent spontaneous expression
- C2: Virtually everything, fine shades of meaning, fluent precise expression

Generate a course outline with:
1. Course title and description
2. Overall learning objectives (4-6 objectives)
3. Module breakdown (calculate modules based on duration: 1 module per 8 hours)
4. Module titles and focus areas
5. SOP integration strategy

Return as JSON with this structure:
{{
    "course_title": "string",
    "course_description": "string", 
    "total_modules": number,
    "learning_objectives": ["string"],
    "modules_overview": [
        {{
            "module_number": number,
            "title": "string",
            "focus_area": "string",
            "duration_hours": number,
            "sop_integration": "string"
        }}
    ],
    "assessment_strategy": "string"
}}"""

        response = await self._make_openai_request(prompt)
        return json.loads(response)
    
    async def _generate_course_modules(self, request: CourseGenerationRequest, outline: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate detailed course modules"""
        
        modules = []
        
        for module_info in outline["modules_overview"]:
            module = await self._generate_single_module(
                request, 
                module_info, 
                outline["learning_objectives"]
            )
            modules.append(module)
            
            # Add small delay to avoid rate limiting
            await asyncio.sleep(0.5)
        
        return modules
    
    async def _generate_single_module(self, request: CourseGenerationRequest, module_info: Dict[str, Any], course_objectives: List[str]) -> Dict[str, Any]:
        """Generate a single detailed module"""
        
        lessons_per_module = 4  # Standard 4 lessons per module
        lesson_duration = int((module_info["duration_hours"] * 60) / lessons_per_module)
        
        sop_integration = ""
        if request.sop_content:
            sop_integration = f"""
SOP INTEGRATION for {module_info['title']}:
{module_info.get('sop_integration', 'General business procedures')}

Available SOP Content: {request.sop_content[:1000]}
"""

        prompt = f"""Create detailed content for this course module:

MODULE: {module_info['title']}
FOCUS AREA: {module_info['focus_area']}
CEFR LEVEL: {request.target_cefr_level}
DURATION: {module_info['duration_hours']} hours
COMPANY: {request.company_name}
INDUSTRY: {request.industry}

{sop_integration}

Create {lessons_per_module} lessons, each {lesson_duration} minutes long.

For CEFR {request.target_cefr_level}, ensure:
- Vocabulary appropriate to proficiency level
- Grammar structures matching CEFR criteria  
- Task complexity suitable for level
- Real workplace scenarios from company SOPs

Return JSON with this structure:
{{
    "id": "module-{module_info['module_number']}",
    "title": "{module_info['title']}",
    "description": "string",
    "duration": {module_info['duration_hours'] * 60},
    "learning_objectives": ["4-5 specific objectives"],
    "lessons": [
        {{
            "id": "lesson-{module_info['module_number']}-X",
            "title": "string",
            "duration": {lesson_duration},
            "description": "string",
            "activities": [
                {{
                    "id": "activity-X",
                    "type": "reading|vocabulary|speaking|writing|listening",
                    "title": "string",
                    "instructions": "string",
                    "content": "string",
                    "sop_integrated": boolean,
                    "estimated_time": number,
                    "cefr_skills": ["specific CEFR skills addressed"]
                }}
            ],
            "materials": ["list of required materials"],
            "cefr_focus": "{request.target_cefr_level}"
        }}
    ],
    "assessments": [
        {{
            "id": "assessment-{module_info['module_number']}",
            "type": "quiz|practical|presentation",
            "title": "string",
            "description": "string",
            "questions": [
                {{
                    "id": "string",
                    "type": "multiple_choice|short_answer|practical_task",
                    "question": "string",
                    "options": ["array for multiple choice"],
                    "correct_answer": "string",
                    "sop_context": "string",
                    "cefr_skill": "string"
                }}
            ],
            "cefr_level": "{request.target_cefr_level}",
            "passing_score": 75
        }}
    ],
    "sop_references": ["specific SOP sections referenced"]
}}"""

        response = await self._make_openai_request(prompt)
        return json.loads(response)
    
    async def _validate_cefr_alignment(self, modules: List[Dict[str, Any]], target_level: str) -> CEFRValidationResult:
        """Validate course content against CEFR standards"""
        
        # Extract sample content for analysis
        sample_content = []
        for module in modules[:2]:  # Analyze first 2 modules
            for lesson in module.get("lessons", [])[:2]:  # First 2 lessons each
                sample_content.append({
                    "module": module["title"],
                    "lesson": lesson["title"],
                    "activities": lesson.get("activities", [])
                })
        
        prompt = f"""Analyze this course content for CEFR {target_level} alignment:

CONTENT SAMPLE:
{json.dumps(sample_content, indent=2)}

CEFR {target_level} CRITERIA:
- A1: 500-1000 high frequency words, present tense, basic phrases
- A2: 1000-2000 words, past/future tense, simple descriptions  
- B1: 2000-3000 words, complex sentences, opinions/experiences
- B2: 3000-4000 words, abstract topics, detailed arguments
- C1: 4000-5000 words, sophisticated language, nuanced expression
- C2: 5000+ words, precision/fluency equal to educated native speaker

Evaluate:
1. Vocabulary complexity and range
2. Grammar structures used
3. Task cognitive demands
4. Text/content complexity
5. Communication requirements

Provide validation score (0-100) and specific recommendations.

Return JSON:
{{
    "score": number,
    "level_appropriate": boolean,
    "recommendations": ["specific improvement suggestions"],
    "vocabulary_complexity": "appropriate|too_simple|too_complex",
    "grammar_complexity": "appropriate|too_simple|too_complex", 
    "content_complexity": "appropriate|too_simple|too_complex",
    "detailed_analysis": "string explaining the assessment"
}}"""

        response = await self._make_openai_request(prompt)
        validation_data = json.loads(response)
        
        return CEFRValidationResult(
            score=validation_data["score"],
            level_appropriate=validation_data["level_appropriate"],
            recommendations=validation_data["recommendations"],
            vocabulary_complexity=validation_data["vocabulary_complexity"],
            grammar_complexity=validation_data["grammar_complexity"],
            content_complexity=validation_data["content_complexity"]
        )
    
    async def analyze_sop_document(self, sop_text: str, company_info: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze SOP document for course integration"""
        self._check_client_available()
        
        prompt = f"""Analyze this Standard Operating Procedure document for English training course integration:

COMPANY: {company_info.get('name', 'Unknown')}
INDUSTRY: {company_info.get('industry', 'Business')}

SOP CONTENT:
{sop_text[:4000]}  # Limit to 4000 chars

Extract and analyze:
1. Key industry terminology and vocabulary
2. Communication requirements and scenarios
3. Required business processes and procedures
4. Professional language patterns
5. Training focus areas for English skills
6. Suggested CEFR level based on complexity
7. Specific workplace scenarios for practice

Return JSON:
{{
    "industry_terminology": ["list of 10-15 key terms"],
    "communication_needs": ["list of communication scenarios"],
    "key_processes": ["main business processes"],
    "language_patterns": ["formal expressions and phrases used"],
    "training_focus": ["specific English skill areas to emphasize"],
    "suggested_cefr_level": "A1|A2|B1|B2|C1|C2",
    "workplace_scenarios": ["realistic scenarios for practice"],
    "vocabulary_complexity": "assessment of language difficulty",
    "document_summary": "brief summary of SOP content"
}}"""

        response = await self._make_openai_request(prompt)
        return json.loads(response)
    
    async def _make_openai_request(self, prompt: str, temperature: float = 0.7) -> str:
        """Make request to OpenAI with retry logic and Sentry monitoring"""
        
        with sentry_sdk.start_span(op="openai", description="chat_completion") as span:
            span.set_tag("model", self.model)
            span.set_tag("temperature", temperature)
            span.set_tag("max_tokens", 4000)
            
            # Add breadcrumb for OpenAI request
            sentry_sdk.add_breadcrumb(
                message="Making OpenAI API request",
                category="ai_service",
                level="debug",
                data={
                    "model": self.model,
                    "temperature": temperature,
                    "prompt_length": len(prompt)
                }
            )
            
            for attempt in range(self.max_retries):
                try:
                    response = await self.client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {
                                "role": "system", 
                                "content": "You are an expert English language course designer with deep knowledge of CEFR standards and business English training. Always return valid JSON responses."
                            },
                            {"role": "user", "content": prompt}
                        ],
                        temperature=temperature,
                        max_tokens=4000
                    )
                    
                    result = response.choices[0].message.content.strip()
                    
                    # Add success breadcrumb
                    sentry_sdk.add_breadcrumb(
                        message="OpenAI API request successful",
                        category="ai_service",
                        level="debug",
                        data={
                            "attempt": attempt + 1,
                            "response_length": len(result),
                            "usage": response.usage.dict() if response.usage else None
                        }
                    )
                    
                    return result
                    
                except Exception as e:
                    logger.warning(f"OpenAI request attempt {attempt + 1} failed: {str(e)}")
                    
                    # Add breadcrumb for retry
                    sentry_sdk.add_breadcrumb(
                        message=f"OpenAI API request failed (attempt {attempt + 1})",
                        category="ai_service",
                        level="warning",
                        data={
                            "attempt": attempt + 1,
                            "error": str(e),
                            "max_retries": self.max_retries
                        }
                    )
                    
                    if attempt == self.max_retries - 1:
                        # Capture final failure
                        SentryConfig.capture_ai_service_error(e, {
                            "operation": "openai_request",
                            "model": self.model,
                            "attempts": self.max_retries,
                            "prompt_length": len(prompt)
                        })
                        raise
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
            
            raise Exception("Max retries exceeded for OpenAI request")

# Global AI service instance
ai_service = AIService()