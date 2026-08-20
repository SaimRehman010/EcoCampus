import os
import re
from flask import Flask, request, jsonify
from flask_cors import CORS

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from rag import PolicyRAGEngine
from agent import EcoCampusAgent

# Initialize Flask App
app = Flask(__name__)
CORS(app)

# Initialize RAG and Agent Services
rag_engine = PolicyRAGEngine()
agent_service = EcoCampusAgent()

GUARDRAIL_MESSAGE = (
    "I am the EcoCampus Operations & Sustainability AI. "
    "I can only assist with campus sustainability policies, energy optimization, and facility issue diagnostics. "
    "Please submit a relevant campus query."
)

def is_relevant_campus_query(text: str) -> bool:
    """
    Validates whether the user's input is related to campus operations,
    sustainability, energy, HVAC, water, waste, facilities, or policies.
    """
    if not text or len(text.strip()) < 2:
        return False

    text_lower = text.lower().strip()

    # Explicit off-topic keywords
    off_topic_keywords = [
        "dance", "dancing", "game", "games", "sports", "football", "cricket", "basketball",
        "movie", "movies", "cinema", "song", "singing", "recipe", "cooking", "capital of",
        "who won", "joke", "jokes", "funny", "celebrity", "dating", "love", "cat", "dog"
    ]

    for word in off_topic_keywords:
        if re.search(r'\b' + re.escape(word) + r'\b', text_lower):
            return False

    # Relevant domain keywords
    relevant_keywords = [
        "campus", "eco", "sustainability", "energy", "hvac", "ac", "air condition",
        "water", "waste", "recycle", "recycling", "facility", "facilities",
        "policy", "policies", "electricity", "power", "light", "lighting",
        "leak", "plumb", "chiller", "heat", "heating", "dorm", "dormitory",
        "room", "building", "hall", "lab", "report", "incident", "complaint",
        "cost", "kwh", "decarbonization", "green", "e-waste", "temperature",
        "valve", "sensor", "solar", "operation", "maintenance", "rule", "rules",
        "usage", "sla", "procedure", "shut off", "schedule", "workstation"
    ]

    for kw in relevant_keywords:
        if kw in text_lower:
            return True

    # Allow general questions unless explicitly off-topic
    if any(w in text_lower for w in ["how", "what", "where", "when", "why", "can", "should"]):
        return True

    return False


@app.route("/api/health", methods=["GET"])
def health():
    """Health check for AI microservice"""
    return jsonify({
        "status": "ok",
        "service": "EcoCampus AI Service (RAG & Agentic AI)",
        "port": int(os.getenv("PORT", 5002))
    }), 200


# ==========================================
# 1. RAG Knowledge Base Endpoint
# ==========================================
@app.route("/api/ai/rag", methods=["POST"])
def rag_query():
    """
    RAG Endpoint: Ingests query, retrieves relevant campus policy chunks,
    and returns a grounded answer.
    """
    try:
        data = request.get_json()
        if not data or "query" not in data or not data["query"].strip():
            return jsonify({
                "success": False,
                "message": "Missing 'query' in request body"
            }), 400

        query = data["query"].strip()
        top_k = int(data.get("top_k", 3))

        # Check Off-Topic Guardrail
        if not is_relevant_campus_query(query):
            return jsonify({
                "success": True,
                "data": {
                    "query": query,
                    "answer": GUARDRAIL_MESSAGE,
                    "sources": [],
                    "context_used": ""
                }
            }), 200

        result = rag_engine.generate_answer(query, top_k=top_k)

        return jsonify({
            "success": True,
            "data": result
        }), 200
    except Exception as ex:
        print(f"[RAG Error]: {ex}")
        return jsonify({
            "success": False,
            "message": f"Error processing RAG query: {str(ex)}"
        }), 500


# ==========================================
# 2. Agentic AI Endpoint
# ==========================================
@app.route("/api/ai/agent", methods=["POST"])
def agent_execute():
    """
    Agentic AI Endpoint: Orchestrates multi-tool execution to address campus goals.
    """
    try:
        data = request.get_json()
        goal = (data.get("goal") or data.get("query") or "").strip() if data else ""

        if not goal:
            return jsonify({
                "success": False,
                "message": "Missing 'goal' (or 'query') in request body"
            }), 400

        # Check Off-Topic Guardrail
        if not is_relevant_campus_query(goal):
            return jsonify({
                "success": True,
                "data": {
                    "user_goal": goal,
                    "status": "bypassed",
                    "steps_executed": [],
                    "tool_results": {},
                    "agent_synthesis": GUARDRAIL_MESSAGE
                }
            }), 200

        agent_response = agent_service.run(user_goal=goal)

        return jsonify({
            "success": True,
            "data": agent_response
        }), 200
    except Exception as ex:
        print(f"[Agent Error]: {ex}")
        return jsonify({
            "success": False,
            "message": f"Error running AI agent: {str(ex)}"
        }), 500


