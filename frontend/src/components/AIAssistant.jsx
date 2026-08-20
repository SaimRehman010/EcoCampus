import React, { useState } from "react";
import {
  Sparkles,
  BookOpen,
  Bot,
  Send,
  CheckCircle,
  FileText,
  Workflow,
  Lightbulb,
  ShieldCheck
} from "lucide-react";
import { aiService } from "../services/api";
import { FormattedMarkdown } from "./AIPanel";

export default function AIAssistant() {
  const [activeSubTab, setActiveSubTab] = useState("rag"); // 'rag' | 'agent' | 'advisor'

  // RAG State
  const [ragQuery, setRagQuery] = useState("What are the rules for AC usage in computer labs?");
  const [ragResult, setRagResult] = useState(null);
  const [ragLoading, setRagLoading] = useState(false);
  const [ragError, setRagError] = useState("");

  // Agent State
  const [agentGoal, setAgentGoal] = useState("Which campus area has the highest electricity complaints and how can we reduce costs there?");
  const [agentResult, setAgentResult] = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState("");

  // Advisor State
  const [advisorPrompt, setAdvisorPrompt] = useState("How can we reduce energy wastage in our student dorms during winter?");
  const [advisorCategory, setAdvisorCategory] = useState("Energy");
  const [advisorResult, setAdvisorResult] = useState(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState("");

  // 1. RAG Handler
  const handleRagSearch = async (e) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    setRagLoading(true);
    setRagError("");
    setRagResult(null);

    try {
      const res = await aiService.ragSearch(ragQuery);
      setRagResult(res.data);
    } catch (err) {
      setRagError(
        err.response?.data?.message || "Failed to query RAG Knowledge Base on Port 5002."
      );
    } finally {
      setRagLoading(false);
    }
  };

  // 2. Agent Handler
  const handleAgentRun = async (e) => {
    e.preventDefault();
    if (!agentGoal.trim()) return;
    setAgentLoading(true);
    setAgentError("");
    setAgentResult(null);

    try {
      const res = await aiService.runAgent(agentGoal);
      setAgentResult(res.data);
    } catch (err) {
      setAgentError(
        err.response?.data?.message || "Failed to execute AI Agent on Port 5002."
      );
    } finally {
      setAgentLoading(false);
    }
  };

  // 3. Advisor Handler
  const handleAdvisorRun = async (e) => {
    e.preventDefault();
    if (!advisorPrompt.trim()) return;
    setAdvisorLoading(true);
    setAdvisorError("");
    setAdvisorResult(null);

    try {
      const res = await aiService.getAdvice(advisorPrompt, advisorCategory);
      setAdvisorResult(res);
    } catch (err) {
      setAdvisorError(
        err.response?.data?.message || "Failed to generate sustainability advice on Port 5002."
      );
    } finally {
      setAdvisorLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner - Dark Slate Navy with subtle emerald border */}
      <div className="bg-slate-900 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-950/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-3 text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>EcoCampus AI Intelligence Suite (Port 5002)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            AI Policy RAG & Agentic Operations
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mt-1">
            Query verified campus sustainability policies using RAG or dispatch autonomous multi-tool AI agents to triage complaints and compute energy loads.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveSubTab("rag")}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeSubTab === "rag"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>RAG Policy Retrieval</span>
        </button>

        <button
          onClick={() => setActiveSubTab("agent")}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeSubTab === "agent"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Agentic AI Command</span>
        </button>

        <button
          onClick={() => setActiveSubTab("advisor")}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeSubTab === "advisor"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Sustainability Advisor</span>
        </button>
      </div>

      {/* TAB 1: RAG POLICY RETRIEVAL */}
      {activeSubTab === "rag" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>Ask Campus Policy Guidelines</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Vector search across <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">campus_policy.md</code> (HVAC, Water leaks, Lighting, Waste)
              </p>
            </div>

            <form onSubmit={handleRagSearch} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Question</label>
                <textarea
                  rows={3}
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  placeholder="e.g. What is the escalation procedure for a water leak?"
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              {/* Sample Quick Questions */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Suggestions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "What are the rules for AC usage in computer labs?",
                    "What is the SLA for a Tier 3 water leak?",
                    "Where are the electronic waste (E-Waste) dropoff bins located?",
                    "When does classroom lighting auto shut off?"
                  ].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setRagQuery(sample)}
                      className="text-[11px] text-slate-600 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-2.5 py-1 rounded-lg transition-colors text-left cursor-pointer"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              {ragError && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {ragError}
                </div>
              )}

              <button
                type="submit"
                disabled={ragLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-emerald-600/20 text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {ragLoading ? (
                  <span>Querying RAG Vector Store...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Retrieve Grounded Policy Answer</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Grounded Policy Response & Citations</span>
            </h3>

            {ragLoading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Searching policy vector chunks...
              </div>
            ) : ragResult ? (
              <div className="space-y-4 text-xs">
                {/* Answer Box with Formatted Markdown Parser */}
                <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl text-slate-800">
                  <FormattedMarkdown content={ragResult.answer} />
                </div>

                {/* Sources & Citations */}
                {ragResult.sources && ragResult.sources.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Cited Policy Sections:
                    </p>
                    <div className="space-y-2">
                      {ragResult.sources?.map((s, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-700">{s.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Relevance Score: {s.relevance_score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                Enter a question or select a suggestion on the left to view policy answers.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AGENTIC AI COMMAND */}
      {activeSubTab === "agent" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <Bot className="w-5 h-5 text-emerald-600" />
                <span>Agentic AI Command Console</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Autonomous tool orchestration: queries Express reports & executes Python Resource Analyzer.
              </p>
            </div>

            <form onSubmit={handleAgentRun} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Goal</label>
                <textarea
                  rows={3}
                  value={agentGoal}
                  onChange={(e) => setAgentGoal(e.target.value)}
                  placeholder="e.g. Which campus area has the highest complaints and how can we reduce costs there?"
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              {agentError && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {agentError}
                </div>
              )}

              <button
                type="submit"
                disabled={agentLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl shadow-md text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {agentLoading ? (
                  <span>Agent Planning & Executing Tools...</span>
                ) : (
                  <>
                    <Workflow className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Run Autonomous AI Agent</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-2">
              <Workflow className="w-4 h-4 text-emerald-600" />
              <span>Agent Execution Plan & Diagnostics</span>
            </h3>

            {agentLoading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Executing multi-tool reasoning pipeline...
              </div>
            ) : agentResult ? (
              <div className="space-y-4 text-xs">
                {/* Steps Log */}
                {agentResult.steps_executed && agentResult.steps_executed.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Executed Tool Actions:
                    </p>
                    <div className="space-y-2">
                      {agentResult.steps_executed?.map((s) => (
                        <div
                          key={s.step}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1"
                        >
                          <div className="flex items-center justify-between font-semibold text-slate-800">
                            <span className="flex items-center space-x-1.5">
                              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center">
                                {s.step}
                              </span>
                              <code className="text-emerald-700">{s.tool}()</code>
                            </span>
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Executed</span>
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] pl-5">{s.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Synthesis Output */}
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Agent Synthesized Decision:
                  </p>
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl text-slate-800">
                    <FormattedMarkdown content={agentResult.agent_synthesis} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                Run the agent on the left to view autonomous multi-tool actions and operational insights.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SUSTAINABILITY ADVISOR */}
      {activeSubTab === "advisor" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-emerald-600" />
                <span>GenAI Sustainability Advisor</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Practical decarbonization and green campus advisory
              </p>
            </div>

            <form onSubmit={handleAdvisorRun} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Focus Domain</label>
                <select
                  value={advisorCategory}
                  onChange={(e) => setAdvisorCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="Energy">Energy Efficiency & HVAC</option>
                  <option value="Water">Water Conservation & Plumbing</option>
                  <option value="Waste">Waste & Recycling Segregation</option>
                  <option value="Winter Heating">Winter Heating Management</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Question / Scenario</label>
                <textarea
                  rows={3}
                  value={advisorPrompt}
                  onChange={(e) => setAdvisorPrompt(e.target.value)}
                  placeholder="e.g. How can we eliminate water waste across campus restrooms?"
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              {advisorError && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {advisorError}
                </div>
              )}

              <button
                type="submit"
                disabled={advisorLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-emerald-600/20 text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {advisorLoading ? (
                  <span>Generating Recommendations...</span>
                ) : (
                  <>
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Generate Sustainability Advice</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Sustainability Action Plan</span>
            </h3>

            {advisorLoading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Generating green action plan...
              </div>
            ) : advisorResult ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-700">Category: {advisorResult.category}</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Engine: {advisorResult.engine}
                  </span>
                </div>
                <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl text-slate-800">
                  <FormattedMarkdown content={advisorResult.advice} />
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                Submit an inquiry on the left to receive customized decarbonization advice.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
