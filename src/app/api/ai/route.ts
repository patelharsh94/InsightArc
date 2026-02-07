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
            model: openai("gpt-4"),
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
        model: openai("gpt-4"),
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
        model: openai("gpt-4"),
            prompt: `You are an expert research report generator. Use the following web search results to create a professional, visually engaging research report in HTML format 
            and make sure you only return html tags and content and no other explanations.
            
Search Results to synthesize:
${searchResults.join("\\n---\\n")}

Generate an HTML report with these requirements:
1. STRUCTURE: Create a well-organized report with a header section, key findings summary, detailed sections, and conclusion
2. DO NOT include <html>, <head>, or <body> tags - only return the body content
3. VISUAL HIERARCHY: Use h1, h2, h3 tags appropriately with Tailwind classes for styling (text-3xl, text-2xl, text-xl)
4. SECTIONS FORMAT:
   - Start with a gradient header with title and description
   - Create 3-4 main content sections using styled cards
   - Add a key statistics/highlights section with badges
   - Include a conclusion section
   - The button to download the report as HTML should actually download the file when clicked.
5. STYLING with Tailwind CSS:
   - Use bg-gradient-to-r for headers and highlights
   - Use rounded-lg shadow-md for cards
   - Use text colors that are easy to read and visually appealing based on the background they are on (e.g. text-white on dark backgrounds, text-gray-800 on light backgrounds)
   - Add padding and margin for spacing (p-4, pt-6, etc.)
   - Each text section should be in a card with bg-card and border border-border and a background that makes it easily visible.
   - Use border-l-4 for callout boxes
6. VISUAL ELEMENTS:
   - Use single emoji where relevant to break up text
   - Create listicles with bullet points or numbered lists
   - Use horizontal rules to separate sections
   - Add highlighted quotes or key insights in styled containers
7. CONTENT QUALITY:
   - Write clear, concise explanations
   - Pull key statistics and facts from the search results
   - Organize information logically
   - Ensure sources are referenced naturally in the text
8. RESPONSIVE: Use Tailwind utility classes to ensure content works on mobile and desktop
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
        model: openai("gpt-4"),
            prompt: `You are a professional UI designer specializing in HTML and Tailwind CSS. Enhance the following HTML content to make it exceptionally visually appealing while maintaining clarity and readability.

Original HTML:
${htmlContent}

Enhancement instructions:
1. DESIGN SYSTEM:
   - Use a cohesive color palette (primary: blue/indigo, secondary: slate/gray, accent: amber/orange)
   - Maintain consistent spacing using Tailwind gap, p, m utilities
   - Use subtle gradients on headers and key sections
2. TYPOGRAPHY:
   - Ensure proper font sizing hierarchy (text-sm for body, text-lg for subheaders, text-2xl/3xl for headers)
   - Ensure the font are easy to read and visually appealing (e.g. use a clean sans-serif font)
   - Ensure the text colors have good contrast with the background for readability, text should be darker colors.
   - Use font-semibold or font-bold strategically for emphasis
   - Add tracking-wide or tracking-wider for important text
   - Use dark text colors (e.g. text-gray-800) on light backgrounds and light text colors (e.g. text-white) on dark backgrounds for optimal readability
3. LAYOUT & SPACING:
   - Wrap content in max-w containers (max-w-4xl recommended)
   - Add generous padding and margins between sections
   - Use flex/grid for organized layouts
4. CARDS & CONTAINERS:
   - Add shadow-md or shadow-lg to important cards
   - Use border-t-2, border-l-4 for visual interest
   - Apply rounded-lg to all card containers
5. ACCENT ELEMENTS:
   - Highlight key statistics with bg-gradient-to-r and text-white
   - Use badges (px-3 py-1 rounded-full) for tags/categories
   - Add border-accent colors to important callouts
6. BACKGROUNDS:
   - Use light color backgrounds.
   - Add subtle pattern or gradient overlays where appropriate
   - Ensure sufficient contrast for readability
7. VISUAL POLISH:
   - Add hover effects (hover:shadow-lg, hover:scale-105) where appropriate
   - Use transition classes for smooth interactions
   - Add subtle animations or fade effects
8. RETURN ONLY THE ENHANCED HTML: No explanations or markdown, preserve all content, just enhance styling`,
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
4. Polish the HTML report with professional styling that includes:
   - Modern color scheme with good contrast
   - Proper spacing and layout
   - Visual elements like icons and badges where relevant
   - Responsive design suitable for all screen sizes
IMPORTANT: Generate clean, semantic HTML using Tailwind CSS classes for styling. Focus on creating an engaging, professional-looking report.
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
    ${htmlContent}
    </head>
    </html>`;
  // Write the file
  await fs.writeFile(filePath, htmlContent, 'utf-8');
  
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
            stopWhen: stepCountIs(22),
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
          The user will ask you questions about the generated report, so make sure to include all relevant information in the report and format it with Tailwind CSS for good readability and visual appeal.
          Always return the report in HTML format and ensure it is well-structured with clear sections, headings, and visual elements like badges and highlights for key information.
          Focus on creating a professional, engaging report that covers all aspects of the research topic in depth.
          Only return the HTML content as a string with no additional explanations or markdown.`,
          messages: await convertToModelMessages(messages),
        });
    
        return result.toUIMessageStreamResponse();
      } catch (error) {
        console.error("Error streaming chat completion:", error);
        return new Response("Failed to stream chat completion", { status: 500 });
      }
}
