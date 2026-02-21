/**
 * Oura Mate — AI prompt template.
 */

export function getDailyAnalysisPrompt(
    language: string,
    todayData: string,
    trendData: string
): string {
    return `Analyze the user's Oura Ring health data and provide actionable insights.

## Instructions
- Respond in <b>${language}</b> language
- Be specific with numbers and comparisons
- Highlight significant changes (positive or negative)
- Provide practical, personalized daily recommendations
- Keep a warm, encouraging but honest tone
- Use emoji to make the report more engaging
- FORMAT REQUIREMENT: Use basic HTML tags (<b>, <i>) for bolding and italics. NEVER use Markdown asterisks (**).

## Data Provided
### Today's Data
${todayData}

### Past 7-Day Trend
${trendData}

## Required Report Format

📊 <b>Today's Health Overview</b>
Brief 1-2 sentence summary of overall health status today.

💤 <b>Sleep Analysis</b>
- Score and how it compares to the 7-day average
- Sleep duration and stage breakdown (deep/REM/light)
- HRV and heart rate during sleep
- Notable patterns or concerns

🏃 <b>Activity Analysis</b>
- Activity score and step count
- Active calorie burn
- Movement breakdown (high/medium/low intensity)
- How activity compares to recent average

⚡ <b>Readiness Assessment</b>
- Readiness score and key contributors
- HRV balance and resting heart rate trends
- Recovery status
- Body temperature deviation (if notable)

📈 <b>Trend Insights</b> (7-day perspective)
- Key metrics trending up or down
- Consistency patterns
- Comparisons to personal baselines

💡 <b>Today's Recommendations</b>
- 2-3 specific, actionable suggestions based on ALL of the above data
- If readiness is low, suggest recovery activities
- If sleep was poor, suggest sleep hygiene improvements
- If activity is low, suggest movement goals`
}
