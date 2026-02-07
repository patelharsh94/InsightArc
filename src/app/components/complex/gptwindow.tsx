'use client'

import { useChat } from "@ai-sdk/react"
import { useState, useEffect } from "react"
import DOMPurify from 'dompurify'
import { BookOpen, Search, CircleStop } from "lucide-react"
import { DefaultChatTransport } from "ai";
import { Button } from '@/components/ui/button';



interface GptWindowProps {
    research_topic: string;
    researching: boolean;
    handleResearchFinished?: () => void;
}

export function GptWindow({ research_topic, researching, handleResearchFinished }: GptWindowProps) {

    const [input, setInput] = useState('');

    let htmlDetected = false

     const returnResearchReport = () => {
      if (htmlDetected) {
        console.log('HTML detected, returning iframe')
        return (
          <div>
            <div dangerouslySetInnerHTML={{__html: '<iframe src="public/generated/research_result.html" className="w-full h-screen"></iframe>'}}></div>
          </div>
        )
      }
    }

    const {messages, sendMessage, status, error, stop, setMessages} = useChat({
        onError: handleResearchFinished,
        onFinish: returnResearchReport,
        transport: new DefaultChatTransport({
            api: "/api/ai/",
          }),
    })

    useEffect(() => {
        if (research_topic.trim() !== '') {
            sendMessage({ text: research_topic })
        }
    }, [research_topic])

    useEffect(() => {
        console.log('setting empty messages')
        setMessages([])
    }, [researching])

    const printReport = () => {
      const url = '/generated/research_result.html'; // or dynamic URL from API
      const w = window.open(url, '_blank');
      if (!w) return;
      w.addEventListener('load', () => w.print());
    }


    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        sendMessage({ text: input });
        setInput("");
      };
    
      return (

        <div className="flex flex-col w-full max-w-4xl p-5 py-24 mx-auto text-black stretch">
        {researching ? 
        <div>
          {error && <div className="text-red-500 mb-4">{error.message}</div>}
          {messages.map((message) => (
            <div key={message.id} className="mb-4">
              <div className="font-semibold text-white">
                {message.role === "user" ? "You:" : "AI:"}
              </div>

              { status === 'ready' &&               
              <div className="fixed top-4 right-4">
                  <button onClick={printReport} className="px-4 py-2 bg-primary text-white rounded-lg shadow-md hover:bg-primary/90 transition">
                    Print Report
                  </button>
              </div>}

              {message.parts.map((part, index) => {
                // console.log('Rendering part: ', index)
                switch (part.type) {
                  case "text": {
                    const text = part.text ?? ''
                    const looksLikeHtml = /<[^>]+>/.test(text)

                    if (looksLikeHtml) {
                      htmlDetected = true
                      const sanitized = DOMPurify.sanitize(text)
                      return (
                        <div
                          key={`${message.id}-${index}`}
                          className="prose max-w-none  mt-2  shadow-sm rounded-2xl p-4"
                          dangerouslySetInnerHTML={{ __html: sanitized }}
                        />
                      )
                    } else {
                      htmlDetected = false
                      return (
                      
                      <div
                        key={`${message.id}-${index}`}
                        className="whitespace-pre-wrap text-white"
                      >
                        {text}
                      </div>
                      )
                    }
                  }
                  default:
                    return null;
                }
              })}
            </div>
          ))}
          {(status === "submitted" || status === "streaming") && (
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              </div>
            </div>
          )}
        
          <form
            onSubmit={handleSubmit}
            className="fixed bottom-0 relative group"
          >
            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl shadow-primary/5">
              <input
                name="request-prompt"
                type="text"
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none text-base sm:text-lg"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="How can I help you?"
              />

              <Button 
                type="submit" 
                size="lg"
                disabled={!research_topic.trim() && !researching}
                className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg transition-all duration-300 ${
                  researching 
                    ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90'
                    : 'bg-destructive hover:bg-destructive/90'
                }`}
              >
                {status === "submitted" || status === "streaming" ? (
                  <>
                    <CircleStop className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Research
                  </>
                )}
              </Button>
            </div>
          </form> 
          </div>: <>
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center px-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted/50 flex items-center justify-center mb-2 sm:mb-3">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">Enter a topic above to start your research</p>
        </div></>
        }
        </div>
      );
}