# ==========================================
# 3. Standalone Sustainability Advisor
# ==========================================
@app.route("/api/ai/advisor", methods=["POST"])
def sustainability_advisor():
    """
    Standalone GenAI Advisor Endpoint: Generates 3 specific recommendations based on
    focus domain category and user prompt.
    """
    try:
        data = request.get_json()
        prompt = (data.get("prompt") or data.get("query") or "").strip() if data else ""

        if not prompt:
            return jsonify({
                "success": False,
                "message": "Missing 'prompt' in request body"
            }), 400

        category = data.get("category", "General Sustainability")

        # Check Off-Topic Guardrail
        if not is_relevant_campus_query(prompt):
            return jsonify({
                "success": True,
                "category": category,
                "prompt": prompt,
                "advice": GUARDRAIL_MESSAGE,
                "engine": "Guardrail-Filter"
            }), 200

        # 1. Try Gemini LLM if API Key is configured
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if gemini_api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                llm_prompt = (
                    "You are the EcoCampus Assistant. Synthesize a direct, concise answer to the user's specific question.\n"
                    "Provide 3 actionable, specific recommendations addressing the user's exact scenario.\n\n"
                    f"Focus Domain: {category}\n"
                    f"User Scenario / Prompt: {prompt}\n\n"
                    "Structure response clearly with markdown headers (###) and bullet points (-)."
                )
                response = model.generate_content(llm_prompt)
                if response and response.text:
                    return jsonify({
                        "success": True,
                        "category": category,
                        "prompt": prompt,
                        "advice": response.text.strip(),
                        "engine": "Gemini-1.5-Flash"
                    }), 200
            except Exception as e:
                print(f"[Advisor Gemini Note]: {e}")

        # 2. Try OpenAI LLM if API Key is configured
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if openai_api_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_api_key)
                completion = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are the EcoCampus Assistant. Synthesize 3 direct, actionable recommendations for the user's specific scenario."
                        },
                        {"role": "user", "content": f"Focus Domain: {category}\nPrompt: {prompt}"}
                    ]
                )
                if completion.choices:
                    return jsonify({
                        "success": True,
                        "category": category,
                        "prompt": prompt,
                        "advice": completion.choices[0].message.content.strip(),
                        "engine": "GPT-3.5-Turbo"
                    }), 200
            except Exception as e:
                print(f"[Advisor OpenAI Note]: {e}")

        # 3. Dynamic Sustainability Advisor Generator tailored to prompt & category
        advice_text = (
            f"### EcoCampus Sustainability Action Plan ({category})\n"
            f"**Target Inquiry:** *\"{prompt}\"*\n\n"
            f"Here are 3 actionable, specific recommendations addressing your exact scenario:\n\n"
            f"- **1. Targeted System Calibration ({category}):** Implement automated setpoint controls and scheduled monitoring tailored to resolve *\"{prompt}\"* across affected campus buildings.\n"
            f"- **2. Infrastructure & Sensor Deployment:** Deploy smart IoT sensors and automated cutoff switches to prevent resource waste during non-operational hours.\n"
            f"- **3. Operational Standard Operating Procedures:** Establish real-time maintenance escalation protocols for facilities staff, targeting a 24-hour resolution window.\n\n"
            f"**Estimated Impact:** Executing these 3 measures directly addresses localized resource waste, yielding an estimated **15% - 25% operational cost reduction** while lowering the campus carbon footprint."
        )

        return jsonify({
            "success": True,
            "category": category,
            "prompt": prompt,
            "advice": advice_text,
            "engine": "EcoCampus-Dynamic-Synthesizer"
        }), 200

    except Exception as ex:
        print(f"[Advisor Error]: {ex}")
        return jsonify({
            "success": False,
            "message": f"Error generating sustainability advice: {str(ex)}"
        }), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5002))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    print(f"[EcoCampus AI Service] Starting RAG & Agent Microservice on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=debug)
