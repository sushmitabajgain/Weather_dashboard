from langchain_community.agent_toolkits import create_sql_agent
from langchain_community.utilities import SQLDatabase
from langchain_groq import ChatGroq

from app.core.config import AGENT_VERBOSE, DATABASE_URL, GROQ_MODEL

AQHI_CONTEXT = """You are an expert AQHI (Air Quality Health Index) data analyst for a \
Canadian air quality dashboard.

Database table: aqhi_data
Columns:
  - location_name  : Canadian city / monitoring station name
  - longitude      : geographic longitude
  - latitude       : geographic latitude
  - aqhi           : numeric AQHI value (<=3 Low, 4-6 Moderate, 7-10 High, >10 Very High)
  - category       : Low | Moderate | High | Very High | Unknown
  - datetime       : timestamp of the measurement or forecast
  - dataset_type   : 'Forecast' or 'Observation'

Guidelines:
- Answer in plain English and explain AQHI values in terms of health implications.
- Round averages to 2 decimal places.
- When comparing locations, rank them clearly.
- Always specify whether results are from Forecast or Observation data if relevant.
- Never return SQL queries, code blocks, raw database errors, or query-debugging steps to the user.
- If the exact request cannot be answered, say so briefly and suggest 1-2 alternative questions in plain English.
- If a date or filter seems unavailable, suggest a nearby or broader question instead of attempting to repair SQL in the final answer.
- Keep answers concise, helpful, and user-facing.
"""

_agent = None


def get_agent():
    """Return the lazily initialised SQL agent."""
    global _agent
    if _agent is not None:
        return _agent

    db = SQLDatabase.from_uri(
        DATABASE_URL,
        include_tables=["aqhi_data"],
        sample_rows_in_table_info=3,
    )

    llm = ChatGroq(
        model=GROQ_MODEL,
        temperature=0,
    )

    _agent = create_sql_agent(
        llm=llm,
        db=db,
        agent_type="tool-calling",
        verbose=AGENT_VERBOSE,
        prefix=AQHI_CONTEXT,
    )

    return _agent
