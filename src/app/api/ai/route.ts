import {
    UIMessage,
    streamText,
    tool,
    convertToModelMessages,
    stepCountIs,
  } from "ai";
  import { openai } from "@ai-sdk/openai";
  import { z } from "zod";
  import { tavilySearch } from "@tavily/ai-sdk";
  import { promises as fs } from 'fs';
  import path from 'path';

const topicCount = 4;

const topicTool = tool<{ userPrompt: string }, { topics: string[] }>({
    description:  `Get a list of ${topicCount} topics based on what the prompt wants to research.`,
    inputSchema: z.object({
        userPrompt: z.string().describe("The prompt inserted by the user.")
    }),
    execute: async ({userPrompt}) => {
        console.log("IN The tool, got prompt: ", userPrompt)
        const result = await streamText({
            model: openai("gpt-5-mini"),
            prompt: `The user wants to research the following prompt: "${userPrompt}". 
            Generate exactly ${topicCount} specific, research-worthy topics that will provide comprehensive coverage of this subject.
            Focus on topics that:
            - Are distinct and cover different aspects of the subject
            - Are specific enough to find relevant search results
            - Will provide valuable insights when researched
            Return ONLY the topics as a numbered list with no additional text.`,
        })
        const text = await result.text;
        const topics = text.split('\n').filter(line => line.trim()).map(line => line.replace(/^\d+\.\s*/, '').trim());
        return { topics }
    }
})



const webSearchTool = tavilySearch({
  searchDepth: "advanced",
  includeAnswer: true,
  maxResults: topicCount,
  topic: "general",
  query: "search the internet for the following topics"
})

const getWebSearchData =  tool<{ topics: string[] }, { searchResults: string[] }>({
  description: "Use this tool to get relevant web search data for the given research topics.",
  inputSchema: z.object({
      topics: z.array(z.string()).describe("The list of research topics to search for.")
  }),
  execute: async ({topics}) => {
        console.log("IN The web search tool, got topics: ", topics)
      const result = await streamText({
        model: openai("gpt-5-mini"),
            prompt: `Use the following topics: ${topics.join(", ")} to search the internet using the web search tool.`,
            tools: {webSearchTool},
            stopWhen: stepCountIs(2),
            })
      const text = await result.text;
      return { searchResults: [text] }
  }
})

const researchToHtmlTool = tool<{ searchResults: string[] }, { researchHtml: string }>({
  description: "Synthesize a comprehensive research response based on the web search data gathered and return it to the user as an HTML formatted response.",
  inputSchema: z.object({
      searchResults: z.array(z.string()).describe("The web search results for the given topics.")
  }),
    execute: async ({searchResults}) => {
        console.log("IN The research to HTML tool, got search results: ", searchResults)
      const result = await streamText({
        model: openai("gpt-5-mini"),
            prompt: `You are an expert research report generator. Use the following web search results to create a professional, visually engaging research report in HTML format 
            and make sure you only return html tags and content and no other explanations.
            
Search Results to synthesize:
${searchResults.join("\\n---\\n")}

Generate an HTML report with these requirements:
1. STRUCTURE: Create a well-organized report with a header section, key findings summary, detailed sections, and conclusion
2. DO NOT include <html>, or <body> tags - only return the body content replace all these with divs with appropriate standard Tailwind css classes for styling. The HTML should be clean and well-formatted.
3. VISUAL HIERARCHY: Use h1, h2, h3 tags appropriately with standard Tailwind css classes for styling (text-3xl, text-2xl, text-xl)
4. SECTIONS FORMAT:
   - Start with a gradient header with title and description
   - Create 3-4 main content sections using styled cards
   - Add a key statistics/highlights section with badges
   - Include a conclusion section
5. STYLING: Follow the standardized styling conventions from globals.css:
   - CARDS & CONTAINERS: Use rounded-lg shadow-md border border-slate-200 with hover:shadow-lg transition-transform
   - HEADERS: Use bg-gradient-to-r from-blue-600 to-indigo-600 text-white with p-6 and border-t-4
   - TEXT HIERARCHY: H1/H2 use text-3xl/text-2xl font-bold tracking-wide, H3 uses text-xl font-semibold, body uses text-sm text-gray-700
   - CALLOUT BOXES: Use border-l-4 with variants (border-blue-500 bg-blue-50, border-green-500 bg-green-50, etc.)
   - BADGES: Use px-3 py-1 rounded-full text-sm font-semibold with bg-gradient-to-r text-white and only use from-indigo-500 to-purple-500, from-green-500 to-teal-500, from-amber-400 to-orange-500.
   - SPACING: Use max-w-4xl mx-auto p-6, sections with mb-6 gap-6, cards with p-6
   - COLORS: Light backgrounds (bg-slate-50), white cards, text-gray-800 on light backgrounds
6. VISUAL ELEMENTS:
   - Use single emoji where relevant to break up text
   - Create lists with bullet points or numbered lists
   - Use horizontal rules to separate sections
   - Add highlighted quotes or key insights in styled containers
7. CONTENT QUALITY:
   - Write clear, concise explanations
   - Pull key statistics and facts from the search results
   - Organize information logically
   - Ensure sources are referenced naturally in the text
8. RESPONSIVE: Use standard Tailwind utility classes to ensure content works on mobile and desktop (grid grid-cols-1 md:grid-cols-2, text-sm sm:text-base, etc.)
9. RETURN ONLY HTML: No markdown, no explanations, just clean HTML that renders properly`,
            })
      const text = await result.text;
      return { researchHtml: text }
    }
})

