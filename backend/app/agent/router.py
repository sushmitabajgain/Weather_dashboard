import re
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func

from app.agent.agent import get_agent
from app.db.models import AQHI
from app.db.session import SessionLocal

router = APIRouter(prefix="/agent", tags=["agent"])


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    text: str


class ChatRequest(BaseModel):
    question: str
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str


FALLBACK_ANSWER = (
    "I could not answer that exactly from the current AQHI data. "
    "Try asking for a location, a date range, or whether you want Forecast or Observation data."
)

CATEGORY_LABELS = {
    "very high": "Very High",
    "high": "High",
    "moderate": "Moderate",
    "low": "Low",
    "unknown": "Unknown",
}


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


def _parse_dataset_type(question: str) -> str | None:
    lowered = question.lower()
    if "forecast" in lowered:
        return "Forecast"
    if "observation" in lowered or "observed" in lowered:
        return "Observation"
    return None


def _parse_category(question: str) -> str | None:
    lowered = question.lower()
    for key, value in CATEGORY_LABELS.items():
        if key in lowered:
            return value
    return None


def _is_short_follow_up(question: str) -> bool:
    words = question.strip().split()
    return len(words) <= 2 and len(question.strip()) <= 16


def _build_contextual_question(question: str, history: list[ChatMessage]) -> str:
    if not history or not _is_short_follow_up(question):
        return question

    recent = history[-4:]
    context_lines = [f"{item.role.title()}: {item.text}" for item in recent if item.text.strip()]
    if not context_lines:
        return question

    return (
        "Use the recent conversation to interpret the follow-up question.\n"
        + "\n".join(context_lines)
        + f"\nUser follow-up: {question}"
    )


def _answer_highest_average(question: str) -> str | None:
    lowered = question.lower()
    if "highest average aqhi" not in lowered and "highest avg aqhi" not in lowered:
        return None

    dataset_type = _parse_dataset_type(question)
    db = SessionLocal()
    try:
        query = db.query(
            AQHI.location_name,
            func.avg(AQHI.aqhi).label("avg_aqhi"),
            func.max(AQHI.aqhi).label("peak_aqhi"),
        )
        if dataset_type:
            query = query.filter(AQHI.dataset_type == dataset_type)

        result = (
            query.group_by(AQHI.location_name)
            .order_by(func.avg(AQHI.aqhi).desc())
            .first()
        )

        if not result:
            return "I could not find AQHI records for that request."

        dataset_text = f" in {dataset_type} data" if dataset_type else ""
        return (
            f"{result.location_name} has the highest average AQHI{dataset_text}, "
            f"at {round(result.avg_aqhi, 2)}. "
            f"The highest reading there reaches {round(result.peak_aqhi, 2)}."
        )
    finally:
        db.close()


def _answer_category_count(question: str) -> str | None:
    lowered = question.lower()
    if not any(word in lowered for word in ["how many", "count", "number of"]):
        return None

    category = _parse_category(question)
    if not category:
        return None

    dataset_type = _parse_dataset_type(question)
    db = SessionLocal()
    try:
        query = db.query(func.count(AQHI.id))
        query = query.filter(AQHI.category == category)
        if dataset_type:
            query = query.filter(AQHI.dataset_type == dataset_type)
        total = query.scalar() or 0

        dataset_text = f" in {dataset_type} data" if dataset_type else ""
        return f"There are {total} {category} AQHI records{dataset_text}."
    finally:
        db.close()


def _answer_worst_hour(question: str) -> str | None:
    lowered = question.lower()
    if "worst hour" not in lowered and "what hour of the day" not in lowered:
        return None

    dataset_type = _parse_dataset_type(question)
    db = SessionLocal()
    try:
        query = db.query(
            func.extract("hour", AQHI.datetime).label("hour"),
            func.avg(AQHI.aqhi).label("avg_aqhi"),
        )
        if dataset_type:
            query = query.filter(AQHI.dataset_type == dataset_type)

        result = (
            query.group_by("hour")
            .order_by(func.avg(AQHI.aqhi).desc())
            .first()
        )

        if not result:
            return "I could not find enough AQHI data to identify the worst hour."

        dataset_text = f" for {dataset_type.lower()} data" if dataset_type else ""
        return (
            f"The worst hour of the day{dataset_text} is around "
            f"{int(result.hour):02d}:00, with an average AQHI of {round(result.avg_aqhi, 2)}."
        )
    finally:
        db.close()


def _answer_locations_by_category(question: str) -> str | None:
    category = _parse_category(question)
    if not category:
        return None

    lowered = question.lower()
    if not any(phrase in lowered for phrase in ["which location", "which station", "show", "locations", "stations"]):
        return None

    dataset_type = _parse_dataset_type(question)
    db = SessionLocal()
    try:
        subquery = (
            db.query(
                AQHI.location_name.label("location_name"),
                func.max(AQHI.datetime).label("max_time"),
            )
            .group_by(AQHI.location_name)
            .subquery()
        )

        query = (
            db.query(AQHI.location_name, AQHI.aqhi, AQHI.category)
            .join(
                subquery,
                (AQHI.location_name == subquery.c.location_name)
                & (AQHI.datetime == subquery.c.max_time),
            )
            .filter(AQHI.category == category)
        )

        if dataset_type:
            query = query.filter(AQHI.dataset_type == dataset_type)

        rows = query.order_by(AQHI.aqhi.desc(), AQHI.location_name.asc()).limit(5).all()
        if not rows:
            dataset_text = f" in {dataset_type} data" if dataset_type else ""
            return f"I could not find any latest station readings in the {category} category{dataset_text}."

        places = ", ".join(f"{row.location_name} ({round(row.aqhi, 2)})" for row in rows)
        dataset_text = f" in {dataset_type} data" if dataset_type else ""
        return f"Here are some {category} locations{dataset_text}: {places}."
    finally:
        db.close()


def _try_structured_answer(question: str) -> str | None:
    for handler in (
        _answer_highest_average,
        _answer_category_count,
        _answer_worst_hour,
        _answer_locations_by_category,
    ):
        answer = handler(question)
        if answer:
            return answer
    return None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        structured_answer = _try_structured_answer(request.question)
        if structured_answer:
            return ChatResponse(answer=structured_answer)

        agent = get_agent()
        contextual_question = _build_contextual_question(request.question, request.history)
        result = agent.invoke({"input": contextual_question})
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
        if any(
            marker in message
            for marker in ["reduce the length of the messages", "completion", "invalid_request_error"]
        ):
            return ChatResponse(
                answer=(
                    "That follow-up was too short or ambiguous for the AQHI assistant to answer cleanly. "
                    "Please ask a full question such as 'Show low-risk locations today' or "
                    "'Which locations are in the Low category right now?'"
                )
            )
        if any(marker in message for marker in ["rate limit reached", "rate_limit_exceeded", "tokens per day"]):
            return ChatResponse(
                answer=(
                    "The AQHI assistant is temporarily busy because the language model usage limit has been reached. "
                    "Please try again later, or ask a more direct AQHI question such as category counts, top locations, "
                    "or worst hour of day, which the dashboard can answer more efficiently."
                )
            )
        raise HTTPException(status_code=500, detail=str(e))
