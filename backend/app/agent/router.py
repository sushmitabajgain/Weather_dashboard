import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agent.agent import get_agent

router = APIRouter(prefix="/agent", tags=["agent"])


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str


FALLBACK_ANSWER = (
    "I could not answer that exactly from the current AQHI data. "
    "Try asking for a location, a date range, or whether you want Forecast or Observation data."
)


def _looks_like_sql_response(text: str) -> bool:
    lowered = text.lower()
    markers = [
        "select ",
        " from aqhi_data",
        "where date(",
        "group by",
        "order by",
        "here is the corrected query",
        "operator does not exist",
        "```sql",
    ]
    return any(marker in lowered for marker in markers)


def _clean_agent_answer(text: str) -> str:
    if not text:
        return FALLBACK_ANSWER

    cleaned = re.sub(r"```[\s\S]*?```", "", text).strip()

    if _looks_like_sql_response(cleaned):
        return (
            "I could not answer that directly in a user-friendly way from the current AQHI data. "
            "Try asking something like 'What was the average AQHI by location for March 24, 2024 observation data?' "
            "or 'Which location had the highest AQHI on March 24, 2024?'"
        )

    return cleaned or FALLBACK_ANSWER


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Ask the AI agent a natural-language question about the AQHI dataset.

    Example questions:
    - "Which location had the highest average AQHI in January 2026?"
    - "How many observations have a Very High category?"
    - "What is the average AQHI for Edmonton vs Calgary?"
    """
    try:
        agent = get_agent()
        result = agent.invoke({"input": request.question})
        return ChatResponse(answer=_clean_agent_answer(result.get("output", "")))
    except Exception as e:
        message = str(e).lower()
        if any(marker in message for marker in ["operator does not exist", "timestamp", "like"]):
            return ChatResponse(
                answer=(
                    "I could not match that request cleanly against the current AQHI data. "
                    "Try asking for a date range, a location, and whether you want Forecast or Observation data."
                )
            )
        raise HTTPException(status_code=500, detail=str(e))