const prettyHTMLTool = tool<{ htmlContent: string }, { formattedHtml: string }>({
  description: "Format the given HTML content to be more readable and visually appealing.",
  inputSchema: z.object({
      htmlContent: z.string().describe("The raw HTML content to be formatted.")
  }),
    execute: async ({htmlContent}) => {
        console.log("IN The pretty HTML tool, got html content: ", htmlContent)
      const result = await streamText({
        model: openai("gpt-5-mini"),
            prompt: `You are a professional UI designer specializing in HTML and standard Tailwind CSS. Enhance the following HTML content to make it exceptionally visually appealing while maintaining clarity and readability.

Original HTML:
${htmlContent}

Enhancement instructions:
Apply the standardized styling conventions from globals.css:

1. DESIGN SYSTEM:
   - Color palette: primary (blue/indigo #4f46e5), secondary (slate #64748b), accent (amber #f59e0b)
   - Light backgrounds (bg-slate-50) with white cards (bg-white)
   - Consistent spacing: p-6 for cards, gap-6 for sections, mb-6 for margins between items

2. TYPOGRAPHY (following globals.css standards):
   - H1: text-3xl sm:text-4xl font-bold tracking-wide
   - H2: text-2xl font-semibold tracking-wide
   - H3: text-lg sm:text-xl font-semibold tracking-wide
   - Body: text-sm text-gray-700
   - Muted: text-xs text-slate-500
   - Use font-semibold and tracking-wide for emphasis
   - Dark text on light backgrounds (text-gray-800), light text on dark backgrounds (text-white)

3. CARDS & CONTAINERS:
   - Apply: rounded-lg shadow-md border border-slate-200
   - Add hover states: hover:shadow-lg transition-transform duration-200 hover:-translate-y-1
   - Padding: p-6 for cards, p-3 for small containers

4. HEADERS:
   - Style: bg-gradient-to-r from-blue-600 to-indigo-600 text-white
   - Apply: p-6 rounded-lg shadow-lg border-t-4 border-indigo-700

5. CALLOUT BOXES (border-l-4 variants):
   - Information: border-blue-500 bg-blue-50 text-gray-700
   - Success: border-green-500 bg-green-50 text-gray-700
   - Warning: border-amber-400 bg-amber-50 text-gray-700
   - Alert: border-red-500 bg-red-50 text-gray-700

6. BADGES & HIGHLIGHTS:
   - Use: bg-gradient-to-r text-white px-3 py-1 rounded-full text-sm font-semibold shadow-sm
   - Color variants: from-indigo-500 to-purple-500, from-green-500 to-teal-500, from-amber-400 to-orange-500

7. LAYOUT & SPACING:
   - Container: max-w-4xl mx-auto p-6 sm:p-8
   - Grid: grid grid-cols-1 md:grid-cols-2 gap-6
   - Sections: spacing with mt-4, mt-3, mt-2 (decreasing)
   - Responsive: Use sm: prefixes for mobile-first design

8. VISUAL POLISH:
   - Transitions: transition-transform duration-200, transition-all
   - Hover effects: hover:shadow-lg, hover:-translate-y-1
   - Interactive elements: -webkit-tap-highlight-color transparent

9. RETURN ONLY THE ENHANCED HTML: No explanations or markdown, preserve all content, just enhance styling`,
            })
      const text = await result.text;
      return { formattedHtml: text }
    }
})
  

