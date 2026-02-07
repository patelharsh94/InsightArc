'use client'

import { useState } from "react";
import { GptWindow } from "@/components/complex/gptwindow";
import { Search, CircleStop, Sparkles } from "lucide-react";
import { Button } from '@/components/ui/button';

export default function Home() {

  const [researchTopic, setResearchTopic] = useState("")
  const [finalTopic, setFinalTopic] = useState("")
  const [researching, setResearching] = useState(false)
  
  function handleResearchClick(e: React.FormEvent) {
    e.preventDefault()
    setFinalTopic(researchTopic)
    // if (!researchTopic.trim()) return
    setResearching(!researching)
    setResearchTopic('')
  }

  function handleResearchFinished() {
    setResearching(false)
    setResearchTopic('')
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative overflow-hidden">
      
      {/* Ambient background glow effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-accent/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[450px] lg:w-[600px] h-[300px] sm:h-[450px] lg:h-[600px] bg-primary/5 rounded-full blur-3xl animate-bounce" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] sm:bg-[size:48px_48px] lg:bg-[size:64px_64px]" />

      <div className="w-full max-w-3xl flex flex-col items-center gap-6 sm:gap-8 lg:gap-12">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center gap-4 sm:gap-5 lg:gap-6 text-center">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm text-muted-foreground">AI-Powered Research</span>
          </div>
          
          <h1 className="text-5xl sm:text-5xl py-2 md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter bg-gradient-to-br via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
            Insight<span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Arc</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xs sm:max-w-sm md:max-w-md leading-relaxed px-2">
            Transform any topic into comprehensive, AI-powered research insights.
          </p>
        </div>

        {/* Search Section */}
        <div className="w-full max-w-xl px-2 sm:px-0">
          <form onSubmit={handleResearchClick} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
            
            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl shadow-primary/5">
              <input
                name="request-prompt"
                type="text"
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none text-base sm:text-lg"
                value={researchTopic}
                onChange={(e) => setResearchTopic(e.target.value)}
                placeholder="What would you like to research?"
                disabled={researching}
              />
              
              <Button 
                type="submit" 
                size="lg"
                disabled={!researchTopic.trim() && !researching}
                className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg transition-all duration-300 ${
                  researching 
                    ? 'bg-destructive hover:bg-destructive/90' 
                    : 'bg-gradient-to-r from-primary to-accent hover:opacity-90'
                }`}
              >
                {researching ? (
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
          
          {/* Quick suggestions */}
          {!researching && (
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              {['Climate change', 'Quantum computing', 'Space exploration'].map((topic) => (
                <button
                  key={topic}
                  onClick={() => setResearchTopic(topic)}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground bg-card/50 hover:bg-card border border-border/50 rounded-lg transition-all duration-200"
                >
                  {topic}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="w-full px-2 sm:px-0">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-accent/20 rounded-2xl blur-xl opacity-50" />
            <div className="relative p-4 sm:p-6 md:p-8 rounded-xl bg-card/60 backdrop-blur-xl border border-border/50 shadow-xl">
              <GptWindow
                research_topic={finalTopic}
                researching={researching}
                handleResearchFinished={handleResearchFinished}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </main>
  );
}
