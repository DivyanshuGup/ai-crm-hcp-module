"""
LangGraph Agent with 5 tools for AI-First CRM HCP Module.
"""

import json
import os
from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph
from langchain.tools import tool

load_dotenv()

llm = ChatGroq(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama-3.3-70b-versatile",
    temperature=0.3,
)


@tool
def log_interaction(description: str) -> str:
    """Captures and structures HCP interaction data from free-text using LLM."""
    prompt = f"""You are a life-science CRM assistant. Extract structured interaction data from the text below.
Return ONLY valid JSON with these exact keys (no extra text, no markdown backticks):
{{
  "hcp_name": "<doctor name>",
  "interaction_type": "<Meeting or Call or Email or Conference or Other>",
  "topics_discussed": "<key topics>",
  "sentiment": "<Positive or Neutral or Negative>",
  "outcomes": "<key outcomes>",
  "follow_up": "<next steps>",
  "ai_summary": "<2-sentence summary>"
}}
Interaction: {description}"""
    response = llm.invoke(prompt)
    raw = response.content.strip().replace("```json", "").replace("```", "").strip()
    start, end = raw.find("{"), raw.rfind("}") + 1
    try:
        return json.dumps(json.loads(raw[start:end]))
    except Exception:
        return json.dumps({"hcp_name": "", "interaction_type": "Meeting", "topics_discussed": description, "sentiment": "Neutral", "outcomes": "", "follow_up": "", "ai_summary": description[:150]})


@tool
def edit_interaction(edit_request: str) -> str:
    """Allows modification of previously logged interaction data."""
    prompt = f"""Extract only the fields to be CHANGED from this edit request.
Return ONLY valid JSON (no markdown): {{"field_name": "new_value", ...}}
Edit request: {edit_request}"""
    response = llm.invoke(prompt)
    raw = response.content.strip().replace("```json", "").replace("```", "").strip()
    start, end = raw.find("{"), raw.rfind("}") + 1
    try:
        return json.dumps({"status": "updated", "changes": json.loads(raw[start:end])})
    except Exception:
        return json.dumps({"status": "updated", "changes": {"note": edit_request}})


@tool
def summarize_meeting(notes: str) -> str:
    """Generates a concise professional summary from raw meeting notes."""
    prompt = f"""Summarize these HCP meeting notes. Return ONLY valid JSON (no markdown):
{{"summary": "<2-3 sentence summary>", "key_points": ["point1", "point2", "point3"]}}
Notes: {notes}"""
    response = llm.invoke(prompt)
    raw = response.content.strip().replace("```json", "").replace("```", "").strip()
    start, end = raw.find("{"), raw.rfind("}") + 1
    try:
        return raw[start:end]
    except Exception:
        return json.dumps({"summary": notes[:200], "key_points": []})


@tool
def recommend_hcp(context: str) -> str:
    """Recommends next best actions for the sales rep based on HCP interaction."""
    prompt = f"""Recommend top 3 next-best actions for a pharma sales rep. Return ONLY valid JSON (no markdown):
{{"recommendations": ["action1", "action2", "action3"], "priority": "High or Medium or Low", "rationale": "<reason>"}}
Context: {context}"""
    response = llm.invoke(prompt)
    raw = response.content.strip().replace("```json", "").replace("```", "").strip()
    start, end = raw.find("{"), raw.rfind("}") + 1
    try:
        return raw[start:end]
    except Exception:
        return json.dumps({"recommendations": ["Schedule follow-up in 2 weeks", "Send product brochure", "Log interaction in CRM"], "priority": "Medium", "rationale": ""})


@tool
def schedule_followup(interaction_summary: str) -> str:
    """Creates a structured follow-up task from interaction context."""
    prompt = f"""Create a follow-up task for a pharma sales rep. Return ONLY valid JSON (no markdown):
{{"follow_up_date": "<timeframe>", "task_description": "<task>", "channel": "<Email or Call or Meeting>", "materials_to_prepare": "<materials>"}}
Summary: {interaction_summary}"""
    response = llm.invoke(prompt)
    raw = response.content.strip().replace("```json", "").replace("```", "").strip()
    start, end = raw.find("{"), raw.rfind("}") + 1
    try:
        return raw[start:end]
    except Exception:
        return json.dumps({"follow_up_date": "2 weeks", "task_description": interaction_summary[:100], "channel": "Email", "materials_to_prepare": ""})


# ── LangGraph ──────────────────────────────────────────────────────────────────

tools_list = [log_interaction, edit_interaction, summarize_meeting, recommend_hcp, schedule_followup]
tools_by_name = {t.name: t for t in tools_list}


class AgentState(TypedDict):
    messages: Annotated[list, "append"]
    tool_result: dict


def agent_node(state: AgentState):
    user_msg = next((m.content for m in state["messages"] if isinstance(m, HumanMessage)), "")
    msg_lower = user_msg.lower()

    if any(w in msg_lower for w in ["edit", "change", "update", "modify", "correct"]):
        tool_name = "edit_interaction"
    elif any(w in msg_lower for w in ["summarize", "summary", "notes"]):
        tool_name = "summarize_meeting"
    elif any(w in msg_lower for w in ["recommend", "suggest", "next action"]):
        tool_name = "recommend_hcp"
    elif any(w in msg_lower for w in ["schedule", "follow-up", "followup", "task"]):
        tool_name = "schedule_followup"
    else:
        tool_name = "log_interaction"

    return {"messages": [AIMessage(content=f"Using tool: {tool_name}")], "tool_result": {"tool_name": tool_name, "user_msg": user_msg}}


def tool_node(state: AgentState):
    tool_name = state["tool_result"]["tool_name"]
    user_msg = state["tool_result"]["user_msg"]
    tool_fn = tools_by_name[tool_name]

    arg_map = {
        "log_interaction": {"description": user_msg},
        "edit_interaction": {"edit_request": user_msg},
        "summarize_meeting": {"notes": user_msg},
        "recommend_hcp": {"context": user_msg},
        "schedule_followup": {"interaction_summary": user_msg},
    }

    output = tool_fn.invoke(arg_map[tool_name])
    return {"messages": [AIMessage(content=str(output))], "tool_result": {**state["tool_result"], "output": str(output)}}


builder = StateGraph(AgentState)
builder.add_node("agent", agent_node)
builder.add_node("tools", tool_node)
builder.add_edge(START, "agent")
builder.add_edge("agent", "tools")
builder.add_edge("tools", END)
graph = builder.compile()


def run_agent(user_message: str) -> dict:
    result = graph.invoke({"messages": [HumanMessage(content=user_message)], "tool_result": {}})
    raw_output = result["tool_result"].get("output", "{}")

    try:
        data = json.loads(raw_output)
    except Exception:
        s, e = raw_output.find("{"), raw_output.rfind("}") + 1
        try:
            data = json.loads(raw_output[s:e]) if s != -1 else {}
        except Exception:
            data = {}

    summary = data.get("ai_summary") or data.get("summary") or "Interaction logged successfully."

    return {
        "summary": summary,
        "extracted_data": {
            "hcpName": data.get("hcp_name", ""),
            "interactionType": data.get("interaction_type", "Meeting"),
            "topicsDiscussed": data.get("topics_discussed", ""),
            "sentiment": data.get("sentiment", "Neutral"),
            "outcomes": data.get("outcomes", ""),
            "followUp": data.get("follow_up", ""),
            "materialsShared": data.get("materials_shared", ""),
            "sampleDistributed": data.get("samples_distributed", ""),
            "recommendations": data.get("recommendations", []),
            "taskDescription": data.get("task_description", ""),
        },
    }