async function getTextFromUIMessages(message: UIMessage): Promise<string> {
    const res = await convertToModelMessages([message]);
    const userPromptText = typeof res[0].content[0] === 'string' ? res[0].content[0] : (res[0].content[0] as any).text || '';
    return  `Research Task Instructions:
1. Identify ${topicCount} specific research topics based on the user prompt: "${userPromptText}". These topics should cover different aspects of the subject and be specific enough to find relevant information online.
2. Use the web search tool to conduct thorough research on each topic and gather relevant information
3. Synthesize the search results into a comprehensive, well-structured HTML report that includes:
   - Clear title and introduction
   - Multiple content sections organized logically
   - Key findings and statistics highlighted visually
   - Graphs and charts where relevant
   - Professional formatting and visual hierarchy
   - Have a section where you cite your sources in a natural way within the text with links.
4. Polish the HTML report using standardized styling from globals.css conventions:
   - Color palette: primary blue/indigo, secondary slate/gray, accent amber/orange
   - Light backgrounds (bg-slate-50) with white cards (bg-white border-slate-200)
   - Typography hierarchy: H1 text-3xl font-bold, H2 text-2xl font-semibold, body text-sm text-gray-700
   - Cards with rounded-lg shadow-md and hover:shadow-lg transitions
   - Gradient headers (bg-gradient-to-r from-blue-600 to-indigo-600 text-white)
   - Callout boxes with border-l-4 variants (blue, green, amber, red)
   - Badges with bg-gradient-to-r and rounded-full styling
   - Responsive design with grid grid-cols-1 md:grid-cols-2 and mobile-first breakpoints
IMPORTANT: Generate clean, semantic HTML using standard Tailwind CSS classes following the standardized styling conventions. Focus on creating an engaging, professional-looking report.
Only return the final HTML content as a string with no additional explanations or markdown. `
}



async function saveHtmlFile(htmlContent: string, filename?: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = filename || `research-${timestamp}.html`;
  const filePath = path.join(process.cwd(), 'public', 'generated', fileName);
  
  // Ensure directory exists
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const htmlData = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body>
    ${htmlContent}
</body>
</html>`;
  // Write the file
  await fs.writeFile(filePath, htmlData, 'utf-8');
  
  return `/generated/${fileName}`;
}




export async function POST(req: Request) {

    try {
        const { messages }: {messages: UIMessage[]} = await req.json();

        console.log ("Messages received in route.ts: ", messages.length);
        
        if (messages && messages.length === 1 ) {
          console.log("Using tool since only one message from user.")
            const result = await streamText({
            model: openai("gpt-5-mini"),
            prompt: await getTextFromUIMessages(messages[0]),
            tools: {topicTool, getWebSearchData, researchToHtmlTool, prettyHTMLTool},
            stopWhen: stepCountIs(25),
            });

          // Extract final text and save to file
          const fullText = await result.text;
          if (fullText && fullText.includes('<')) {
            try {
              const fileUrl = await saveHtmlFile(fullText, 'research_result.html');
              console.log(`HTML saved to: ${fileUrl}`);
            } catch (fileError) {
              console.error('Error saving HTML file:', fileError);
            }
          }

          return result.toUIMessageStreamResponse();
        }

        const result = await streamText({
          model: openai("gpt-5-mini"),
          system: `You are an assistant that helps the user research a topic by generating a comprehensive research report in HTML format.
          The user will ask you questions about the generated report, so make sure to include all relevant information in the report and format it with standard Tailwind CSS for good readability and visual appeal.
          Always return the report in HTML format and ensure it is well-structured with clear sections, headings, and visual elements like badges and highlights for key information.
          Focus on creating a professional, engaging report that covers all aspects of the research topic in depth.
          Only return the HTML content as a string with no additional explanations or markdown. If you have questions about the prompt, take your best guess and include it in the report. The user will ask follow-up questions based on the report you generate,
          so make sure to include comprehensive information in the initial report.`,
          messages: await convertToModelMessages(messages),
        });
    
        return result.toUIMessageStreamResponse();
      } catch (error) {
        console.error("Error streaming chat completion:", error);
        return new Response("Failed to stream chat completion", { status: 500 });
      }
}
